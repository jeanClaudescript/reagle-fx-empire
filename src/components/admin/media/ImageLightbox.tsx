import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Minus, Plus, X, ZoomIn } from 'lucide-react'
import type { ImageViewerItem } from '@/components/admin/media/MediaViewerContext'

interface ImageLightboxProps {
  items: ImageViewerItem[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

export function ImageLightbox({ items, index, onClose, onIndexChange }: ImageLightboxProps) {
  const item = items[index]
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null)

  const clampScale = (v: number) => Math.min(4, Math.max(1, v))

  useEffect(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [index, item?.src])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && items.length > 1) onIndexChange((index - 1 + items.length) % items.length)
      if (e.key === 'ArrowRight' && items.length > 1) onIndexChange((index + 1) % items.length)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [index, items.length, onClose, onIndexChange])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setScale((s) => clampScale(s + (e.deltaY < 0 ? 0.15 : -0.15)))
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.x),
      y: dragRef.current.oy + (e.clientY - dragRef.current.y),
    })
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = { dist: Math.hypot(dx, dy), scale }
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      setScale(clampScale(pinchRef.current.scale * (dist / pinchRef.current.dist)))
    }
  }

  const onTouchEnd = () => {
    pinchRef.current = null
  }

  if (!item) return null

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
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className="media-lightbox-shell"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="media-lightbox-toolbar">
            <p className="truncate text-sm font-medium text-white/80">{item.alt ?? 'Image preview'}</p>
            <div className="flex items-center gap-1">
              <button type="button" className="media-lightbox-btn" onClick={() => setScale((s) => clampScale(s - 0.25))} aria-label="Zoom out">
                <Minus className="h-4 w-4" />
              </button>
              <button type="button" className="media-lightbox-btn" onClick={() => setScale((s) => clampScale(s + 0.25))} aria-label="Zoom in">
                <Plus className="h-4 w-4" />
              </button>
              <button type="button" className="media-lightbox-btn" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }} aria-label="Reset zoom">
                <ZoomIn className="h-4 w-4" />
              </button>
              <button type="button" className="media-lightbox-btn" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            className="media-lightbox-stage"
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={item.src}
              alt={item.alt ?? ''}
              draggable={false}
              className="media-lightbox-image"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              }}
            />
          </div>

          {items.length > 1 && (
            <>
              <button
                type="button"
                className="media-lightbox-nav media-lightbox-nav--prev"
                onClick={() => onIndexChange((index - 1 + items.length) % items.length)}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="media-lightbox-nav media-lightbox-nav--next"
                onClick={() => onIndexChange((index + 1) % items.length)}
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <p className="media-lightbox-counter">
                {index + 1} / {items.length}
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
