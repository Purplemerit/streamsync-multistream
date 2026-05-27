import { useEffect, useState, useCallback } from 'react'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import toast from 'react-hot-toast'
import { Activity, Tv, Trash2, Radio } from 'lucide-react'
import { SkeletonTable } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

export default function ManageStreams() {
  const [data, setData] = useState({ streams: [], activeSessions: [] })
  const [loading, setLoading] = useState(true)

  const fetchStreams = useCallback(() => {
    API.get('/admin/streams')
      .then((res) => setData(res.data))
      .catch(() => toast.error('Failed to load streams'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchStreams()
  }, [fetchStreams])

  const handleDelete = async (id) => {
    if (!confirm('Delete this stream record?')) return
    try {
      await API.delete(`/stream/admin/${id}`)
      toast.success('Stream deleted')
      setData(prev => ({
        ...prev,
        streams: prev.streams.filter(s => s._id !== id)
      }))
    } catch {
      toast.error('Failed to delete stream')
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'live') return 'bg-red-600 text-white'
    if (status === 'stopped') return 'bg-gray-500 text-white'
    return 'bg-amber-500 text-white'
  }

  return (
    <AppLayout
      title="Manage Streams"
      subtitle="Monitor and manage all streams across the platform."
    >
      {data.activeSessions.length > 0 && (
        <div className="card p-5 mb-6 border-red-200 bg-red-50">
          <h2 className="text-heading text-red-700 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Currently Live ({data.activeSessions.length})
          </h2>
          <div className="space-y-2">
            {data.activeSessions.map((s) => (
              <div key={s.sessionId} className="card px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-red-100">
                <span className="text-sm font-mono text-gray-700">{s.sessionId}</span>
                <div className="flex flex-wrap gap-2">
                  {s.platforms.map((p, i) => (
                    <span key={i} className="badge bg-gray-100 text-gray-600 capitalize">{p.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4 sm:p-6">
        <h2 className="text-heading text-gray-900 mb-4 flex items-center gap-2">
          <Activity size={18} className="text-brand-600" />
          All Streams
        </h2>

        {loading ? (
          <SkeletonTable rows={6} />
        ) : data.streams.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No streams yet"
            description="Stream records will appear here once users go live."
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-200">
                  <th className="text-left pb-3 px-4 sm:px-6 font-medium">Video</th>
                  <th className="text-left pb-3 pr-4 font-medium">Streamer</th>
                  <th className="text-left pb-3 pr-4 font-medium">Status</th>
                  <th className="text-left pb-3 pr-4 font-medium">Platforms</th>
                  <th className="text-left pb-3 pr-4 font-medium">Started</th>
                  <th className="text-left pb-3 px-4 sm:px-6 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.streams.map((s) => (
                  <tr key={s._id} className="border-b border-gray-100 table-row-hover">
                    <td className="py-3 px-4 sm:px-6 font-medium text-gray-900">
                      {s.videoId?.title || 'Unknown Video'}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-gray-900">{s.userId?.name}</p>
                      <p className="text-xs text-gray-500">{s.userId?.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`badge capitalize ${getStatusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {s.platforms.map((p, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 text-xs text-gray-700 capitalize">
                            <Tv size={10} className="text-brand-600" />
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(s.startedAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 sm:px-6">
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition border border-transparent hover:border-red-100"
                        title="Delete stream"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
