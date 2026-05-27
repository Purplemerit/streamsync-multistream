import { useEffect, useState } from 'react'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import toast from 'react-hot-toast'
import { Film, Play, Trash2 } from 'lucide-react'
import VideoModal from '../../components/video/VideoModal'
import { SkeletonTable } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

export default function ManageVideos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewVideo, setPreviewVideo] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    API.get('/admin/videos')
      .then(res => setVideos(res.data))
      .catch(() => toast.error('Failed to load videos'))
      .finally(() => setLoading(false))
  }, [])

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const handleDelete = async (e, id, title) => {
    e.stopPropagation()
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await API.delete(`/admin/videos/${id}`)
      toast.success('Video deleted')
      setVideos(prev => prev.filter(v => v._id !== id))
    } catch {
      toast.error('Failed to delete video')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AppLayout
      title="Manage Videos"
      subtitle="All videos uploaded by users. Click to preview."
    >
      <div className="card p-4 sm:p-6">
        <h2 className="text-heading text-gray-900 mb-4 flex items-center gap-2 flex-wrap">
          <Film size={18} className="text-brand-600" />
          All Videos
          <span className="ml-auto text-caption text-gray-500 font-normal">Click any row to preview</span>
        </h2>

        {loading ? (
          <SkeletonTable rows={6} />
        ) : videos.length === 0 ? (
          <EmptyState
            icon={Film}
            title="No videos uploaded"
            description="Videos uploaded by users will appear here."
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-200">
                  <th className="text-left pb-3 px-4 sm:px-6 font-medium">Title</th>
                  <th className="text-left pb-3 pr-4 font-medium">Uploaded By</th>
                  <th className="text-left pb-3 pr-4 font-medium">Size</th>
                  <th className="text-left pb-3 pr-4 font-medium">Date</th>
                  <th className="text-left pb-3 px-4 sm:px-6 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr
                    key={v._id}
                    onClick={() => setPreviewVideo(v)}
                    className="border-b border-gray-100 table-row-hover cursor-pointer"
                  >
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-brand-600 text-white p-2 rounded-lg shrink-0">
                          <Play size={14} />
                        </div>
                        <span className="font-medium text-gray-900">{v.title}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-gray-900">{v.userId?.name}</p>
                      <p className="text-xs text-gray-500">{v.userId?.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{formatSize(v.filesize)}</td>
                    <td className="py-3 pr-4 text-gray-500">
                      {new Date(v.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 sm:px-6">
                      <button
                        onClick={(e) => handleDelete(e, v._id, v.title)}
                        disabled={deletingId === v._id}
                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        {deletingId === v._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewVideo && (
        <VideoModal video={previewVideo} onClose={() => setPreviewVideo(null)} />
      )}
    </AppLayout>
  )
}
