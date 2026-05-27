import { useEffect, useState } from 'react'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import toast from 'react-hot-toast'
import { Trash2, Users, X, AlertTriangle } from 'lucide-react'
import { SkeletonTable } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(null)
  const [reason, setReason] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    API.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const openDeleteModal = (user) => {
    setDeleteModal(user)
    setReason('')
  }

  const closeDeleteModal = () => {
    setDeleteModal(null)
    setReason('')
  }

  const handleDelete = async () => {
    if (!reason.trim()) return toast.error('Please provide a reason for deletion')
    setDeleting(true)
    try {
      await API.delete(`/admin/users/${deleteModal._id}`, { data: { reason } })
      setUsers(users.filter(u => u._id !== deleteModal._id))
      toast.success('User deleted and email sent')
      closeDeleteModal()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppLayout
      title="Manage Users"
      subtitle="View and manage all registered users."
    >
      <div className="card p-4 sm:p-6">
        <h2 className="text-heading text-gray-900 mb-4 flex items-center gap-2">
          <Users size={18} className="text-brand-600" />
          All Users
        </h2>

        {loading ? (
          <SkeletonTable rows={6} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users yet"
            description="Registered users will appear here once they sign up."
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-200">
                  <th className="text-left pb-3 px-4 sm:px-6 font-medium">Name</th>
                  <th className="text-left pb-3 pr-4 font-medium">Email</th>
                  <th className="text-left pb-3 pr-4 font-medium">Role</th>
                  <th className="text-left pb-3 pr-4 font-medium">Joined</th>
                  <th className="text-left pb-3 px-4 sm:px-6 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-gray-100 table-row-hover">
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        {u.avatar
                          ? <img src={u.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                          : <div className="w-7 h-7 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{u.name[0]}</div>
                        }
                        <span className="text-gray-900 font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span className={`badge ${u.role === 'admin' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 sm:px-6">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => openDeleteModal(u)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md shadow-xl">

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Delete User</h3>
                  <p className="text-gray-500 text-xs">This action cannot be undone</p>
                </div>
              </div>
              <button onClick={closeDeleteModal} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
              <p className="text-gray-900 font-medium">{deleteModal.name}</p>
              <p className="text-gray-500 text-sm">{deleteModal.email}</p>
            </div>

            <div className="mb-4">
              <label className="text-gray-600 text-xs font-semibold mb-2 block uppercase tracking-wide">
                Reason for deletion <span className="text-red-600">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Violation of terms of service, spam activity, inappropriate content..."
                rows={3}
                className="input-field resize-none focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
              />
              <p className="text-gray-400 text-xs mt-1">
                This reason will be sent to the user via email.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 btn-secondary py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || !reason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition text-sm"
              >
                {deleting ? 'Deleting...' : 'Delete & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
