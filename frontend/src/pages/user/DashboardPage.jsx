import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import { useAuth } from '../../hooks/useAuth'
import { getTimeGreeting } from '../../utils/greeting'
import toast from 'react-hot-toast'
import { Video, Radio, Key, History, Upload, Wifi, ChevronRight } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import { SkeletonCard } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Loader from '../../components/common/Loader'
import { formatStreamDuration } from '../../utils/duration'
import { deferEffect } from '../../utils/deferEffect'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState(null)
  const [streamKeys, setStreamKeys] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(async () => {
    setError(false)
    setLoading(true)
    try {
      const [statsRes, keysRes] = await Promise.all([
        API.get('/user/dashboard'),
        API.get('/streamkeys/my'),
      ])
      setStats(statsRes.data)
      setStreamKeys(keysRes.data)
    } catch {
      setError(true)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !user) return
    deferEffect(() => fetchData())
  }, [authLoading, user, fetchData])

  const savedKeysCount = Object.values(streamKeys).reduce(
    (sum, accounts) => sum + (Array.isArray(accounts) ? accounts.length : 0),
    0
  )
  const accountsLive = stats?.accountsLive ?? 0
  const isLive = accountsLive > 0
  const firstName = user?.name?.split(' ')[0] || 'Creator'

  if (authLoading || !user) {
    return <Loader />
  }

  return (
    <AppLayout
      title={`${getTimeGreeting()}, ${firstName}`}
      subtitle="Here's what's happening with your streams today."
    >
      {isLive && (
        <div className="card p-4 sm:p-5 mb-6 border-red-200 bg-gradient-to-r from-red-50 to-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]" />
            <div>
              <p className="text-red-700 font-bold">You are LIVE</p>
              <p className="text-red-600/80 text-sm">{accountsLive} account(s) streaming</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/live-stats" className="btn-primary text-sm py-2">Live Stats</Link>
            <Link to="/stream" className="btn-secondary text-sm py-2 text-red-700 border-red-200">Manage stream</Link>
          </div>
        </div>
      )}

      {error ? (
        <ErrorState message="We couldn't load your dashboard." onRetry={fetchData} />
      ) : loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard label="My Videos" value={stats?.videoCount ?? 0} icon={Video} accent="blue" trend={stats?.videoCount ? '+ ready' : undefined} />
          <StatCard label="Total Streams" value={stats?.streamCount ?? 0} icon={Radio} accent="brand" />
          <StatCard label="Keys Saved" value={savedKeysCount} icon={Key} accent="emerald" />

          <div
            className={`card-interactive p-5 border relative ${
              isLive
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-amber-50 border-amber-100'
            }`}
          >
            {isLive && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
            <Wifi size={20} className={`mb-3 opacity-80 ${isLive ? 'text-emerald-600' : 'text-amber-700'}`} />
            <p className={`text-3xl font-bold tracking-tight ${isLive ? 'text-emerald-600' : 'text-gray-900'}`}>
              {accountsLive}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {isLive && (
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
              )}
              <p className="text-caption text-gray-500">Accounts Live</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <Link to="/my-videos" className="card-interactive p-4 flex items-center gap-3 group">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors duration-200">
            <Upload size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900">Upload Video</p>
            <p className="text-caption text-gray-500 truncate">Add pre-recorded content</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-600 transition-colors duration-200" />
        </Link>
        <Link to="/stream" className="card-interactive p-4 flex items-center gap-3 bg-brand-600 border-brand-600 text-white hover:bg-brand-700 hover:border-brand-700 group">
          <div className="p-2.5 rounded-xl bg-brand-500 text-white">
            <Radio size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Go Live</p>
            <p className="text-caption text-brand-100">Start multistream</p>
          </div>
          <ChevronRight size={16} className="text-brand-200" />
        </Link>
        <Link to="/history" className="card-interactive p-4 flex items-center gap-3 group">
          <div className="p-2.5 rounded-xl bg-gray-100 text-gray-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors duration-200">
            <History size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900">View History</p>
            <p className="text-caption text-gray-500">Past sessions</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-600 transition-colors duration-200" />
        </Link>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-heading text-gray-900 flex items-center gap-2">
            <History size={18} className="text-brand-600" /> Activity feed
          </h2>
          <Link to="/history" className="text-brand-600 text-sm font-medium hover:text-brand-700 transition-colors duration-200">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-3">
                <div className="skeleton w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-48" />
                  <div className="skeleton h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : !stats?.recentStreams?.length ? (
          <EmptyState
            icon={Radio}
            title="No streams yet"
            description="Your recent multistream sessions will appear here."
            actionLabel="Go Live"
            actionTo="/stream"
          />
        ) : (
          <div className="space-y-1">
            {stats.recentStreams.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 border-l-2 border-transparent hover:border-brand-400"
              >
                <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Radio size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.videoTitle}</p>
                  <p className="text-caption text-gray-500 truncate">{s.platforms}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono font-medium text-gray-700">
                    {formatStreamDuration(s.duration, s.startedAt, s.stoppedAt)}
                  </p>
                  <p className="text-caption text-gray-400">
                    {new Date(s.startedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
