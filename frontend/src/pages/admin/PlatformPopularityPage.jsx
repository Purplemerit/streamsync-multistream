import { useEffect, useState } from 'react'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import toast from 'react-hot-toast'
import { BarChart3, Radio } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import { SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

const PLATFORM_COLORS = {
  youtube: '#FF0000', twitch: '#9146FF', facebook: '#1877F2',
  kick: '#53FC18', rumble: '#85C742', telegram: '#229ED9',
  x: '#64748b', instagram: '#E1306C',
}

const BRAND_GRADIENT = 'linear-gradient(90deg, #7c3aed, #a78bfa)'

export default function PlatformPopularityPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/admin/platform-popularity')
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load platform stats'))
      .finally(() => setLoading(false))
  }, [])

  const maxCount = data?.platforms?.length > 0
    ? Math.max(...data.platforms.map(p => p.count))
    : 1

  return (
    <AppLayout
      title="Platform Popularity"
      subtitle="Which platforms are streamed to most across all users."
    >
      <p className="text-emerald-600 text-xs mb-6 -mt-4 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Based on permanent stream history — deleting streams does NOT affect this data
      </p>

      {loading ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
          <div className="card p-6 space-y-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3" />
                <div className="h-3 bg-gray-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Platform Streams" value={data?.totalPlatformStreams ?? 0} icon={BarChart3} accent="brand" />
            <StatCard label="Active Platforms" value={data?.activePlatforms ?? 0} icon={Radio} accent="blue" />
            <StatCard
              label="Most Popular"
              value={data?.mostPopular ?? 'N/A'}
              accent="emerald"
              animate={false}
            />
            <StatCard
              label="Least Popular"
              value={data?.leastPopular ?? 'N/A'}
              accent="amber"
              animate={false}
            />
          </div>

          <div className="card p-6">
            <h2 className="text-heading text-gray-900 mb-1">Stream Count per Platform</h2>
            <p className="text-caption text-gray-500 mb-6">Sorted by most streamed — permanent data from stream history</p>

            {!data?.platforms?.length ? (
              <EmptyState
                icon={Radio}
                title="No stream data yet"
                description="Data appears after the first stream is recorded."
              />
            ) : (
              <div className="space-y-5">
                {data.platforms.map(({ name, count, percentage }, index) => {
                  const color = PLATFORM_COLORS[name] || '#7c3aed'
                  const pct = (count / maxCount) * 100
                  const isTop = index === 0
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-3 rounded-full ring-2 ring-offset-1 ring-brand-100"
                            style={{ background: color, boxShadow: `0 0 8px ${color}44` }}
                          />
                          <span className="text-sm capitalize font-medium text-gray-900">
                            {name === 'x' ? 'X (Twitter)' : name}
                          </span>
                          {isTop && (
                            <span className="badge bg-brand-50 text-brand-600 border border-brand-100">Top</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-medium">{percentage}%</span>
                          <span className="text-sm font-bold tabular-nums" style={{ color: isTop ? '#7c3aed' : color }}>
                            {count} stream{count > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          style={{
                            width: `${pct}%`,
                            background: isTop ? BRAND_GRADIENT : `linear-gradient(90deg, ${color}, ${color}99)`,
                            boxShadow: count > 0 ? `0 0 12px ${isTop ? '#7c3aed33' : color + '44'}` : 'none',
                            transition: 'width 0.8s ease',
                            minWidth: count > 0 ? '6px' : '0',
                          }}
                          className="h-3 rounded-full"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  )
}
