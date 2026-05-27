import { useEffect, useState, useRef, useCallback } from 'react'
import API from '../../utils/axios'
import { Bell, X, Check } from 'lucide-react'
import { formatRelativeTime } from '../../utils/relativeTime'

const TYPE_ICONS = {
  video_deleted: '🗑️',
  stream_deleted: '📡',
  new_user: '👤',
  stream_error: '⚠️',
  stream_completed: '✅',
  system: '🔔',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const ref = useRef(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get('/notifications')
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unreadCount)
    } catch {
      /* ignore fetch errors */
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => fetchNotifications())
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), 60000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllRead = async () => {
    try {
      await API.put('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      /* ignore */
    }
  }

  const deleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`)
      setNotifications((prev) => {
        const removed = prev.find((n) => n._id === id)
        if (removed && !removed.read) {
          setUnreadCount((c) => Math.max(0, c - 1))
        }
        return prev.filter((n) => n._id !== id)
      })
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition"
      >
        <Bell size={20} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition ${!n.read ? 'bg-violet-50/50' : ''}`}
                >
                  <span className="text-lg mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.createdAt, nowMs)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 bg-violet-500 rounded-full mt-1.5 shrink-0" />
                  )}
                  <button
                    onClick={() => deleteNotification(n._id)}
                    className="text-slate-400 hover:text-slate-600 transition shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
