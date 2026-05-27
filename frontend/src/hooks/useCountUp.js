import { useEffect, useState } from 'react'

export function useCountUp(end, { duration = 1200, start = 0, enabled = true, decimals = 0 } = {}) {
  const target = enabled ? Number(end) || 0 : start
  const [value, setValue] = useState(() => (target === 0 ? 0 : start))

  useEffect(() => {
    if (!enabled) return
    if (target === 0) {
      const frame = requestAnimationFrame(() => setValue(0))
      return () => cancelAnimationFrame(frame)
    }

    let startTime = null
    let frame

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (target - start) * eased
      setValue(decimals > 0 ? Number(current.toFixed(decimals)) : Math.floor(current))
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [end, duration, start, enabled, decimals, target])

  return enabled && target === 0 ? 0 : value
}
