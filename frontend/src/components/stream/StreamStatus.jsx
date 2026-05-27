import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { streamAPI } from '../../api/stream.api'
import { useStream } from '../../hooks/useStream'
import { Square, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { PLATFORM_LABELS } from '../../constants/platforms'

export default function StreamStatus() {
  const { sessionId, isStreaming, activeAccounts, stopStream } = useStream()
  const [duration, setDuration] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isStreaming) return
    const timer = setInterval(() => setDuration((d) => d + 1), 1000)
    return () => clearInterval(timer)
  }, [isStreaming])

  if (!isStreaming || !sessionId) return null

  const handleStop = async () => {
    try {
      await streamAPI.stop(sessionId)
      stopStream()
      toast.success('Stream stopped!')
      navigate('/history')
    } catch {
      toast.error('Failed to stop stream')
    }
  }

  const fmt = (s) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-80 card border-red-200 shadow-card-hover p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
        <span className="text-red-600 font-bold text-sm">LIVE</span>
        <span className="text-gray-800 font-mono text-lg font-bold tabular-nums flex items-center gap-1">
          <Clock size={14} className="text-gray-400" /> {fmt(duration)}
        </span>
        <button
          type="button"
          onClick={handleStop}
          className="ml-auto bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition-all duration-200 hover:scale-[1.02]"
        >
          <Square size={12} /> Stop
        </button>
      </div>
      {activeAccounts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
          {activeAccounts.map((acc) => {
            const platform = acc.platform || acc.name
            return (
              <span
                key={`${platform}-${acc.accountId}`}
                className="badge bg-red-50 text-red-700 border-red-100 text-[10px]"
              >
                {PLATFORM_LABELS[platform] || platform} · {acc.label || 'Account'}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
