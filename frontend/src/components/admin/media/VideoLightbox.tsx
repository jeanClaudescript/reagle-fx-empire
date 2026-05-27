import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, X } from 'lucide-react'

interface VideoLightboxProps {
  src: string
  poster?: string
  title?: string
  onClose: () => void
}

export function VideoLightbox({ src, poster, title, onClose }: VideoLightboxProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      videoRef.current?.pause()
    }
  }, [onClose])

  const startPlay = async () => {
    const el = videoRef.current
    if (!el) return
    try {
      await el.play()
      setPlaying(true)
    } catch {
      /* autoplay blocked */
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="media-lightbox-backdrop"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="media-video-shell"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="media-lightbox-chrome">
            <p className="media-lightbox-caption">{title ?? 'Video'}</p>
            <button type="button" className="media-lightbox-btn" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="media-video-stage flex-1">
            {!ready && (
              <div className="media-video-loading">
                <div className="cms-shimmer h-2 w-32 rounded-full" />
                <p className="mt-3 text-xs text-white/60">Loading cinematic preview…</p>
              </div>
            )}

            <video
              ref={videoRef}
              src={src}
              poster={poster}
              className="media-video-player"
              controls={playing}
              playsInline
              onLoadedData={() => setReady(true)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />

            {!playing && ready && (
              <button type="button" className="media-video-play" onClick={startPlay} aria-label="Play video">
                <span className="media-video-play-ring" />
                <Play className="relative h-10 w-10 fill-white text-white" />
              </button>
            )}

            <div className="media-video-vignette pointer-events-none" aria-hidden />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
