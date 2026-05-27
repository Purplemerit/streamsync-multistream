import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import { PLATFORMS, getPlatform } from '../../constants/platforms'
import toast from 'react-hot-toast'
import { Radio, Square, Activity, Loader2, Key, CheckCircle2, Video } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import { deferEffect } from '../../utils/deferEffect'
import { io } from 'socket.io-client'

const loadActiveAccounts = () => {
  try {
    const stored = localStorage.getItem('activeAccounts')
    if (stored) return JSON.parse(stored)
    const legacy = localStorage.getItem('activePlatforms')
    if (legacy) {
      return JSON.parse(legacy).map((id) => ({ platform: id, accountId: id, label: id }))
    }
  } catch {
    /* ignore */
  }
  return []
}

const accountSelectionKey = (platform, accountId) => `${platform}:${accountId}`

export default function StreamPage() {
  const [videos, setVideos] = useState([])
  const [selectedVideo, setSelectedVideo] = useState('')
  const [savedAccounts, setSavedAccounts] = useState({})
  const [selectedKeys, setSelectedKeys] = useState(new Set())
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [starting, setStarting] = useState(false)
  const [stoppingStream, setStoppingStream] = useState(false)

  const [streaming, setStreaming] = useState(() => !!localStorage.getItem('activeSessionId'))
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('activeSessionId') || null)
  const [activeAccounts, setActiveAccounts] = useState(loadActiveAccounts)

  const [progress, setProgress] = useState(null)
  const [streamDuration, setStreamDuration] = useState(0)
  const [liveStats, setLiveStats] = useState(null)
  const [failedDestinations, setFailedDestinations] = useState(new Set())

  const timerRef = useRef(null)
  const statsRef = useRef(null)
  const navigate = useNavigate()

  const getPlatformMeta = (id) => {
    const p = getPlatform(id)
    return { label: p.label, color: p.color, needsUrl: p.needsUrl }
  }

  const loadSavedAccounts = useCallback(async () => {
    setLoadingKeys(true)
    try {
      const res = await API.get('/streamkeys/my')
      setSavedAccounts(res.data)
    } catch {
      toast.error('Failed to load saved accounts')
    } finally {
      setLoadingKeys(false)
    }
  }, [])

  const fetchLiveStats = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await API.get('/livestats/active')
      if (res.data.active) {
        setLiveStats(res.data)
      }
    } catch {
      console.error('Failed to fetch live stats')
    }
  }, [sessionId])

  useEffect(() => {
    API.get('/videos/my')
      .then((res) => setVideos(res.data.filter((v) => v.status !== 'missing')))
      .catch(() => toast.error('Failed to load videos'))
    deferEffect(() => loadSavedAccounts())
  }, [loadSavedAccounts])

  useEffect(() => {
    if (!streaming) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    const startedAt = Date.now()
    timerRef.current = setInterval(() => {
      setStreamDuration(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [streaming])

  useEffect(() => {
    if (!streaming || !sessionId) {
      if (statsRef.current) clearInterval(statsRef.current)
      return
    }
    deferEffect(() => fetchLiveStats())
    statsRef.current = setInterval(fetchLiveStats, 12000)
    return () => {
      if (statsRef.current) clearInterval(statsRef.current)
    }
  }, [streaming, sessionId, fetchLiveStats])

  useEffect(() => {
    if (!sessionId) return
    const socket = io(import.meta.env.VITE_API_URL.replace('/api', ''))
    socket.emit('join:session', sessionId)
    socket.on('stream:progress', (data) => setProgress(data.timemark))
    socket.on('stream:destination:error', (data) => {
      if (data?.key) {
        setFailedDestinations((prev) => new Set([...prev, data.key]))
        toast.error(`${data.label || data.platform} stream error`, { id: data.key })
      }
    })
    socket.on('stream:error', () => {
      toast.error('Stream error occurred')
      setStreaming(false)
    })
    socket.on('stream:ended', () => {
      toast.success('Stream ended')
      setStreaming(false)
    })
    return () => socket.disconnect()
  }, [sessionId])

  const toggleAccount = (platform, account) => {
    const key = accountSelectionKey(platform, account.accountId)
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const buildSelectedAccounts = () => {
    const result = []
    PLATFORMS.forEach((p) => {
      const accounts = Array.isArray(savedAccounts[p.id]) ? savedAccounts[p.id] : []
      accounts.forEach((acc) => {
        if (selectedKeys.has(accountSelectionKey(p.id, acc.accountId))) {
          result.push({
            platform: p.id,
            name: p.id,
            accountId: acc.accountId,
            label: acc.label,
            streamKey: acc.streamKey,
            rtmpUrl: acc.rtmpUrl || undefined,
          })
        }
      })
    })
    return result
  }

  const handleStartStream = async () => {
    if (!selectedVideo) return toast.error('Please select a video')

    const selected = buildSelectedAccounts()
    if (selected.length === 0) return toast.error('Please select at least one account')

    for (const acc of selected) {
      const meta = getPlatformMeta(acc.platform)
      if (meta.needsUrl && !acc.rtmpUrl) {
        return toast.error(`Stream URL missing for ${acc.label} (${meta.label})`)
      }
    }

    const platforms = selected.map(({ name, accountId, label, streamKey, rtmpUrl }) => ({
      name, accountId, label, streamKey, rtmpUrl,
    }))

    setStarting(true)
    try {
      const res = await API.post('/stream/start', { videoId: selectedVideo, platforms })
      setSessionId(res.data.sessionId)
      setStreamDuration(0)
      setStreaming(true)
      setActiveAccounts(selected)
      localStorage.setItem('activeSessionId', res.data.sessionId)
      localStorage.setItem('activeAccounts', JSON.stringify(selected))
      localStorage.removeItem('activePlatforms')
      toast.success('Stream started! LIVE')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start stream')
    } finally {
      setStarting(false)
    }
  }

  const resetStreamUi = () => {
    setStreaming(false)
    setSessionId(null)
    setActiveAccounts([])
    localStorage.removeItem('activeSessionId')
    localStorage.removeItem('activeAccounts')
    localStorage.removeItem('activePlatforms')
    setProgress(null)
    setLiveStats(null)
    setStreamDuration(0)
  }

  const handleStopStream = async () => {
    if (!sessionId || stoppingStream) return

    setStoppingStream(true)
    const stopSessionId = sessionId

    const forceResetTimer = setTimeout(() => {
      resetStreamUi()
      setStoppingStream(false)
      toast('Stream UI reset — check History for final status.', { icon: 'ℹ️' })
    }, 5000)

    try {
      await API.post(`/stream/stop/${stopSessionId}`)
      toast.success('Stream stopped successfully!')
    } catch {
      toast.error('Failed to stop stream — UI reset anyway')
    } finally {
      clearTimeout(forceResetTimer)
      setStoppingStream(false)
      resetStreamUi()
      navigate('/history')
    }
  }

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const totalSavedAccounts = PLATFORMS.reduce((sum, p) => {
    const list = savedAccounts[p.id]
    return sum + (Array.isArray(list) ? list.length : 0)
  }, 0)

  const selectedCount = selectedKeys.size
  const liveAccounts = streaming ? activeAccounts : buildSelectedAccounts()
  const selectedPreview = buildSelectedAccounts()
  const videoTitle = videos.find((v) => v._id === selectedVideo)?.title
  const platformsWithAccounts = PLATFORMS.filter((p) => (savedAccounts[p.id]?.length || 0) > 0)

  return (
    <AppLayout
      title="Go Live"
      subtitle={`Multistream to any combination of accounts across ${PLATFORMS.length} platforms.`}
      maxWidth="max-w-5xl"
    >
          {streaming && (
            <div className="card mb-6 border-red-200 bg-gradient-to-br from-red-50 via-white to-white overflow-hidden">
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
                    <span className="text-sm font-bold uppercase tracking-wider text-red-600">Broadcasting live</span>
                  </div>
                  <p className="text-4xl sm:text-5xl font-mono font-bold text-gray-900 tracking-tight tabular-nums">
                    {formatDuration(streaming ? streamDuration : 0)}
                  </p>
                  {progress && (
                    <p className="text-caption text-gray-500 mt-2 font-mono">Encoder: {progress}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleStopStream}
                  disabled={stoppingStream}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] shadow-soft min-w-[160px]"
                >
                  {stoppingStream ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Stopping…
                    </>
                  ) : (
                    <>
                      <Square size={18} /> Stop Stream
                    </>
                  )}
                </button>
              </div>

              <div className="mb-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Streaming to {liveAccounts.length} account{liveAccounts.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {liveAccounts.map((acc) => {
                    const meta = getPlatformMeta(acc.platform || acc.name)
                    const key = `${acc.platform || acc.name}-${acc.accountId}`
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1.5 bg-red-50 text-red-800 border border-red-200 text-xs px-3 py-1.5 rounded-full font-medium"
                      >
                        <span className={`w-2 h-2 rounded-full ${meta.color} animate-pulse`} />
                        {meta.label} · {acc.label}
                      </span>
                    )
                  })}
                </div>
              </div>

              {streaming && liveStats?.active && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: 'Live Viewers',
                        value: (liveStats.accounts || []).reduce((sum, a) => sum + (a.viewers || 0), 0),
                      },
                      {
                        label: 'YouTube Likes',
                        value: (liveStats.accounts || [])
                          .filter((a) => a.platform === 'youtube')
                          .reduce((sum, a) => sum + (a.likes || 0), 0),
                      },
                      { label: 'Destinations', value: liveAccounts.length },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                        <p className="text-gray-500 text-xs mt-0.5 flex items-center justify-center gap-1">
                          <Activity size={11} /> {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {liveAccounts.map((acc) => {
                      const platformId = acc.platform || acc.name
                      const meta = getPlatformMeta(platformId)
                      const stat = (liveStats.accounts || []).find(
                        (a) => a.platform === platformId && a.accountId === acc.accountId
                      )
                      const destKey = `${platformId}:${acc.accountId}`
                      const failed = failedDestinations.has(destKey)
                      return (
                        <li
                          key={destKey}
                          className={`text-xs rounded-lg px-3 py-2 border flex justify-between items-center gap-2 ${
                            failed ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-700'
                          }`}
                        >
                          <span className="truncate font-medium">
                            <span className={`inline-block w-2 h-2 rounded-full ${meta.color} mr-1`} />
                            {meta.label} · {acc.label}
                          </span>
                          <span className="shrink-0 tabular-nums">
                            {failed ? 'Error' : `${stat?.viewers ?? 0} viewers`}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="space-y-6">

            {/* Step 1: Video */}
            <div className="card p-4 sm:p-6">
              <h2 className="text-heading text-gray-900 mb-4 flex items-center gap-2">
                <Video size={18} className="text-brand-600" /> 1. Select video
              </h2>
              {videos.length === 0 ? (
                <EmptyState
                  icon={Video}
                  title="No videos"
                  description="Upload a pre-recorded video first."
                  actionLabel="Upload video"
                  actionTo="/my-videos"
                />
              ) : (
                <div className="space-y-2">
                  {videos.map((v) => (
                    <label
                      key={v._id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition ${
                        selectedVideo === v._id
                          ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="video"
                        value={v._id}
                        checked={selectedVideo === v._id}
                        onChange={() => setSelectedVideo(v._id)}
                        disabled={streaming}
                        className="accent-violet-600"
                      />
                      <span className="text-sm text-gray-800">{v.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading text-gray-900">2. Select platforms & accounts</h2>
                {!streaming && selectedCount > 0 && (
                  <span className="badge bg-brand-50 text-brand-700 border border-brand-100">{selectedCount} selected</span>
                )}
              </div>

              {loadingKeys ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
                </div>
              ) : totalSavedAccounts === 0 ? (
                <EmptyState
                  icon={Key}
                  title="No stream keys yet"
                  description="Add labeled accounts on the Stream Keys page before going live."
                  actionLabel="Add stream keys"
                  actionTo="/stream-keys"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {platformsWithAccounts.map((p) => {
                    const accounts = savedAccounts[p.id] || []
                    const selectedOnPlatform = accounts.filter((acc) =>
                      selectedKeys.has(accountSelectionKey(p.id, acc.accountId))
                    ).length
                    const hasSelection = selectedOnPlatform > 0

                    return (
                      <div
                        key={p.id}
                        className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                          hasSelection && !streaming
                            ? 'border-brand-500 shadow-glow bg-brand-50/30'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/80">
                          <span
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: p.hex }}
                          >
                            {p.short}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900">{p.label}</p>
                            <p className="text-caption text-gray-500">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
                          </div>
                          <span className="badge bg-gray-100 text-gray-600 border border-gray-200">
                            {selectedOnPlatform}/{accounts.length}
                          </span>
                        </div>
                        <ul className="divide-y divide-gray-100 p-1">
                          {accounts.map((acc) => {
                            const selKey = accountSelectionKey(p.id, acc.accountId)
                            const isSelected = selectedKeys.has(selKey)
                            const isLive = streaming && activeAccounts.some(
                              (a) => a.accountId === acc.accountId && (a.platform || a.name) === p.id
                            )
                            const destKey = accountSelectionKey(p.id, acc.accountId)
                            const destFailed = failedDestinations.has(destKey)
                            return (
                              <li key={acc.accountId}>
                                <label
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 m-1 ${
                                    streaming
                                      ? destFailed
                                        ? 'bg-amber-50 opacity-80 cursor-not-allowed'
                                        : isLive
                                          ? 'bg-red-50'
                                          : 'opacity-50 cursor-not-allowed'
                                      : isSelected ? 'bg-brand-50' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={streaming ? isLive : isSelected}
                                    onChange={() => toggleAccount(p.id, acc)}
                                    disabled={streaming}
                                    className="accent-brand-600 w-4 h-4 shrink-0"
                                  />
                                  <span className="text-sm font-medium text-gray-900 truncate">{acc.label}</span>
                                  {isLive && !destFailed && (
                                    <span className="ml-auto badge bg-red-50 text-red-600 border-red-100 text-[10px]">LIVE</span>
                                  )}
                                  {isLive && destFailed && (
                                    <span className="ml-auto badge bg-amber-50 text-amber-700 border-amber-200 text-[10px]">ERROR</span>
                                  )}
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {!streaming && selectedCount > 0 && selectedVideo && (
            <div className="card p-5 mb-6 border-brand-200 bg-brand-50/40">
              <h3 className="text-sm font-bold text-brand-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} /> Ready to broadcast
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                <strong className="text-gray-900">{videoTitle}</strong> → {selectedCount} destination{selectedCount !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedPreview.map((acc) => {
                  const meta = getPlatformMeta(acc.platform)
                  return (
                    <span key={`${acc.platform}-${acc.accountId}`} className="badge bg-white text-gray-700 border border-gray-200">
                      <span className={`w-2 h-2 rounded-full ${meta.color}`} />
                      {meta.label} · {acc.label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {!streaming && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                type="button"
                onClick={handleStartStream}
                disabled={starting || selectedCount === 0 || !selectedVideo}
                className="btn-primary px-8 py-4 text-lg gap-3 disabled:hover:scale-100"
              >
                {starting ? <Loader2 size={22} className="animate-spin" /> : <Radio size={22} />}
                Start Multistream
              </button>
              {!selectedVideo && (
                <p className="text-caption text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl self-center">
                  Select a video in step 1
                </p>
              )}
            </div>
          )}

    </AppLayout>
  )
}
