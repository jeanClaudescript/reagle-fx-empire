import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { DailyUpdate } from '@/cms/types'
import { formatRelativeTime } from '@/utils/relativeTime'
import { ShareMenu } from '@/components/share/ShareMenu'

interface StoryViewerModalProps {
  items: DailyUpdate[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

export function StoryViewerModal({ items, index, onClose, onIndexChange }: StoryViewerModalProps) {
  const item = items[index]
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + items.length) % items.length)
  }, [index, items.length, onIndexChange])

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % items.length)
  }, [index, items.length, onIndexChange])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && items.length > 1) goPrev()
      if (e.key === 'ArrowRight' && items.length > 1) goNext()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, goPrev, goNext, items.length])

  if (!item) return null

  const shareUrl = item.externalLink || window.location.href

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="story-viewer-backdrop"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Daily update"
      >
        <div className="story-viewer-progress" aria-hidden>
          {items.map((_, i) => (
            <span key={items[i].id} className={i === index ? 'story-viewer-progress-bar is-active' : 'story-viewer-progress-bar'} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="story-viewer-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute right-3 top-3 z-30 flex items-center gap-2">
            <ShareMenu url={shareUrl} text={item.caption} variant="toolbar" />
            <button type="button" className="share-menu-trigger" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="story-viewer-stage">
            {item.type === 'image' && item.mediaDataUrl ? (
              <img src={item.mediaDataUrl} alt="" className="story-viewer-media" />
            ) : null}
            {item.type === 'video' && item.mediaDataUrl ? (
              <video
                src={item.mediaDataUrl}
                poster={item.posterDataUrl}
                className="story-viewer-media"
                controls
                autoPlay
                playsInline
              />
            ) : null}
            {item.type === 'text' ? (
              <div className="story-viewer-text-card">
                <p className="story-viewer-text">{item.caption}</p>
              </div>
            ) : null}
            <div className="story-viewer-caption-wrap">
              <p className="story-viewer-time">
                {(() => {
                  const rel = formatRelativeTime(item.createdAt, nowMs)
                  return rel === 'Now' ? 'Just now' : `${rel} ago`
                })()}
              </p>
              {item.type !== 'text' && item.caption ? (
                <p className="story-viewer-caption">{item.caption}</p>
              ) : null}
            </div>
          </div>
        </motion.div>

        {items.length > 1 && (
          <>
            <button type="button" className="story-viewer-nav story-viewer-nav--prev" onClick={goPrev} aria-label="Previous">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button type="button" className="story-viewer-nav story-viewer-nav--next" onClick={goNext} aria-label="Next">
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
