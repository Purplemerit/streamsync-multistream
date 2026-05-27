import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Users, Video, Radio, Activity, ArrowRight, HardDrive, RefreshCw } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import { SkeletonCard } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import Loader from '../../components/common/Loader'
import { deferEffect } from '../../utils/deferEffect'

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAll = useCallback(async () => {
    setError(false)
    setLoading(true)
    try {
      const [statsRes, videosRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/videos'),
      ])
      setStats(statsRes.data)
      setVideos(videosRes.data)
      setLastUpdated(new Date())
    } catch {
      setError(true)
      toast.error('Failed to load admin dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return
    deferEffect(() => fetchAll())
  }, [authLoading, user, fetchAll])

  const handleRefresh = () => {
    fetchAll()
    toast.success('Dashboard refreshed!')
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 MB'
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const totalStorage = videos.reduce((acc, v) => acc + (v.filesize || 0), 0)

  if (authLoading || !user) {
    return <Loader />
  }

  return (
    <AppLayout
      title="Admin Dashboard"
      subtitle="Full platform overview and analytics."
    >
      <div className="flex items-center justify-end mb-4 -mt-2">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {lastUpdated && !error && !loading && (
        <p className="text-gray-400 text-xs mb-6 -mt-2">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {error ? (
        <ErrorState message="We couldn't load the admin dashboard." onRetry={fetchAll} />
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} accent="blue" />
            <StatCard label="Total Videos" value={stats?.totalVideos ?? 0} icon={Video} accent="brand" />
            <StatCard label="Total Streams" value={stats?.totalStreams ?? 0} icon={Radio} accent="emerald" />
            <StatCard label="Live Now" value={stats?.activeSessionsCount ?? 0} icon={Activity} accent="red" />
            <StatCard label="Storage Used" value={formatSize(totalStorage)} icon={HardDrive} accent="amber" animate={false} />
          </div>

          {stats?.activeSessionsCount > 0 && (
            <div className="card p-4 mb-6 border-red-200 bg-red-50 flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-700 font-semibold">{stats.activeSessionsCount} stream(s) currently LIVE</span>
              <Link to="/admin/streams" className="ml-auto text-red-600 text-sm hover:text-red-700 flex items-center gap-1 font-medium">
                Monitor <ArrowRight size={14} />
              </Link>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-heading text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { to: '/admin/users', label: 'Manage Users', desc: 'View, promote or remove users', icon: Users, tone: 'blue' },
                { to: '/admin/videos', label: 'Manage Videos', desc: 'View and delete all uploads', icon: Video, tone: 'brand' },
                { to: '/admin/streams', label: 'Monitor Streams', desc: 'Watch live and past streams', icon: Activity, tone: 'emerald' },
                { to: '/admin/platform-popularity', label: 'Platform Popularity', desc: 'Which platforms are streamed most', icon: Radio, tone: 'amber' },
                { to: '/admin/stream-keys-saved', label: 'Stream Keys Saved', desc: 'Keys saved per platform', icon: HardDrive, tone: 'brand' },
                { to: '/admin/recent-registrations', label: 'Recent Registrations', desc: 'Latest users who joined', icon: Users, tone: 'blue' },
              ].map(a => {
                const iconTones = {
                  blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
                  brand: 'bg-brand-50 text-brand-600 group-hover:bg-brand-100',
                  emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
                  amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
                }
                const Icon = a.icon
                return (
                  <Link key={a.to} to={a.to} className="card-interactive p-5 flex items-center gap-4 group">
                    <div className={`p-2.5 rounded-xl transition-colors duration-200 ${iconTones[a.tone]}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{a.label}</p>
                      <p className="text-caption text-gray-500">{a.desc}</p>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-brand-600 transition-colors duration-200 shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}
