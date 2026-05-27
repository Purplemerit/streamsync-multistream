const platforms = {
  youtube: {
    name: 'YouTube Live',
    rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2/',
    type: 'api'
  },
  twitch: {
    name: 'Twitch',
    rtmpUrl: 'rtmp://live.twitch.tv/app/',
    type: 'api'
  },
  facebook: {
    name: 'Facebook Live',
    rtmpUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/',
    type: 'api'
  },
  kick: {
    name: 'Kick',
    rtmpUrl: null,
    type: 'rtmp'
  },
  rumble: {
    name: 'Rumble',
    rtmpUrl: 'rtmp://rtmp.rumble.com/live/',
    type: 'rtmp'
  },
  telegram: {
    name: 'Telegram',
    rtmpUrl: 'rtmp://dc4-1.rtmp.t.me/s/',
    type: 'rtmp'
  },
  x: {
    name: 'X (Twitter)',
    rtmpUrl: 'rtmp://ingest.pscp.tv:80/x/',
    type: 'rtmp'
  },
  instagram: {
    name: 'Instagram Live',
    rtmpUrl: null,
    type: 'session'
  },
  tiktok: {
    name: 'TikTok',
    rtmpUrl: 'rtmp://push-rtmp-global.tiktok.com/live/',
    type: 'session'
  },
  bigo: {
    name: 'BIGO LIVE',
    rtmpUrl: 'rtmp://livepush.bigo.tv/live/',
    type: 'session'
  },
};

module.exports = platforms;