import { useState } from 'react'

const loadActiveAccounts = () => {
  try {
    const stored = localStorage.getItem('activeAccounts')
    if (stored) return JSON.parse(stored)
    const legacy = localStorage.getItem('activePlatforms')
    if (legacy) {
      return JSON.parse(legacy).map((id) => ({
        platform: id,
        name: id,
        label: id,
      }))
    }
  } catch {
    /* ignore */
  }
  return []
}

export function useStream() {
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('activeSessionId') || null)
  const [isStreaming, setIsStreaming] = useState(() => !!localStorage.getItem('activeSessionId'))
  const [activeAccounts, setActiveAccounts] = useState(loadActiveAccounts)

  const startStream = (sid, accounts) => {
    localStorage.setItem('activeSessionId', sid)
    localStorage.setItem('activeAccounts', JSON.stringify(accounts))
    localStorage.removeItem('activePlatforms')
    setSessionId(sid)
    setIsStreaming(true)
    setActiveAccounts(accounts)
  }

  const stopStream = () => {
    localStorage.removeItem('activeSessionId')
    localStorage.removeItem('activeAccounts')
    localStorage.removeItem('activePlatforms')
    setSessionId(null)
    setIsStreaming(false)
    setActiveAccounts([])
  }

  return { sessionId, isStreaming, activeAccounts, startStream, stopStream }
}
