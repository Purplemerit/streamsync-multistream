import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Activity, MessageSquare, Heart, Eye, Trash2, WifiOff, RefreshCw, AlertCircle, Link2 } from 'lucide-react'
import { PLATFORM_LABELS } from '../../constants/platforms'
import Loader from '../../components/common/Loader'
import { deferEffect } from '../../utils/deferEffect'

const POLL_MS = 12000

const PLATFORM_COLORS = {
  youtube: 'bg-red-600', twitch: 'bg-purple-600', facebook: 'bg-blue-600',
  kick: 'bg-green-600', rumble: 'bg-orange-600', telegram: 'bg-sky-500',
  x: 'bg-slate-600', instagram: 'bg-pink-600', tiktok: 'bg-neutral-800', bigo: 'bg-yellow-600',
}

const accountTabLabel = (data) => {
  const name = PLATFORM_LABELS[data.platform] || data.platform
  if (data.label) return `${name} · ${data.label}`
  return name
}

export default function LiveStatsPage() {
  const { user, loading: authLoading } = useAuth()
  const [streams, setStreams] = useState([])
  const [selectedStream, setSelectedStream] = useState(null)
  const [selectedAccountKey, setSelectedAccountKey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const pollRef = useRef(null)

  const mergeActiveIntoStreams = (list, activePayload) => {
    if (!activePayload?.active) return list
    const idx = list.findIndex((s) => s.stream._id === activePayload.stream._id)
    const entry = { stream: activePayload.stream, platforms: activePayload.platforms }
    if (idx >= 0) {
      const next = [...list]
      next[idx] = entry
      return next
    }
    return [entry, ...list]
  }

  const loadStreams = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      if (silent) {
        const activeRes = await API.get('/livestats/active')
        if (activeRes.data.active) {
          setStreams((prev) => {
            const merged = mergeActiveIntoStreams(prev, activeRes.data)
            setSelectedStream((sel) => {
              if (!sel) return merged[0] || null
              const updated = merged.find((s) => s.stream._id === sel.stream._id)
              return updated || merged.find((s) => s.stream.status === 'live') || merged[0] || null
            })
            return merged
          })
          setLastUpdated(new Date())
          return
        }
      }

      const res = await API.get('/livestats/my-streams')
      const data = res.data || []
      setStreams(data)
      setLastUpdated(new Date())

      setSelectedStream((prev) => {
        const liveStream = data.find((s) => s.stream?.status === 'live')
        const toSelect = liveStream || data[0]
        if (prev) {
          const updated = data.find((s) => s.stream._id === prev.stream._id)
          if (updated) return updated
        }
        return toSelect || null
      })
      setSelectedAccountKey((prev) => {
        const first = data.find((s) => s.stream?.status === 'live') || data[0]
        const keys = first ? Object.keys(first.platforms || {}) : []
        if (prev && keys.includes(prev)) return prev
        return keys[0] || null
      })
    } catch {
      if (!silent) toast.error('Failed to load stream stats')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !user) return
    deferEffect(() => loadStreams())
    pollRef.current = setInterval(() => loadStreams(true), POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [authLoading, user, loadStreams])

  const handleDeleteStream = async (streamId, e) => {
    e.stopPropagation()
    if (!confirm('Delete this stream from your Live Stats history?')) return
    setDeletingId(streamId)
    try {
      await API.delete(`/livestats/stream/${streamId}`)
      const updated = streams.filter((s) => s.stream._id !== streamId)
      setStreams(updated)
      if (selectedStream?.stream._id === streamId) {
        setSelectedStream(updated[0] || null)
        setSelectedAccountKey(updated[0] ? Object.keys(updated[0].platforms)[0] : null)
      }
      toast.success('Stream deleted from history')
    } catch {
      toast.error('Failed to delete stream')
    } finally {
      setDeletingId(null)
    }
  }

  const accountKeys = selectedStream ? Object.keys(selectedStream.platforms || {}) : []
  const resolvedAccountKey =
    selectedAccountKey && accountKeys.includes(selectedAccountKey)
      ? selectedAccountKey
      : (accountKeys[0] || null)
  const currentPlatformData = resolvedAccountKey
    ? selectedStream?.platforms?.[resolvedAccountKey]
    : null
  const isCurrentlyLive = selectedStream?.stream?.status === 'live'
  const hasAnyLive = streams.some((s) => s.stream?.status === 'live')
  const isOAuthExpired =
    Boolean(currentPlatformData?.oauthExpired) ||
    (typeof currentPlatformData?.message === 'string' &&
      currentPlatformData.message.includes('OAuth token expired'))
  const isGenericError = Boolean(currentPlatformData?.error) && !isOAuthExpired

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-IN')
  }

  if (authLoading || !user) {
    return <Loader />
  }

  return (
    <AppLayout
      title="Live Stats"
      subtitle="Real-time viewer and engagement data across your streams."
      maxWidth="max-w-full"
    >
      {!loading && !hasAnyLive && (
        <div className="card p-4 mb-6 border-amber-200 bg-amber-50 flex items-start gap-3">
          <WifiOff size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">No active stream</p>
            <p className="text-amber-800/80 text-sm mt-1">
              Start a multistream from Go Live to see real-time viewer and like counts here. Ended streams show saved snapshots below.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 min-h-[60vh]">
        <aside className="w-full lg:w-64 shrink-0">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">My Streams</h2>
              <button type="button" onClick={() => loadStreams(true)} className="text-slate-400 hover:text-slate-600 transition">
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <p className="text-slate-500 text-sm">Loading...</p>
            ) : streams.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No stream stats yet.</p>
                <p className="text-slate-400 text-xs mt-2">Stream to see stats here.</p>
              </div>
            ) : (
              streams.map((s, i) => {
                const isLive = s.stream?.status === 'live'
                const isSelected = selectedStream?.stream._id === s.stream._id
                const isDeleting = deletingId === s.stream._id
                return (
                  <div key={s.stream._id || i} className="relative group mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStream(s)
                        setSelectedAccountKey(Object.keys(s.platforms || {})[0] || null)
                      }}
                      className={`w-full text-left px-3 py-3 rounded-xl transition pr-8 ${
                        isSelected
                          ? 'bg-violet-50 border border-violet-300'
                          : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isLive && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />}
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {s.stream?.title || `Stream #${i + 1}`}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(s.stream?.createdAt).toLocaleDateString('en-IN')} ·{' '}
                        {s.stream?.accounts?.length || Object.keys(s.platforms).length} account(s)
                      </p>
                      {isLive
                        ? <span className="text-xs text-red-600 font-semibold">● LIVE NOW</span>
                        : <span className="text-xs text-slate-400">Ended</span>}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteStream(s.stream._id, e)}
                      disabled={isDeleting}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-600 p-1 rounded"
                      title="Delete from history"
                    >
                      {isDeleting
                        ? <RefreshCw size={12} className="animate-spin" />
                        : <Trash2 size={12} />}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {!selectedStream ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Activity size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">Select a stream to view stats</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900">{selectedStream.stream?.title || 'Stream Stats'}</h2>
                    {isCurrentlyLive
                      ? <span className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />LIVE
                        </span>
                      : <span className="bg-slate-100 text-slate-500 text-xs px-3 py-1 rounded-full">Ended</span>}
                  </div>
                  <p className="text-slate-500 text-sm mt-1">
                    {formatDate(selectedStream.stream?.createdAt)}
                    {lastUpdated && (
                      <span className="ml-3 text-slate-400">· Updated {lastUpdated.toLocaleTimeString('en-IN')}</span>
                    )}
                  </p>
                </div>
                {hasAnyLive && (
                  <span className="text-xs text-slate-500">Auto-refreshes every {POLL_MS / 1000}s while live</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {accountKeys.map((key) => {
                  const data = selectedStream.platforms[key]
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedAccountKey(key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                        resolvedAccountKey === key
                          ? 'bg-violet-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${PLATFORM_COLORS[data?.platform] || 'bg-slate-400'}`} />
                      {accountTabLabel(data)}
                      {data?.oauthExpired && <AlertCircle size={14} className="text-amber-500" />}
                      {data?.error && !data?.oauthExpired && <AlertCircle size={14} className="text-red-400" />}
                    </button>
                  )
                })}
              </div>

              {currentPlatformData?.unavailable ? (
                <div className="card flex flex-col items-center justify-center py-16 text-center">
                  <WifiOff size={40} className="text-slate-300 mb-4" />
                  <p className="text-slate-600 text-lg font-medium">Stats not available via API</p>
                  <p className="text-slate-500 text-sm mt-2 max-w-sm">{currentPlatformData.message}</p>
                </div>
              ) : currentPlatformData?.oauthRequired ? (
                <div className="card flex flex-col items-center justify-center py-16 text-center">
                  <Link2 size={40} className="text-violet-400 mb-4" />
                  <p className="text-slate-600 text-lg font-medium">OAuth connection required</p>
                  <p className="text-slate-500 text-sm mt-2 max-w-sm">{currentPlatformData.message}</p>
                </div>
              ) : isOAuthExpired ? (
                <>
                  <div className="card mb-4 border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <AlertCircle size={24} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-900 font-semibold">YouTube OAuth token expired</p>
                        <p className="text-amber-800 text-sm mt-1">
                          Reconnect your YouTube account in Stream Keys to see live stats.
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/stream-keys"
                      className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shrink-0"
                    >
                      <Link2 size={16} /> Go to Stream Keys
                    </Link>
                  </div>
                  <PlatformStatsGrid
                    data={currentPlatformData}
                    isCurrentlyLive={isCurrentlyLive}
                  />
                </>
              ) : isGenericError ? (
                <div className="card flex flex-col items-center justify-center py-16 text-center border-red-100 bg-red-50/50">
                  <AlertCircle size={40} className="text-red-400 mb-4" />
                  <p className="text-slate-600 text-lg font-medium">Could not fetch stats</p>
                  <p className="text-slate-500 text-sm mt-2 max-w-sm">{currentPlatformData.message}</p>
                </div>
              ) : !currentPlatformData ? (
                <div className="card flex flex-col items-center justify-center py-16 text-center">
                  <WifiOff size={40} className="text-slate-300 mb-4" />
                  <p className="text-slate-600 text-lg font-medium">No stats recorded yet</p>
                  <p className="text-slate-500 text-sm mt-2 max-w-sm">
                    {isCurrentlyLive
                      ? 'Fetching from platform APIs — check back in a few seconds.'
                      : 'No snapshot was saved for this account.'}
                  </p>
                </div>
              ) : (
                <PlatformStatsGrid
                  data={currentPlatformData}
                  isCurrentlyLive={isCurrentlyLive}
                />
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function PlatformStatsGrid({ data, isCurrentlyLive }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <StatCard
        icon={<Eye size={20} />}
        label="Peak Viewers"
        value={data?.peakViewers ?? data?.viewers ?? 0}
        color="text-blue-600"
        live={isCurrentlyLive}
      />

      {isCurrentlyLive && (
        <StatCard
          icon={<Eye size={20} />}
          label="Current Viewers"
          value={data?.viewers ?? 0}
          color="text-cyan-600"
          live
        />
      )}

      {data?.platform === 'youtube' && (
        <>
          <StatCard
            icon={<Heart size={20} />}
            label="Likes"
            value={data?.likes ?? 0}
            color="text-red-600"
            live={isCurrentlyLive}
          />
          <StatCard
            icon={<MessageSquare size={20} />}
            label="Comments"
            value={data?.comments ?? 0}
            color="text-emerald-600"
            live={isCurrentlyLive}
          />
        </>
      )}

      <StatCard
        icon={<Activity size={20} />}
        label="Status"
        value={data?.isLive ? 'LIVE' : isCurrentlyLive ? 'Polling' : 'Ended'}
        color={data?.isLive ? 'text-emerald-600' : 'text-slate-500'}
      />

      {data?.platform === 'twitch' && (
        <div className="col-span-2 md:col-span-3 bg-violet-50 border border-violet-200 rounded-2xl p-4 text-sm text-violet-800">
          Twitch provides <strong>viewer count</strong> via the Helix API. Likes and comments are not exposed programmatically.
        </div>
      )}

      {data?.platform === 'facebook' && data?.isLive && (
        <div className="col-span-2 md:col-span-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
          Facebook <strong>live_views</strong> require a valid Page OAuth token with <code className="text-xs">pages_read_engagement</code>.
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color, live }) {
  return (
    <div className="card p-5">
      <div className={`${color} mb-3 flex items-center gap-2`}>
        {icon}
        {live && <span className="text-xs text-red-600 font-semibold animate-pulse">● live</span>}
      </div>
      <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  )
}
