/** Detect video URLs (file extension, Cloudinary /video/upload/, or common hosts). */
export function isVideoMediaUrl(url: string): boolean {
  const u = url.trim().toLowerCase()
  if (!u) return false
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(u)) return true
  if (u.includes('/video/upload/')) return true
  if (u.includes('resource_type=video')) return true
  if (/youtube\.com|youtu\.be|vimeo\.com|tiktok\.com/.test(u)) return true
  return false
}

export function mediaKindFromUrl(url: string): 'video' | 'image' {
  return isVideoMediaUrl(url) ? 'video' : 'image'
}
