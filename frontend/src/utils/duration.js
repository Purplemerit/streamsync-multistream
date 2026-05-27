const MAX_STREAM_SECONDS = 24 * 3600 - 1

function parseDurationString(str) {
  if (!str || typeof str !== 'string') return null
  const trimmed = str.trim()
  if (!trimmed || trimmed === '—') return null

  const parts = trimmed.split(':').map((p) => parseInt(p, 10))
  if (parts.some((n) => Number.isNaN(n))) return null

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return null
}

function secondsToHMS(totalSeconds) {
  const capped = Math.min(Math.max(0, totalSeconds), MAX_STREAM_SECONDS)
  const h = Math.floor(capped / 3600)
  const m = Math.floor((capped % 3600) / 60)
  const s = capped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Display stream duration (HH:MM:SS, max 23:59:59). Invalid / corrupted → "—"
 */
export function formatStreamDuration(duration, startedAt, stoppedAt) {
  let seconds = null

  if (startedAt && stoppedAt) {
    const diff = Math.floor((new Date(stoppedAt) - new Date(startedAt)) / 1000)
    if (Number.isFinite(diff) && diff >= 0) {
      seconds = diff
    }
  }

  if (seconds == null) {
    seconds = parseDurationString(duration)
  }

  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return '—'
  }

  if (seconds >= MAX_STREAM_SECONDS + 1) {
    return '—'
  }

  return secondsToHMS(seconds)
}
