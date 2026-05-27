import type { ReactNode } from 'react'
import { ZoomIn, Play } from 'lucide-react'
import { useMediaViewer } from '@/components/admin/media/MediaViewerContext'
import type { ImageViewerItem } from '@/components/admin/media/MediaViewerContext'
import { ShareMenu } from '@/components/share/ShareMenu'

interface MediaThumbProps {
  kind: 'image' | 'video'
  src: string
  poster?: string
  alt?: string
  title?: string
  gallery?: ImageViewerItem[]
  className?: string
  shareUrl?: string
  children?: ReactNode
}

/** Clickable media thumbnail — opens immersive fullscreen viewer (image/video). */
export function MediaThumb({
  kind,
  src,
  poster,
  alt,
  title,
  gallery,
  className = '',
  shareUrl,
  children,
}: MediaThumbProps) {
  const viewer = useMediaViewer()
  const shareTarget = shareUrl ?? src

  return (
    <div className={`media-thumb-wrap group relative ${className}`}>
      <button
        type="button"
        className="media-thumb group/button h-full w-full"
        onClick={() => {
          if (kind === 'video') viewer.openVideo(src, poster, title ?? alt)
          else viewer.openImage(src, alt, gallery)
        }}
        aria-label={kind === 'video' ? 'Open video' : 'Open image'}
      >
        {children}
        <span className="media-thumb-overlay">
          {kind === 'video' ? <Play className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
        </span>
      </button>
      <ShareMenu url={shareTarget} text={alt ?? title} variant="overlay" />
    </div>
  )
}
