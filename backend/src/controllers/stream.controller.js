const { randomUUID } = require('crypto');
const Video = require('../models/Video.model');
const Stream = require('../models/Stream.model');
const StreamHistory = require('../models/StreamHistory.model');
const PlatformStats = require('../models/PlatformStats.model');
const streamManager = require('../services/stream.manager');
const platformsConfig = require('../config/platforms.config');
const { accountOutputKey } = require('../utils/platform.util');
const { getDurationFromRange } = require('../utils/duration.util');
const { createNotification, notifyAdmins } = require('../services/notification.service');

const MIN_RUN_SECONDS = 10;
const QUICK_FAIL_SECONDS = 5;

const toFailedSet = (failedDestinations) => {
  if (failedDestinations instanceof Set) return failedDestinations;
  return new Set(failedDestinations || []);
};

// START STREAM
const startStream = async (req, res) => {
  try {
    const { videoId, platforms } = req.body;

    if (!videoId || !platforms || platforms.length === 0) {
      return res.status(400).json({ message: 'Video and at least one platform are required' });
    }

    const video = await Video.findOne({ _id: videoId, userId: req.user.id, status: 'active' });
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const platformList = [];
    for (const p of platforms) {
      const config = platformsConfig[p.name];
      if (!config) return res.status(400).json({ message: `Unknown platform: ${p.name}` });
      if (!p.accountId) return res.status(400).json({ message: `Account ID missing for ${config.name}` });
      if (!p.streamKey) return res.status(400).json({ message: `Stream key missing for ${config.name}` });
      if (config.rtmpUrl === null && !p.rtmpUrl) return res.status(400).json({ message: `Stream URL missing for ${config.name}` });

      platformList.push({
        name: p.name,
        accountId: p.accountId,
        label: p.label || undefined,
        streamKey: p.streamKey,
        rtmpUrl: p.rtmpUrl || config.rtmpUrl
      });
    }

    const sessionId = randomUUID();

    const stream = await Stream.create({
      sessionId,
      userId: req.user.id,
      videoId: video._id,
      platforms: platformList,
      status: 'live',
      startedAt: new Date()
    });

    const destinationSummary = platformList
      .map((p) => `${p.name}${p.label ? ` (${p.label})` : ''}`)
      .join(', ');
    await notifyAdmins(
      'system',
      'Stream Started',
      `${req.user.name || 'A user'} started streaming "${video.title}" to ${platformList.length} destination(s): ${destinationSummary}.`
    );

    const io = req.app.get('io');

    streamManager.startSession(
      sessionId,
      video.filepath,
      platformList,
      io,
      async (err, exitCode, meta) => {
        const failed = meta?.failedDestinations ?? streamManager.getFailedDestinations(sessionId);
        await Stream.findOneAndUpdate(
          { sessionId, status: 'live' },
          { status: 'error', stoppedAt: new Date() },
          { returnDocument: 'after' }
        );
        await createNotification(
          req.user.id,
          'stream_error',
          'Stream stopped unexpectedly',
          `Your stream of "${video.title}" stopped due to an error: ${err.message}`
        );
        await notifyAdmins(
          'stream_error',
          'Stream Error',
          `Stream of "${video.title}" failed with error: ${err.message}`
        );
        await finalizeStreamSession(sessionId, 'error', failed, {
          exitCode: exitCode ?? meta?.exitCode,
          hadProgress: meta?.hadProgress ?? false,
        });
      },
      async (exitCode, meta) => {
        const failed = meta?.failedDestinations ?? new Set();
        await Stream.findOneAndUpdate(
          { sessionId, status: 'live' },
          { status: 'stopped', stoppedAt: new Date() },
          { returnDocument: 'after' }
        );
        await finalizeStreamSession(sessionId, 'auto_ended', failed, {
          exitCode: exitCode ?? meta?.exitCode ?? 0,
          hadProgress: meta?.hadProgress ?? false,
        });
      }
    );

    res.status(201).json({
      message: 'Stream started successfully',
      sessionId,
      streamId: stream._id,
      platforms: platformList.map(p => p.name)
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// STOP STREAM
const stopStream = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const existing = await Stream.findOne({ sessionId, userId: req.user.id });
    if (!existing) return res.status(404).json({ message: 'Stream session not found' });

    if (existing.status !== 'live') {
      return res.json({
        message: 'Stream already stopped',
        sessionId,
      });
    }

    const sessionMeta = streamManager.stopSession(sessionId) || streamManager.getSessionSnapshot(sessionId);
    const failedDestinations = sessionMeta?.failedDestinations ?? streamManager.getFailedDestinations(sessionId);
    console.log(`Stream ${sessionId} stop requested`);

    await Stream.findOneAndUpdate(
      { sessionId, userId: req.user.id, status: 'live' },
      { status: 'stopped', stoppedAt: new Date() },
      { returnDocument: 'after' }
    );

    const stream = await Stream.findOne({ sessionId }).populate('videoId', 'title');

    await finalizeStreamSession(sessionId, 'user_stopped', failedDestinations, {
      exitCode: sessionMeta?.exitCode ?? null,
      hadProgress: sessionMeta?.hadProgress ?? false,
    });

    // ── Auto-fetch and save live stats after stream ends ──────────────────
    try {
      const PlatformAuth = require('../models/PlatformAuth.model');
      const LiveStats = require('../models/LiveStats.model');
      const User = require('../models/User.model');
      const { google } = require('googleapis');
      const axios = require('axios');

      const user = await User.findById(req.user.id);
      const auths = await PlatformAuth.find({ user: req.user.id, connected: true });

      // Get Twitch app token once (works without OAuth)
      let twitchAppToken = null;
      try {
        const tokenRes = await axios.post('https://id.twitch.tv/oauth2/token', null, {
          params: {
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_CLIENT_SECRET,
            grant_type: 'client_credentials'
          }
        });
        twitchAppToken = tokenRes.data.access_token;
      } catch (e) {
        console.log('Failed to get Twitch app token:', e.message);
      }

      // Loop through ALL platforms that were in this stream
      for (const platform of stream.platforms) {
        const platformName = platform.name;
        let stats = {};

        if (platformName === 'youtube') {
          const auth = auths.find(a => a.platform === 'youtube');
          stats = {
            isLive: false,
            viewers: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            chatMessages: [],
            unavailable: false
          };
          if (auth) {
            try {
              const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
              );
              oauth2Client.setCredentials({
                access_token: auth.accessToken,
                refresh_token: auth.refreshToken
              });
              const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
              const broadcastRes = await youtube.liveBroadcasts.list({
                part: 'snippet,statistics',
                broadcastStatus: 'all',
                broadcastType: 'all',
                maxResults: 1
              });
              const broadcast = broadcastRes.data.items?.[0];
              if (broadcast) {
                const videoRes = await youtube.videos.list({
                  part: 'statistics,liveStreamingDetails',
                  id: broadcast.id
                });
                const vid = videoRes.data.items?.[0];
                stats.viewers = parseInt(vid?.liveStreamingDetails?.concurrentViewers || 0);
                stats.likes = parseInt(vid?.statistics?.likeCount || 0);
                stats.comments = parseInt(vid?.statistics?.commentCount || 0);
              }
            } catch (e) {
              console.log('YouTube stats fetch error:', e.message);
            }
          }

        } else if (platformName === 'twitch') {
          stats = {
            isLive: false,
            viewers: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            chatMessages: [],
            unavailable: false
          };

          if (twitchAppToken && user?.twitchUsername) {
            try {
              const streamRes = await axios.get('https://api.twitch.tv/helix/streams', {
                params: { user_login: user.twitchUsername },
                headers: {
                  'Authorization': `Bearer ${twitchAppToken}`,
                  'Client-Id': process.env.TWITCH_CLIENT_ID
                }
              });
              stats.viewers = streamRes.data.data?.[0]?.viewer_count || 0;
              console.log(`Final Twitch viewers for ${user.twitchUsername}:`, stats.viewers);
            } catch (e) {
              console.log('Twitch stats fetch error:', e.message);
            }
          } else if (twitchAppToken) {
            const auth = auths.find(a => a.platform === 'twitch');
            if (auth?.platformUserId) {
              try {
                const streamRes = await axios.get('https://api.twitch.tv/helix/streams', {
                  params: { user_id: auth.platformUserId },
                  headers: {
                    'Authorization': `Bearer ${twitchAppToken}`,
                    'Client-Id': process.env.TWITCH_CLIENT_ID
                  }
                });
                stats.viewers = streamRes.data.data?.[0]?.viewer_count || 0;
              } catch (e) {
                console.log('Twitch OAuth stats fetch error:', e.message);
              }
            }
          }

        } else {
          stats = {
            isLive: false,
            viewers: null,
            likes: null,
            comments: null,
            shares: null,
            chatMessages: [],
            unavailable: true,
            message: `Live stats are not available for ${platformName}`
          };
        }

        await LiveStats.findOneAndUpdate(
          {
            user: req.user.id,
            stream: stream._id,
            platform: platformName,
            accountId: platform.accountId,
          },
          { ...stats, accountId: platform.accountId, snapshotAt: new Date() },
          { upsert: true, returnDocument: 'after' }
        );
        console.log(`Stats saved for ${platformName}`);
      }
    } catch (statsErr) {
      console.error('Error auto-fetching stats:', statsErr.message);
    }

    streamManager.endSession(sessionId);

    res.json({
      message: 'Stream stopped successfully on all platforms',
      sessionId,
      note: 'Platforms may take 1-2 minutes to show offline status'
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET STREAM STATUS
const getStreamStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = streamManager.getSession(sessionId);
    const stream = await Stream.findOne({ sessionId, userId: req.user.id });
    if (!stream) return res.status(404).json({ message: 'Stream not found' });
    res.json({
      sessionId,
      status: session ? 'live' : 'stopped',
      platforms: stream.platforms,
      startedAt: stream.startedAt
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET STREAM HISTORY
const getStreamHistory = async (req, res) => {
  try {
    const history = await StreamHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('videoId', 'title');
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// HELPER — Finalize session: save history once or discard failed attempts
const finalizeStreamSession = async (sessionId, endReason, failedDestinations = new Set(), options = {}) => {
  try {
    const failed = toFailedSet(failedDestinations);

    const existingHistory = await StreamHistory.findOne({ sessionId });
    if (existingHistory) {
      console.log(`[finalize] History already saved for session ${sessionId}, skipping`);
      streamManager.endSession(sessionId);
      return { saved: false, duplicate: true };
    }

    const stream = await Stream.findOne({ sessionId }).populate('videoId', 'title');
    if (!stream) {
      streamManager.endSession(sessionId);
      return { saved: false, missing: true };
    }

    const stopTime = stream.stoppedAt || new Date();
    if (!stream.stoppedAt) {
      await Stream.findOneAndUpdate(
        { sessionId },
        { stoppedAt: stopTime },
        { returnDocument: 'after' }
      );
    }

    const elapsedSec = Math.max(0, (stopTime - stream.startedAt) / 1000);
    const exitCode = options.exitCode ?? null;
    const hadProgress = options.hadProgress ?? false;
    const successCount = stream.platforms.filter(
      (p) => !failed.has(accountOutputKey(p))
    ).length;

    const quickFailure =
      exitCode != null && exitCode !== 0 && elapsedSec < QUICK_FAIL_SECONDS;
    const shouldSave =
      !quickFailure && (elapsedSec >= MIN_RUN_SECONDS || successCount > 0);

    streamManager.endSession(sessionId);

    if (!shouldSave) {
      await Stream.findByIdAndDelete(stream._id);
      console.log(
        `[finalize] Discarded session ${sessionId} (${elapsedSec.toFixed(1)}s, exit ${exitCode}, success ${successCount})`
      );
      return { saved: false, deleted: true };
    }

    let finalEndReason = endReason;
    if (exitCode != null && exitCode !== 0) finalEndReason = 'failed';
    else if (successCount === 0 && elapsedSec < MIN_RUN_SECONDS) finalEndReason = 'failed';

    const duration = getDurationFromRange(stream.startedAt, stopTime);
    const platformsStreamed = stream.platforms.map((p) => ({
      name: p.name,
      accountId: p.accountId,
      label: p.label,
      status: failed.has(accountOutputKey(p)) ? 'error' : 'success',
    }));

    await StreamHistory.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: {
          sessionId,
          userId: stream.userId,
          streamId: stream._id,
          videoId: stream.videoId._id,
          videoTitle: stream.videoId.title,
          platformsStreamed,
          duration,
          startedAt: stream.startedAt,
          stoppedAt: stopTime,
          endReason: finalEndReason,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const isSuccessful =
      finalEndReason === 'user_stopped' || finalEndReason === 'auto_ended';

    if (isSuccessful) {
      const successfulPlatforms = stream.platforms.filter(
        (p) => !failed.has(accountOutputKey(p))
      );
      console.log(`Updating PlatformStats for ${successfulPlatforms.length} successful platform(s)`);

      for (const p of successfulPlatforms) {
        await PlatformStats.findOneAndUpdate(
          { platform: p.name },
          { $inc: { totalStreams: 1 } },
          { upsert: true, returnDocument: 'after' }
        );
      }

      await createNotification(
        stream.userId,
        'stream_completed',
        'Stream completed! ✅',
        `Your stream of "${stream.videoId.title}" ran for ${duration} on ${successfulPlatforms.length} platform(s) successfully.`
      );

      await notifyAdmins(
        'system',
        'Stream Completed',
        `Stream of "${stream.videoId.title}" completed after ${duration} on ${successfulPlatforms.length} platform(s).`
      );
    } else if (finalEndReason === 'failed') {
      await createNotification(
        stream.userId,
        'stream_error',
        'Stream failed',
        `Your stream of "${stream.videoId.title}" did not complete successfully.`
      );
    }

    console.log(`[finalize] History saved for ${sessionId} (${finalEndReason}, ${duration})`);
    return { saved: true, endReason: finalEndReason };
  } catch (err) {
    console.error('Error finalizing stream session:', err.message);
    streamManager.endSession(sessionId);
    return { saved: false, error: err.message };
  }
};

// GET ALL ACTIVE STREAMS (Admin)
const getActiveStreams = async (req, res) => {
  try {
    const streams = await Stream.find({ status: 'live' })
      .populate('userId', 'name email')
      .populate('videoId', 'title')
      .sort({ startedAt: -1 });
    res.json(streams);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET STREAM HISTORY (Admin - all users)
const getAdminStreamHistory = async (req, res) => {
  try {
    const history = await StreamHistory.find()
      .populate('userId', 'name email')
      .populate('videoId', 'title')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  startStream,
  stopStream,
  getStreamStatus,
  getStreamHistory,
  getActiveStreams,
  getAdminStreamHistory
};