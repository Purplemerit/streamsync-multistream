import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import toast from 'react-hot-toast'
import { ArrowRight, Users } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import { SkeletonTable, SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

export default function RecentRegistrationsPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    API.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const today = users.filter(u => {
    const d = new Date(u.createdAt)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length

  const thisWeek = users.filter(u => {
    const d = new Date(u.createdAt)
    const now = new Date()
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo
  }).length

  const admins = users.filter(u => u.role === 'admin').length

  return (
    <AppLayout
      title="Recent Registrations"
      subtitle="All users who have signed up on the platform."
    >
      {loading ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonTable rows={8} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Users" value={users.length} icon={Users} accent="blue" />
            <StatCard label="Joined Today" value={today} icon={Users} accent="emerald" />
            <StatCard label="This Week" value={thisWeek} icon={Users} accent="brand" />
            <StatCard label="Admins" value={admins} icon={Users} accent="amber" />
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field w-full md:w-96"
            />
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading text-gray-900">All Users ({filtered.length})</h2>
              <Link to="/admin/users" className="text-brand-600 text-sm hover:text-brand-700 flex items-center gap-1 font-medium">
                Full Management <ArrowRight size={14} />
              </Link>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No users found"
                description={search ? 'Try adjusting your search terms.' : 'No users have registered yet.'}
              />
            ) : (
              <div className="overflow-x-auto -mx-4 sm:-mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-200">
                      <th className="text-left pb-3 px-4 sm:px-6 font-medium">User</th>
                      <th className="text-left pb-3 pr-4 font-medium">Role</th>
                      <th className="text-left pb-3 pr-4 font-medium hidden md:table-cell">Date</th>
                      <th className="text-left pb-3 px-4 sm:px-6 font-medium hidden md:table-cell">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => (
                      <tr key={u._id} className="border-b border-gray-100 table-row-hover">
                        <td className="py-3 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                              {u.avatar
                                ? <img src={u.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                                : u.name?.[0]?.toUpperCase()
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{u.name}</p>
                              <p className="text-xs text-gray-500 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`badge ${
                            u.role === 'admin'
                              ? 'bg-brand-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-500 hidden md:table-cell">
                          {new Date(u.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-gray-400 hidden md:table-cell">
                          {new Date(u.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
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
