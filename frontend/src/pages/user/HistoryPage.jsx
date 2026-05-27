import { useEffect, useState, useMemo, useCallback } from 'react'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import toast from 'react-hot-toast'
import { History, Clock, Trash2, Filter } from 'lucide-react'
import { PLATFORMS, PLATFORM_LABELS, getPlatform } from '../../constants/platforms'
import { formatStreamDuration } from '../../utils/duration'
import { useAuth } from '../../hooks/useAuth'
import Loader from '../../components/common/Loader'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { deferEffect } from '../../utils/deferEffect'

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [platformFilter, setPlatformFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchHistory = useCallback(async () => {
    setError(false)
    setLoading(true)
    try {
      const res = await API.get('/stream/history')
      setHistory(res.data)
    } catch {
      setError(true)
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !user) return
    deferEffect(() => fetchHistory())
  }, [authLoading, user, fetchHistory])

  const filtered = useMemo(() => {
    return history.filter((h) => {
      if (platformFilter !== 'all') {
        const hasPlatform = h.platformsStreamed?.some((p) => p.name === platformFilter)
        if (!hasPlatform) return false
      }
      const started = new Date(h.startedAt)
      if (dateFrom && started < new Date(dateFrom)) return false
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        if (started > end) return false
      }
      return true
    })
  }, [history, platformFilter, dateFrom, dateTo])

  const handleDelete = async (id) => {
    if (!confirm('Delete this stream from history?')) return
    try {
      await API.delete(`/stream/history/${id}`)
      toast.success('Stream deleted from history')
      setHistory(history.filter((h) => h._id !== id))
    } catch {
      toast.error('Failed to delete')
    }
  }

  const getStatusStyle = (status) => {
    if (status === 'user_stopped') return 'badge bg-emerald-50 text-emerald-700 border border-emerald-100'
    if (status === 'error') return 'badge bg-red-50 text-red-700 border border-red-100'
    return 'badge bg-gray-100 text-gray-600 border border-gray-200'
  }

  const getStatusLabel = (status) => {
    if (status === 'user_stopped') return 'Completed'
    if (status === 'error') return 'Error'
    return 'Auto ended'
  }

  if (authLoading || !user) {
    return <Loader />
  }

  return (
    <AppLayout title="Stream History" subtitle="Timeline of every multistream session.">
      <div className="card p-4 mb-6 flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
          <Filter size={16} className="text-brand-600" /> Filters
        </div>
        <div className="flex flex-wrap gap-3 flex-1">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="input-field w-auto min-w-[140px] py-2"
          >
            <option value="all">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field w-auto py-2" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field w-auto py-2" />
          {(platformFilter !== 'all' || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => { setPlatformFilter('all'); setDateFrom(''); setDateTo('') }}
              className="btn-ghost text-sm py-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error ? (
        <ErrorState onRetry={() => { setLoading(true); fetchHistory() }} />
      ) : loading ? (
        <div className="space-y-6 pl-4 border-l-2 border-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative pl-8">
              <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full skeleton" />
              <div className="card p-5 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={History}
            title={history.length ? 'No matches' : 'No streams yet'}
            description={history.length ? 'Try adjusting your filters.' : 'Go live to see your stream timeline here.'}
            actionLabel="Go Live"
            actionTo="/stream"
          />
        </div>
      ) : (
        <div className="relative pl-4 sm:pl-6 border-l-2 border-brand-200">
          {filtered.map((h, idx) => (
            <article key={h._id} className="relative pb-8 last:pb-0">
              <div className="absolute -left-[calc(1rem+5px)] sm:-left-[calc(1.5rem+5px)] top-3 w-3 h-3 rounded-full bg-brand-600 ring-4 ring-brand-100" />
              <div className="card-interactive ml-4 sm:ml-6 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{h.videoTitle}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={getStatusStyle(h.endReason)}>{getStatusLabel(h.endReason)}</span>
                      <span className="text-caption text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {formatStreamDuration(h.duration, h.startedAt, h.stoppedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <time className="text-caption text-gray-500">
                      {new Date(h.startedAt).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                    <button
                      type="button"
                      onClick={() => handleDelete(h._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {h.platformsStreamed?.map((p, i) => {
                    const meta = getPlatform(p.name)
                    return (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${
                          p.status === 'error'
                            ? 'bg-red-50 border-red-100 text-red-700'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                        {PLATFORM_LABELS[p.name] || p.name}
                        {p.label && <span className="text-gray-400">· {p.label}</span>}
                      </span>
                    )
                  })}
                </div>
              </div>
              {idx < filtered.length - 1 && <div className="hidden" />}
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
