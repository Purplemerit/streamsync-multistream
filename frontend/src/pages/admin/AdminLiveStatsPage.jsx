import { useEffect, useState } from 'react'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import toast from 'react-hot-toast'
import { Activity, Eye, Heart, MessageSquare, Users, WifiOff, RefreshCw } from 'lucide-react'
import { PLATFORMS } from '../../constants/platforms'
import StatCard from '../../components/ui/StatCard'
import { SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { deferEffect } from '../../utils/deferEffect'

const ADMIN_PLATFORMS = PLATFORMS.map((p) => ({
  key: p.id,
  label: p.label,
  color: p.dot,
  api: p.id === 'youtube' || p.id === 'twitch',
}))

export default function AdminLiveStatsPage() {
  const [stats, setStats] = useState({})
  const [selectedPlatform, setSelectedPlatform] = useState('youtube')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async (showLoader = true) => {
    if (showLoader) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await API.get('/livestats/admin/global')
      setStats(res.data)
    } catch {
      toast.error('Failed to load global stats')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    deferEffect(() => fetchStats())
    const interval = setInterval(() => fetchStats(false), 30000)
    return () => clearInterval(interval)
  }, [])

  const currentStats = stats[selectedPlatform]
  const currentPlatform = ADMIN_PLATFORMS.find(p => p.key === selectedPlatform)

  return (
    <AppLayout
      title="Global Live Stats"
      subtitle="Aggregated stats across all active streamers."
      maxWidth="max-w-full"
    >
      <div className="flex flex-col lg:flex-row gap-6 min-h-[60vh]">
        <aside className="w-full lg:w-56 shrink-0">
          <div className="card p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              All Platforms
            </h2>
            {ADMIN_PLATFORMS.map(p => (
              <button
                key={p.key}
                onClick={() => setSelectedPlatform(p.key)}
                className={`w-full text-left px-3 py-3 rounded-xl mb-2 transition flex items-center gap-3 ${
                  selectedPlatform === p.key
                    ? 'bg-brand-50 border border-brand-300 text-brand-700'
                    : 'bg-gray-50 hover:bg-brand-50/50 border border-gray-200 hover:border-brand-100'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.color}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.label}</p>
                  <p className={`text-xs mt-0.5 ${p.api ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {p.api ? 'Live data' : 'No API'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${currentPlatform?.color}`} />
              <div>
                <h2 className="text-heading text-gray-900">{currentPlatform?.label} — Global Stats</h2>
                <p className="text-caption text-gray-500 mt-0.5">Aggregated across all active streamers</p>
              </div>
            </div>
            <button
              onClick={() => fetchStats(false)}
              disabled={refreshing}
              className="btn-secondary text-sm gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : currentStats?.unavailable ? (
            <div className="card flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center mb-5">
                <WifiOff size={32} strokeWidth={1.5} />
              </div>
              <p className="text-heading text-gray-900 mb-2">Stats not available</p>
              <p className="text-body text-gray-500 max-w-md">
                {currentPlatform?.label} does not provide a public API for live stream statistics.
                Stats cannot be fetched programmatically for this platform.
              </p>
              <div className="mt-6 card px-6 py-4 text-sm text-gray-600 max-w-sm border-brand-100 bg-brand-50/50">
                Users can still stream to {currentPlatform?.label} — we just can&apos;t pull stats from it automatically.
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Eye} label="Total Viewers" value={currentStats?.totalViewers ?? 0} accent="blue" />
                <StatCard icon={Heart} label="Total Likes" value={currentStats?.totalLikes ?? 0} accent="red" />
                <StatCard icon={MessageSquare} label="Total Comments" value={currentStats?.totalComments ?? 0} accent="emerald" />
                <StatCard icon={Users} label="Active Streams" value={currentStats?.activeStreams ?? 0} accent="brand" />
              </div>

              {currentStats?.topStreamer && (
                <div className="card p-6 mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-amber-500" />
                    Top Streamer on {currentPlatform?.label}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-xl font-bold text-amber-600 border border-amber-100">
                      {currentStats.topStreamer.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold text-lg">{currentStats.topStreamer.name}</p>
                      <p className="text-gray-500 text-sm">{currentStats.topStreamer.viewers?.toLocaleString()} viewers</p>
                    </div>
                    <div className="ml-auto">
                      <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
                        Top Streamer
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {currentStats?.activeStreams === 0 && (
                <EmptyState
                  icon={Activity}
                  title={`No active streams on ${currentPlatform?.label}`}
                  description="Stats will update automatically when streamers go live."
                />
              )}

              <p className="text-gray-400 text-xs mt-6">
                Auto-refreshes every 30 seconds · Last updated: {new Date().toLocaleTimeString('en-IN')}
              </p>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
