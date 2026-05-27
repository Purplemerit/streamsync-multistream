export const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', short: 'YT', color: 'bg-red-500', dot: 'bg-red-500', hex: '#FF0000' },
  { id: 'twitch', label: 'Twitch', short: 'TW', color: 'bg-purple-500', dot: 'bg-purple-500', hex: '#9146FF' },
  { id: 'facebook', label: 'Facebook', short: 'FB', color: 'bg-blue-600', dot: 'bg-blue-600', hex: '#1877F2' },
  { id: 'kick', label: 'Kick', short: 'KC', color: 'bg-green-500', dot: 'bg-green-500', hex: '#53FC18', needsUrl: true },
  { id: 'rumble', label: 'Rumble', short: 'RB', color: 'bg-orange-500', dot: 'bg-orange-500', hex: '#85C742' },
  { id: 'telegram', label: 'Telegram', short: 'TG', color: 'bg-sky-500', dot: 'bg-sky-500', hex: '#229ED9' },
  { id: 'x', label: 'X (Twitter)', short: 'X', color: 'bg-slate-800', dot: 'bg-slate-800', hex: '#0f1419' },
  { id: 'instagram', label: 'Instagram', short: 'IG', color: 'bg-pink-500', dot: 'bg-pink-500', hex: '#E1306C', needsUrl: true },
  { id: 'tiktok', label: 'TikTok', short: 'TK', color: 'bg-neutral-900', dot: 'bg-neutral-900', hex: '#010101' },
  { id: 'bigo', label: 'BIGO LIVE', short: 'BG', color: 'bg-amber-500', dot: 'bg-amber-500', hex: '#f59e0b' },
]

export const PLATFORM_LABELS = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p.label])
)

export const getPlatform = (id) =>
  PLATFORMS.find((p) => p.id === id) || { id, label: id, short: id, color: 'bg-slate-400', dot: 'bg-slate-400', hex: '#94a3b8' }
