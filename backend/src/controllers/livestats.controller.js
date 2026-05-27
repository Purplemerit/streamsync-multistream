const LiveStats = require('../models/LiveStats.model')
const PlatformAuth = require('../models/PlatformAuth.model')
const {
  accountStatsKey,
  fetchLiveStreamAccounts,
  loadSavedPlatformStats,
  fetchPlatformAccountStats,
} = require('../services/livestats.fetcher')

const buildStreamPayload = (stream) => ({
  _id: stream._id,
  title: stream.videoId?.title || 'Stream',
  createdAt: stream.startedAt,
  status: stream.status,
  platforms: (stream.platforms || []).map((p) => p.name),
  accounts: (stream.platforms || []).map((p) => ({
    platform: p.name,
    accountId: p.accountId,
    label: p.label,
  })),
})

// ─── FETCH AND SAVE STATS (manual refresh for one stream) ─────────────────
const fetchAndSaveStats = async (req, res) => {
  try {
    const Stream = require('../models/Stream.model')
    const User = require('../models/User.model')

    const stream = await Stream.findById(req.params.streamId)
    if (!stream || String(stream.userId) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Stream not found' })
    }

    const user = await User.findById(req.user._id)
    const auths = await PlatformAuth.find({ user: req.user._id, connected: true })

    const { accounts } = await fetchLiveStreamAccounts(stream, user, auths, { persist: true })
    res.json(accounts)
  } catch (err) {
    console.error('fetchAndSaveStats error:', err)
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
}

// ─── GET STATS FOR A SINGLE STREAM (latest snapshot per account) ──────────
const getStreamStats = async (req, res) => {
  try {
    const stats = await LiveStats.find({
      user: req.user._id,
      stream: req.params.streamId,
    }).sort({ snapshotAt: -1 })

    const grouped = {}
    stats.forEach((s) => {
      const key = accountStatsKey(s.platform, s.accountId)
      if (!grouped[key]) grouped[key] = s
    })
    res.json(grouped)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get stream stats' })
  }
}

// ─── ACTIVE LIVE STREAM — optimized polling endpoint ──────────────────────
const getActiveStreamStats = async (req, res) => {
  try {
    const Stream = require('../models/Stream.model')
    const User = require('../models/User.model')

    const stream = await Stream.findOne({ userId: req.user._id, status: 'live' })
      .populate('videoId', 'title')
      .sort({ startedAt: -1 })

    if (!stream) {
      return res.json({ active: false, message: 'No active stream' })
    }

    const user = await User.findById(req.user._id)
    const auths = await PlatformAuth.find({ user: req.user._id, connected: true })
    const { platforms, accounts } = await fetchLiveStreamAccounts(stream, user, auths, { persist: true })

    res.json({
      active: true,
      stream: buildStreamPayload(stream),
      platforms,
      accounts,
    })
  } catch (err) {
    console.error('getActiveStreamStats error:', err)
    res.status(500).json({ message: 'Failed to fetch active stream stats' })
  }
}

// ─── GET ALL STREAMS STATS FOR USER (LiveStatsPage) ───────────────────────
const getUserAllStreamsStats = async (req, res) => {
  try {
    const User = require('../models/User.model')
    const Stream = require('../models/Stream.model')

    const user = await User.findById(req.user._id)
    const auths = await PlatformAuth.find({ user: req.user._id, connected: true })

    const streams = await Stream.find({ userId: req.user._id })
      .populate('videoId', 'title')
      .sort({ startedAt: -1 })
      .limit(10)

    const results = []

    for (const stream of streams) {
      let platforms
      let accounts

      if (stream.status === 'live') {
        console.log(`[livestats] polling live stream ${stream._id} (${stream.platforms?.length} accounts)`)
        ;({ platforms, accounts } = await fetchLiveStreamAccounts(stream, user, auths, { persist: true }))
      } else {
        ;({ platforms, accounts } = await loadSavedPlatformStats(stream, req.user._id))
      }

      results.push({
        stream: buildStreamPayload(stream),
        platforms,
        accounts,
      })
    }

    res.json(results)
  } catch (err) {
    console.error('getUserAllStreamsStats error:', err)
    res.status(500).json({ message: 'Failed to get user stats' })
  }
}

// ─── ADMIN GLOBAL STATS ───────────────────────────────────────────────────
const getAdminGlobalStats = async (req, res) => {
  try {
    const Stream = require('../models/Stream.model')
    const User = require('../models/User.model')
    const ALL_PLATFORMS = ['youtube', 'twitch', 'facebook', 'kick', 'rumble', 'telegram', 'x', 'instagram', 'tiktok', 'bigo']
    const NO_API_PLATFORMS = ['kick', 'rumble', 'telegram', 'x', 'instagram', 'tiktok', 'bigo']

    const results = {}

    for (const platform of ALL_PLATFORMS) {
      if (NO_API_PLATFORMS.includes(platform)) {
        results[platform] = { unavailable: true, message: `Stats not available for ${platform}` }
        continue
      }

      const liveStreams = await Stream.find({ status: 'live' }).populate('userId', 'name email')
      const platformLiveStreams = liveStreams.filter((s) =>
        s.platforms.some((p) => p.name === platform)
      )

      let totalViewers = 0
      let totalLikes = 0
      let totalComments = 0
      let topStreamer = null
      let topViewers = 0

      for (const stream of platformLiveStreams) {
        for (const entry of stream.platforms.filter((p) => p.name === platform)) {
          try {
            const user = await User.findById(stream.userId._id)
            const auths = await PlatformAuth.find({ user: stream.userId._id, connected: true })
            const stats = await fetchPlatformAccountStats(
              entry.name,
              entry.accountId,
              entry.label,
              user,
              auths
            )
            const viewers = stats.viewers || 0
            const likes = stats.likes || 0
            const comments = stats.comments || 0

            totalViewers += viewers
            totalLikes += likes
            totalComments += comments

            if (viewers > topViewers) {
              topViewers = viewers
              topStreamer = { name: stream.userId?.name, viewers }
            }
          } catch (e) {
            console.log(`[livestats] admin ${platform}:`, e.message)
          }
        }
      }

      const savedStats = await LiveStats.find({ platform })
      for (const s of savedStats) {
        if (platformLiveStreams.some((st) => String(st._id) === String(s.stream))) continue
        totalViewers += s.viewers || 0
        totalLikes += s.likes || 0
        totalComments += s.comments || 0
      }

      results[platform] = {
        totalViewers,
        totalLikes,
        totalComments,
        activeStreams: platformLiveStreams.length,
        topStreamer,
      }
    }

    res.json(results)
  } catch (err) {
    console.error('getAdminGlobalStats error:', err)
    res.status(500).json({ message: 'Failed to get global stats' })
  }
}

const deleteChatHistory = async (req, res) => {
  try {
    await LiveStats.updateMany(
      { user: req.user._id, stream: req.params.streamId },
      { $set: { chatMessages: [] } }
    )
    res.json({ message: 'Chat history cleared' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear chat history' })
  }
}

module.exports = {
  fetchAndSaveStats,
  getStreamStats,
  getActiveStreamStats,
  getUserAllStreamsStats,
  getAdminGlobalStats,
  deleteChatHistory,
}
