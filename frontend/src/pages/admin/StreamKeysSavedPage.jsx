import { useEffect, useState, useMemo } from 'react'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import toast from 'react-hot-toast'
import { Key } from 'lucide-react'
import { PLATFORMS, PLATFORM_LABELS } from '../../constants/platforms'
import StatCard from '../../components/ui/StatCard'
import { SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

export default function StreamKeysSavedPage() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/admin/keys')
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Failed to load stream key stats'))
      .finally(() => setLoading(false))
  }, [])

  const platformMeta = useMemo(
    () => Object.fromEntries(PLATFORMS.map((p) => [p.id, p])),
    []
  )

  const sorted = useMemo(
    () => [...stats].sort((a, b) => b.totalAccounts - a.totalAccounts),
    [stats]
  )

  const totalAccounts = sorted.reduce((sum, s) => sum + s.totalAccounts, 0)
  const maxAccounts = sorted[0]?.totalAccounts || 0
  const topPlatform = sorted[0]?.platform

  return (
    <AppLayout
      title="Stream Keys Saved"
      subtitle="Aggregate stream key usage across all users."
    >
      {loading ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
          <div className="card p-6 space-y-4 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                <div className="h-8 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Total Accounts Saved"
              value={totalAccounts}
              icon={Key}
              accent="emerald"
            />
            <StatCard
              label="Top Platform"
              value={topPlatform ? PLATFORM_LABELS[topPlatform] : '—'}
              icon={Key}
              accent="brand"
              animate={false}
            />
            <StatCard
              label="Platforms in Use"
              value={sorted.filter((s) => s.totalAccounts > 0).length}
              icon={Key}
              accent="blue"
              animate={false}
            />
          </div>

          <div className="card p-6 mb-6">
            <h2 className="text-heading text-gray-900 mb-1">Accounts by Platform</h2>
            <p className="text-caption text-gray-500 mb-6">Bar length = share of total saved accounts</p>

            {maxAccounts === 0 ? (
              <EmptyState
                icon={Key}
                title="No stream keys saved yet"
                description="Stats will appear when users save stream keys."
              />
            ) : (
              <div className="space-y-4">
                {sorted.map(({ platform, totalAccounts: count }) => {
                  const meta = platformMeta[platform] || { hex: '#94a3b8', dot: 'bg-slate-400' }
                  const pct = maxAccounts > 0 ? (count / maxAccounts) * 100 : 0
                  return (
                    <div key={platform}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full shrink-0 ${meta.dot}`} />
                          <span className="font-medium text-gray-900">{PLATFORM_LABELS[platform] || platform}</span>
                        </div>
                        <span className="text-gray-500 tabular-nums">{count} accounts</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${meta.hex}, ${meta.hex}99)`,
                            minWidth: count > 0 ? '4px' : '0',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card p-6 overflow-x-auto">
            <h2 className="text-heading text-gray-900 mb-4">Platform Breakdown</h2>
            {sorted.every((s) => s.totalAccounts === 0) ? (
              <EmptyState
                icon={Key}
                title="No data yet"
                description="Platform breakdown will show once users save keys."
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-200">
                    <th className="text-left pb-3 font-medium">Platform</th>
                    <th className="text-right pb-3 font-medium">Total Accounts</th>
                    <th className="text-right pb-3 font-medium">Total Users</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(({ platform, totalAccounts: accounts, totalUsers }) => {
                    const meta = platformMeta[platform]
                    return (
                      <tr key={platform} className="border-b border-gray-100 table-row-hover">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full shrink-0 ${meta?.dot || 'bg-slate-400'}`} />
                            <span className="font-medium text-gray-900">{PLATFORM_LABELS[platform] || platform}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right tabular-nums font-semibold text-gray-900">{accounts}</td>
                        <td className="py-3 text-right tabular-nums text-gray-600">{totalUsers}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </AppLayout>
  )
}
