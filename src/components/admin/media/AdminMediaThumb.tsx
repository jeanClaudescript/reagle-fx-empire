import type { ReactNode } from 'react'
import { ZoomIn, Play } from 'lucide-react'
import { useMediaViewer } from '@/components/admin/media/MediaViewerContext'
import type { ImageViewerItem } from '@/components/admin/media/MediaViewerContext'

interface AdminMediaThumbProps {
  kind: 'image' | 'video'
  src: string
  poster?: string
  alt?: string
  title?: string
  gallery?: ImageViewerItem[]
  className?: string
  children?: ReactNode
}

export function AdminMediaThumb({
  kind,
  src,
  poster,
  alt,
  title,
  gallery,
  className = '',
  children,
}: AdminMediaThumbProps) {
  const viewer = useMediaViewer()

  return (
    <button
      type="button"
      className={`admin-media-thumb group ${className}`}
      onClick={() => {
        if (kind === 'video') viewer.openVideo(src, poster, title ?? alt)
        else viewer.openImage(src, alt, gallery)
      }}
      aria-label={kind === 'video' ? 'Open video preview' : 'Open image preview'}
    >
      {children}
      <span className="admin-media-thumb-overlay">
        {kind === 'video' ? <Play className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
      </span>
    </button>
  )
}
