/**
 * Cloudinary thumbnail at 0s for video preview cards.
 */
export function getVideoThumbnailUrl(cloudinaryUrl) {
  if (!cloudinaryUrl) return null
  return cloudinaryUrl.replace('/upload/', '/upload/w_400,h_225,c_fill,so_0/')
}

/**
 * Playback URL — Cloudinary CDN directly, or legacy local stream endpoint.
 */
export function getVideoPlayUrl(video) {
  if (video?.cloudinaryUrl) return video.cloudinaryUrl
  if (video?.status === 'missing') return null
  const token = localStorage.getItem('token')
  const base = import.meta.env.VITE_API_URL
  return `${base}/videos/play/${video._id}/stream?token=${token}`
}

export function isVideoPlayable(video) {
  return video?.status !== 'missing' && (video?.cloudinaryUrl || video?.filepath)
}
