import { useEffect, useState } from 'react'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import toast from 'react-hot-toast'
import { Key, Users } from 'lucide-react'
import { PLATFORM_LABELS } from '../../constants/platforms'
import StatCard from '../../components/ui/StatCard'
import { SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

const PLATFORM_COLORS = {
  youtube: '#FF0000', twitch: '#9146FF', facebook: '#1877F2',
  kick: '#53FC18', rumble: '#85C742', telegram: '#229ED9',
  x: '#64748b', instagram: '#E1306C',
}

export default function StreamKeysSavedPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const totalUsers = users.length
  const platformData = Object.entries(PLATFORM_COLORS).map(([platform, color]) => {
    const count = users.reduce((sum, u) => {
      const accounts = u.platforms?.[platform]
      return sum + (Array.isArray(accounts) ? accounts.length : accounts?.streamKey ? 1 : 0)
    }, 0)
    const pct = totalUsers > 0 ? (count / totalUsers) * 100 : 0
    return { platform, color, count, pct }
  }).sort((a, b) => b.count - a.count)

  const totalKeysSaved = platformData.reduce((acc, p) => acc + p.count, 0)
  const mostSaved = platformData[0]?.count > 0
    ? platformData.filter(p => p.count === platformData[0].count).map(p => PLATFORM_LABELS[p.platform]).join(' & ')
    : '—'

  return (
    <AppLayout
      title="Stream Keys Saved"
      subtitle="How many users have saved stream keys per platform."
    >
      {loading ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                <div className="h-8 bg-gray-100 rounded animate-pulse w-1/2" />
                <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard label="Most Keys Saved" value={mostSaved} icon={Key} accent="brand" animate={false} />
            <StatCard label="Total Keys Saved" value={totalKeysSaved} icon={Key} accent="emerald" />
            <StatCard
              label="Top Platform"
              value={platformData[0]?.platform ? PLATFORM_LABELS[platformData[0].platform] : '—'}
              icon={Users}
              accent="blue"
              animate={false}
            />
          </div>

          <div className="card p-6 mb-6">
            <h2 className="text-heading text-gray-900 mb-1">Keys Saved per Platform</h2>
            <p className="text-caption text-gray-500 mb-6">Out of {totalUsers} total users</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {platformData.map(({ platform, color, count, pct }) => (
                <div key={platform} className="card-interactive p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: color, boxShadow: `0 0 6px ${color}44` }}
                    />
                    <span className="text-sm font-medium text-gray-900">{PLATFORM_LABELS[platform]}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {count}
                    <span className="text-sm font-normal text-gray-400"> / {totalUsers}</span>
                  </p>
                  <p className="text-caption text-gray-500 mt-1">{pct.toFixed(1)}% of users</p>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}88)`,
                        minWidth: count > 0 ? '4px' : '0',
                        transition: 'width 0.6s ease',
                      }}
                      className="h-2 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-heading text-gray-900 mb-4">Users with Keys Saved</h2>
            {users.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No users yet"
                description="User key data will appear once users save stream keys."
              />
            ) : (
              <div className="overflow-x-auto -mx-4 sm:-mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b border-gray-200">
                      <th className="text-left pb-3 px-4 sm:px-6 font-medium">User</th>
                      {Object.keys(PLATFORM_COLORS).map(p => (
                        <th key={p} className="text-center pb-3 font-medium capitalize" style={{ color: PLATFORM_COLORS[p] }}>
                          {p === 'x' ? 'X' : p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-b border-gray-100 table-row-hover">
                        <td className="py-3 px-4 sm:px-6">
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-gray-500 text-xs">{u.email}</p>
                          </div>
                        </td>
                        {Object.keys(PLATFORM_COLORS).map(p => (
                          <td key={p} className="py-3 text-center">
                            {u.platforms?.[p]?.streamKey
                              ? <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-sm font-bold">✓</span>
                              : <span className="text-gray-300 text-base">—</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  )
}
