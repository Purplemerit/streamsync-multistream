import { useEffect, useState, useRef } from 'react'
import API from '../../utils/axios'
import AppLayout from '../../components/common/AppLayout'
import toast from 'react-hot-toast'
import { Trash2, Upload, Video, Play, CloudUpload } from 'lucide-react'
import VideoModal from '../../components/video/VideoModal'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { deferEffect } from '../../utils/deferEffect'
import { getVideoThumbnailUrl, isVideoPlayable } from '../../utils/cloudinary'

export default function MyVideosPage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [previewVideo, setPreviewVideo] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const fetchVideos = async () => {
    setError(false)
    try {
      const res = await API.get('/videos/my')
      setVideos(res.data)
    } catch {
      setError(true)
      toast.error('Failed to load videos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    deferEffect(() => fetchVideos())
  }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file || !title) return toast.error('Please provide a title and select a video')

    const formData = new FormData()
    formData.append('title', title)
    formData.append('video', file)

    setUploading(true)
    setProgress(0)

    try {
      await API.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          setProgress(Math.round((ev.loaded * 100) / ev.total))
        },
      })
      toast.success('Video uploaded successfully!')
      setTitle('')
      setFile(null)
      setProgress(0)
      fetchVideos()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f?.type?.startsWith('video/')) setFile(f)
    else toast.error('Please drop a video file')
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this video?')) return
    try {
      await API.delete(`/videos/${id}`)
      toast.success('Video deleted')
      setVideos(videos.filter((v) => v._id !== id))
    } catch {
      toast.error('Failed to delete video')
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  return (
    <AppLayout title="My Videos" subtitle="Upload and manage pre-recorded videos before going live.">
      <div className="card p-6 mb-8">
        <h2 className="text-heading text-gray-900 mb-4 flex items-center gap-2">
          <Upload size={18} className="text-brand-600" /> Upload new video
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="text-caption font-semibold text-gray-600 block mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My launch stream"
              className="input-field"
            />
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? 'border-brand-400 bg-brand-50 shadow-glow'
                : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
            }`}
          >
            <CloudUpload size={40} className={`mx-auto mb-3 ${dragOver ? 'text-brand-600' : 'text-gray-400'}`} />
            <p className="font-medium text-gray-900">
              {file ? file.name : 'Drag & drop or click to browse'}
            </p>
            <p className="text-caption text-gray-500 mt-1">MP4, MOV, AVI, MKV — max 2GB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          {uploading && (
            <div>
              <div className="flex justify-between text-caption text-gray-500 mb-1">
                <span>Uploading to Cloudinary…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-brand-600 h-2.5 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-caption text-gray-400 mt-1.5">
                Large videos may take several minutes. Keep this tab open.
              </p>
            </div>
          )}

          <button type="submit" disabled={uploading} className="btn-primary px-6 py-3 disabled:opacity-60">
            {uploading ? `Uploading ${progress}%…` : 'Upload Video'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-heading text-gray-900 mb-4 flex items-center gap-2">
          <Video size={18} className="text-brand-600" />
          Your library
          {!loading && <span className="text-caption text-gray-400 font-normal ml-1">({videos.length})</span>}
        </h2>

        {error ? (
          <ErrorState onRetry={() => { setLoading(true); fetchVideos() }} />
        ) : loading ? (
          <SkeletonGrid count={6} />
        ) : videos.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Video}
              title="No videos yet"
              description="Upload your first pre-recorded video to start multistreaming."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => {
              const thumb = getVideoThumbnailUrl(video.cloudinaryUrl)
              const playable = isVideoPlayable(video)
              const isMissing = video.status === 'missing'

              return (
                <div
                  key={video._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => playable && setPreviewVideo(video)}
                  onKeyDown={(e) => e.key === 'Enter' && playable && setPreviewVideo(video)}
                  className={`card-interactive overflow-hidden group ${playable ? 'cursor-pointer' : 'cursor-default opacity-90'}`}
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-brand-50 relative flex items-center justify-center overflow-hidden">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <Video size={32} className="text-gray-300 relative z-0" />
                    )}
                    {isMissing && (
                      <span className="absolute top-2 left-2 z-10 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                        File missing
                      </span>
                    )}
                    {playable && (
                      <div className="absolute inset-0 bg-brand-900/0 group-hover:bg-brand-900/40 transition-all duration-200 flex items-center justify-center z-10">
                        <div className="w-14 h-14 rounded-full bg-white/90 text-brand-600 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200 shadow-card">
                          <Play size={24} fill="currentColor" className="ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{video.title}</p>
                      <p className="text-caption text-gray-500 mt-0.5">
                        {formatSize(video.filesize)} · {new Date(video.createdAt).toLocaleDateString()}
                        {isMissing && ' · unavailable'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, video._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {previewVideo && (
        <VideoModal video={previewVideo} onClose={() => setPreviewVideo(null)} />
      )}
    </AppLayout>
  )
}
