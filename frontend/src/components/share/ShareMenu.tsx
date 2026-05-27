import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Copy, Facebook, Instagram, Link2, MessageCircle, Share2, Smartphone } from 'lucide-react'
import { buildShareLinks, copyShareLink, tryNativeShare } from '@/utils/share'

export interface ShareMenuProps {
  url: string
  text?: string
  /** toolbar = in header row; floating = on media; overlay = show trigger on parent hover */
  variant?: 'toolbar' | 'floating' | 'overlay'
  className?: string
}

export function ShareMenu({ url, text, variant = 'floating', className = '' }: ShareMenuProps) {
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const links = buildShareLinks({ url, text })
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!feedback) return
    const id = window.setTimeout(() => setFeedback(null), 2200)
    return () => window.clearTimeout(id)
  }, [feedback])

  const flash = (msg: string) => {
    setFeedback(msg)
    setOpen(false)
  }

  const items = [
    ...(canNativeShare
      ? [
          {
            id: 'native',
            label: 'Share',
            icon: Smartphone,
            onClick: async () => {
              const ok = await tryNativeShare({ url, text })
              if (ok) flash('Shared')
            },
          },
        ]
      : []),
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      href: links.whatsapp,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      href: links.facebook,
    },
    {
      id: 'instagram',
      label: 'Instagram',
      icon: Instagram,
      onClick: async () => {
        const ok = await copyShareLink(url, text)
        if (ok) {
          flash('Copied — paste in Instagram')
          window.open(links.instagram, '_blank', 'noopener,noreferrer')
        }
      },
    },
    {
      id: 'copy',
      label: 'Copy link',
      icon: Copy,
      onClick: async () => {
        const ok = await copyShareLink(url, text)
        if (ok) flash('Link copied')
      },
    },
  ]

  return (
    <div
      ref={rootRef}
      className={`share-menu share-menu--${variant} ${open ? 'share-menu--open' : ''} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="share-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Share"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Share2 className="h-[18px] w-[18px]" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="share-menu-panel"
            role="menu"
          >
            <p className="share-menu-panel-title">
              <Link2 className="h-3.5 w-3.5" />
              Share
            </p>
            <ul className="share-menu-list">
              {items.map((item) => {
                const Icon = item.icon
                if ('href' in item && item.href) {
                  return (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="share-menu-item"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </a>
                    </li>
                  )
                }
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="share-menu-item"
                      role="menuitem"
                      onClick={() => void item.onClick?.()}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="share-menu-toast"
          >
            {feedback}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
