import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Copy, Facebook, MessageCircle, Minus, Plus, X, ZoomIn } from 'lucide-react'
import type { ImageViewerItem } from '@/components/admin/media/MediaViewerContext'
import { buildShareLinks, copyShareLink, tryNativeShare } from '@/utils/share'

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
  const swipeRef = useRef<{ x: number; y: number } | null>(null)

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

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + items.length) % items.length)
  }, [index, items.length, onIndexChange])

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % items.length)
  }, [index, items.length, onIndexChange])

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
      swipeRef.current = null
      return
    }
    if (e.touches.length === 1 && scale <= 1) {
      swipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      setScale(clampScale(pinchRef.current.scale * (dist / pinchRef.current.dist)))
      swipeRef.current = null
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    pinchRef.current = null

    if (swipeRef.current && scale <= 1 && items.length > 1 && e.changedTouches[0]) {
      const touch = e.changedTouches[0]
      const dx = touch.clientX - swipeRef.current.x
      const dy = touch.clientY - swipeRef.current.y
      swipeRef.current = null
      if (Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) goPrev()
        else goNext()
        return
      }
    }
    swipeRef.current = null
  }

  const onDoubleClick = () => {
    if (scale > 1) {
      setScale(1)
      setOffset({ x: 0, y: 0 })
    } else {
      setScale(2)
    }
  }

  if (!item) return null
  const pageUrl = window.location.href
  const shareUrl = item.src || pageUrl
  const links = buildShareLinks({ url: shareUrl, text: item.alt ?? 'Check this image' })

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="media-lightbox-backdrop"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={item.alt ?? 'Image viewer'}
      >
        <div className="media-lightbox-chrome" onClick={(e) => e.stopPropagation()}>
          <p className="media-lightbox-caption">{item.alt ?? ''}</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="media-lightbox-btn hidden sm:flex"
              onClick={() => setScale((s) => clampScale(s - 0.25))}
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="media-lightbox-btn hidden sm:flex"
              onClick={() => setScale((s) => clampScale(s + 0.25))}
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="media-lightbox-btn hidden sm:flex"
              onClick={() => {
                setScale(1)
                setOffset({ x: 0, y: 0 })
              }}
              aria-label="Reset zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button type="button" className="media-lightbox-btn" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="media-lightbox-btn"
              onClick={async () => {
                const nativeDone = await tryNativeShare({
                  url: shareUrl,
                  text: item.alt ?? 'Check this image',
                })
                if (!nativeDone) await copyShareLink(shareUrl)
              }}
              aria-label="Share image"
            >
              <Copy className="h-4 w-4" />
            </button>
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="media-lightbox-btn"
              aria-label="Share on WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href={links.facebook}
              target="_blank"
              rel="noreferrer"
              className="media-lightbox-btn"
              aria-label="Share on Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div
          className="media-lightbox-stage"
          onClick={(e) => e.stopPropagation()}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onDoubleClick={onDoubleClick}
        >
          <motion.img
            key={item.src}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
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
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              className="media-lightbox-nav media-lightbox-nav--next"
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
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
    </AnimatePresence>
  )
}
