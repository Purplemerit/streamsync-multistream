/**
 * Per-platform live stats fetchers.
 * Each fetch is isolated — one failure does not affect others.
 */
const { google } = require('googleapis')
const axios = require('axios')
const PlatformAuth = require('../models/PlatformAuth.model')

/** No public live-stats API available */
const NO_API_PLATFORMS = new Set(['kick', 'rumble', 'telegram', 'x', 'instagram', 'tiktok', 'bigo'])

/** OAuth + API possible but not wired in app yet */
const NEEDS_OAUTH_PLATFORMS = new Set(['facebook'])

let _twitchAppToken = null
let _twitchTokenExpiry = null

const accountStatsKey = (platform, accountId) => `${platform}::${accountId || 'default'}`

const logResult = (platform, accountId, stats) => {
  const tag = `[livestats] ${platform}/${accountId || 'default'}`
  if (stats.oauthExpired) {
    console.log(tag, '⚠️ OAuth expired —', stats.message?.slice(0, 60))
    return
  }
  if (stats.error) {
    console.log(tag, '❌ error:', stats.message || stats.error || 'unknown')
    return
  }
  if (stats.unavailable) {
    console.log(tag, '⚠️ no API —', stats.message?.slice(0, 60))
    return
  }
  if (stats.oauthRequired) {
    console.log(tag, '⚠️ needs OAuth —', stats.message?.slice(0, 60))
    return
  }
  console.log(tag, '✅', {
    isLive: stats.isLive,
    viewers: stats.viewers,
    likes: stats.likes,
    comments: stats.comments,
  })
}

const getUnavailableStats = (platform, message) => ({
  isLive: false,
  viewers: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  chatMessages: [],
  unavailable: true,
  apiSupported: false,
  message: message || `Live stats are not available for ${platform} — their API does not support it.`,
})

const getErrorStats = (message) => ({
  isLive: false,
  viewers: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  chatMessages: [],
  error: true,
  apiSupported: true,
  message: message || 'Failed to fetch stats',
})

const isYouTubeOAuthError = (err) => {
  if (!err) return false
  const msg = String(
    err.message ||
    err.response?.data?.error_description ||
    err.response?.data?.error?.message ||
    ''
  ).toLowerCase()
  const oauthCode = err.response?.data?.error || err.code
  if (oauthCode === 'invalid_grant' || msg.includes('invalid_grant')) return true
  if (msg.includes('invalid argument')) return true
  if (msg.includes('token') && (msg.includes('expired') || msg.includes('revoked') || msg.includes('invalid'))) {
    return true
  }
  if (err.code === 401 || err.code === 403 || err.response?.status === 401 || err.response?.status === 403) {
    return true
  }
  const details = err.errors || err.response?.data?.error?.errors
  if (Array.isArray(details)) {
    return details.some(
      (e) =>
        e.reason === 'authError' ||
        e.reason === 'forbidden' ||
        String(e.message || '').toLowerCase().includes('invalid')
    )
  }
  return false
}

const getOAuthExpiredStats = (platform = 'youtube') => {
  const label = platform.charAt(0).toUpperCase() + platform.slice(1)
  const message = `OAuth token expired — reconnect ${label}`
  return {
    isLive: false,
    viewers: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    chatMessages: [],
    oauthExpired: true,
    error: message,
    apiSupported: true,
    message,
  }
}

const getNeedsOAuthStats = (platform) => ({
  isLive: false,
  viewers: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  chatMessages: [],
  unavailable: false,
  apiSupported: true,
  oauthRequired: true,
  message: `Connect ${platform} via OAuth in Stream Keys to enable live stats.`,
})

const findAuth = (auths, platform, accountId) => {
  if (!auths?.length) return null
  if (accountId) {
    const match = auths.find((a) => a.platform === platform && a.accountId === accountId)
    if (match) return match
  }
  return auths.find((a) => a.platform === platform && a.connected)
}

const getTwitchAppToken = async () => {
  const now = Date.now()
  if (_twitchAppToken && _twitchTokenExpiry && now < _twitchTokenExpiry) {
    return _twitchAppToken
  }
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    console.log('[livestats] twitch: missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET')
    return null
  }
  try {
    const tokenRes = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
    })
    _twitchAppToken = tokenRes.data.access_token
    _twitchTokenExpiry = now + (tokenRes.data.expires_in - 3600) * 1000
    return _twitchAppToken
  } catch (err) {
    console.error('[livestats] twitch app token failed:', err.message)
    return null
  }
}

const getGoogleClient = async (auth) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({
    access_token: auth.accessToken,
    refresh_token: auth.refreshToken,
  })

  const expiry = auth.tokenExpiry ? new Date(auth.tokenExpiry) : null
  if (auth.refreshToken && expiry && expiry.getTime() < Date.now() + 60_000) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      oauth2Client.setCredentials(credentials)
      await PlatformAuth.updateOne(
        { _id: auth._id },
        {
          accessToken: credentials.access_token,
          tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
          ...(credentials.refresh_token ? { refreshToken: credentials.refresh_token } : {}),
        }
      )
      console.log('[livestats] youtube: access token refreshed')
    } catch (err) {
      console.error('[livestats] youtube token refresh failed:', err.message)
      if (isYouTubeOAuthError(err)) {
        return null
      }
    }
  }

  return oauth2Client
}

const fetchYouTubeStats = async (auth) => {
  if (!auth?.accessToken) {
    return getNeedsOAuthStats('youtube')
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return getErrorStats('YouTube OAuth is not configured on the server')
  }

  try {
    const oauth2Client = await getGoogleClient(auth)
    if (!oauth2Client) {
      return getOAuthExpiredStats('youtube')
    }

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })

    const searchRes = await youtube.search.list({
      part: 'id,snippet',
      forMine: true,
      eventType: 'live',
      type: 'video',
      maxResults: 1,
    })

    const videoId = searchRes.data.items?.[0]?.id?.videoId
    if (!videoId) {
      return { isLive: false, viewers: 0, likes: 0, comments: 0, shares: 0, chatMessages: [], apiSupported: true }
    }

    const videoRes = await youtube.videos.list({
      part: 'statistics,liveStreamingDetails,snippet',
      id: videoId,
    })
    const video = videoRes.data.items?.[0]

    let chatMessages = []
    const broadcastRes = await youtube.liveBroadcasts.list({
      part: 'snippet',
      broadcastStatus: 'active',
      broadcastType: 'all',
      maxResults: 1,
    })
    const chatId = broadcastRes.data.items?.[0]?.snippet?.liveChatId
    if (chatId) {
      try {
        const chatRes = await youtube.liveChatMessages.list({
          liveChatId: chatId,
          part: 'snippet,authorDetails',
          maxResults: 50,
        })
        chatMessages =
          chatRes.data.items?.map((msg) => ({
            username: msg.authorDetails?.displayName,
            message: msg.snippet?.displayMessage,
            timestamp: new Date(msg.snippet?.publishedAt),
          })) || []
      } catch (chatErr) {
        if (isYouTubeOAuthError(chatErr)) {
          return getOAuthExpiredStats('youtube')
        }
        console.log('[livestats] youtube chat fetch skipped:', chatErr.message)
      }
    }

    return {
      isLive: true,
      viewers: parseInt(video?.liveStreamingDetails?.concurrentViewers || 0, 10),
      likes: parseInt(video?.statistics?.likeCount || 0, 10),
      comments: parseInt(video?.statistics?.commentCount || 0, 10),
      shares: 0,
      chatMessages,
      apiSupported: true,
    }
  } catch (err) {
    if (isYouTubeOAuthError(err)) {
      return getOAuthExpiredStats('youtube')
    }
    throw err
  }
}

const fetchTwitchStatsByLogin = async (loginName) => {
  const appToken = await getTwitchAppToken()
  if (!appToken) {
    return getErrorStats('Twitch API credentials are not configured on the server')
  }
  if (!loginName) {
    return getErrorStats('Twitch username is not set — add it in profile or connect OAuth')
  }

  const streamRes = await axios.get('https://api.twitch.tv/helix/streams', {
    params: { user_login: loginName.toLowerCase().trim() },
    headers: {
      Authorization: `Bearer ${appToken}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID,
    },
  })

  const stream = streamRes.data.data?.[0]
  if (!stream) {
    return { isLive: false, viewers: 0, likes: 0, comments: 0, shares: 0, chatMessages: [], apiSupported: true }
  }

  return {
    isLive: true,
    viewers: stream.viewer_count || 0,
    likes: 0,
    comments: 0,
    shares: 0,
    chatMessages: [],
    apiSupported: true,
  }
}

const fetchTwitchStatsOAuth = async (auth) => {
  if (!auth?.accessToken || !auth?.platformUserId) {
    return getNeedsOAuthStats('twitch')
  }
  const streamRes = await axios.get('https://api.twitch.tv/helix/streams', {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID,
    },
    params: { user_id: auth.platformUserId },
  })
  const stream = streamRes.data.data?.[0]
  if (!stream) {
    return { isLive: false, viewers: 0, likes: 0, comments: 0, shares: 0, chatMessages: [], apiSupported: true }
  }
  return {
    isLive: true,
    viewers: stream.viewer_count || 0,
    likes: 0,
    comments: 0,
    shares: 0,
    chatMessages: [],
    apiSupported: true,
  }
}

const fetchFacebookStats = async (auth) => {
  if (!auth?.accessToken) {
    return getNeedsOAuthStats('facebook')
  }
  try {
    const res = await axios.get('https://graph.facebook.com/v19.0/me/live_videos', {
      params: {
        access_token: auth.accessToken,
        fields: 'id,status,live_views,title',
        limit: 10,
      },
    })
    const live = (res.data.data || []).find((v) => v.status === 'LIVE')
    if (!live) {
      return { isLive: false, viewers: 0, likes: 0, comments: 0, shares: 0, chatMessages: [], apiSupported: true }
    }
    return {
      isLive: true,
      viewers: parseInt(live.live_views || 0, 10),
      likes: 0,
      comments: 0,
      shares: 0,
      chatMessages: [],
      apiSupported: true,
    }
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message
    if (err.response?.status === 401 || err.response?.status === 403) {
      return { ...getNeedsOAuthStats('facebook'), message: `Facebook OAuth error: ${msg}` }
    }
    return getErrorStats(`Facebook API: ${msg}`)
  }
}

/**
 * Fetch stats for one platform account on an active stream.
 */
async function fetchPlatformAccountStats(platform, accountId, label, user, auths) {
  const base = { platform, accountId: accountId || null, label: label || null }

  if (NO_API_PLATFORMS.has(platform)) {
    const stats = { ...base, ...getUnavailableStats(platform) }
    logResult(platform, accountId, stats)
    return stats
  }

  if (NEEDS_OAUTH_PLATFORMS.has(platform)) {
    const auth = findAuth(auths, platform, accountId)
    if (!auth?.connected || !auth?.accessToken) {
      const stats = { ...base, ...getNeedsOAuthStats(platform) }
      logResult(platform, accountId, stats)
      return stats
    }
    try {
      const stats = { ...base, ...(await fetchFacebookStats(auth)) }
      logResult(platform, accountId, stats)
      return stats
    } catch (err) {
      const stats = { ...base, ...getErrorStats(err.message) }
      logResult(platform, accountId, stats)
      return stats
    }
  }

  if (platform === 'youtube') {
    const auth = findAuth(auths, platform, accountId)
    if (!auth?.connected) {
      const stats = { ...base, ...getNeedsOAuthStats('youtube') }
      logResult(platform, accountId, stats)
      return stats
    }
    try {
      const stats = { ...base, ...(await fetchYouTubeStats(auth)) }
      logResult(platform, accountId, stats)
      return stats
    } catch (err) {
      const stats = {
        ...base,
        ...(isYouTubeOAuthError(err) ? getOAuthExpiredStats('youtube') : getErrorStats(err.message)),
      }
      logResult(platform, accountId, stats)
      return stats
    }
  }

  if (platform === 'twitch') {
    try {
      const auth = findAuth(auths, platform, accountId)
      let twitchStats
      const login =
        auth?.platformUsername ||
        user?.twitchUsername ||
        (auth?.platformUserId ? null : null)

      if (auth?.platformUserId && auth?.accessToken) {
        twitchStats = await fetchTwitchStatsOAuth(auth)
      } else if (login || user?.twitchUsername) {
        twitchStats = await fetchTwitchStatsByLogin(login || user.twitchUsername)
      } else if (auth) {
        twitchStats = await fetchTwitchStatsByLogin(auth.platformUsername)
      } else {
        twitchStats = getNeedsOAuthStats('twitch')
      }
      const stats = { ...base, ...twitchStats }
      logResult(platform, accountId, stats)
      return stats
    } catch (err) {
      const stats = { ...base, ...getErrorStats(err.message) }
      logResult(platform, accountId, stats)
      return stats
    }
  }

  const stats = { ...base, ...getUnavailableStats(platform) }
  logResult(platform, accountId, stats)
  return stats
}

async function fetchLiveStreamAccounts(stream, user, auths, { persist = true } = {}) {
  const LiveStats = require('../models/LiveStats.model')
  const platforms = {}
  const accounts = []

  for (const entry of stream.platforms || []) {
    const { name: platform, accountId, label } = entry
    const stats = await fetchPlatformAccountStats(platform, accountId, label, user, auths)
    const key = accountStatsKey(platform, accountId)

    if (persist && !stats.unavailable && !stats.error && stream.status === 'live') {
      await LiveStats.findOneAndUpdate(
        { user: stream.userId, stream: stream._id, platform, accountId: accountId || undefined },
        {
          ...stats,
          accountId: accountId || undefined,
          snapshotAt: new Date(),
        },
        { upsert: true, returnDocument: 'after' }
      )
    }

    platforms[key] = stats
    accounts.push(stats)
  }

  return { platforms, accounts }
}

async function loadSavedPlatformStats(stream, userId) {
  const LiveStats = require('../models/LiveStats.model')
  const platforms = {}
  const accounts = []

  for (const entry of stream.platforms || []) {
    const { name: platform, accountId, label } = entry
    const key = accountStatsKey(platform, accountId)
    const saved = await LiveStats.findOne({
      user: userId,
      stream: stream._id,
      platform,
      ...(accountId ? { accountId } : {}),
    }).sort({ snapshotAt: -1 })

    const stats = saved
      ? {
          platform,
          accountId,
          label,
          isLive: false,
          viewers: saved.viewers ?? 0,
          likes: saved.likes ?? 0,
          comments: saved.comments ?? 0,
          shares: saved.shares ?? 0,
          chatMessages: saved.chatMessages || [],
          peakViewers: saved.viewers ?? 0,
          apiSupported: !NO_API_PLATFORMS.has(platform),
        }
      : {
          platform,
          accountId,
          label,
          isLive: false,
          viewers: 0,
          likes: 0,
          comments: 0,
          chatMessages: [],
        }

    platforms[key] = stats
    accounts.push(stats)
  }

  return { platforms, accounts }
}

module.exports = {
  NO_API_PLATFORMS,
  NEEDS_OAUTH_PLATFORMS,
  accountStatsKey,
  getTwitchAppToken,
  fetchPlatformAccountStats,
  fetchLiveStreamAccounts,
  loadSavedPlatformStats,
  getUnavailableStats,
}
