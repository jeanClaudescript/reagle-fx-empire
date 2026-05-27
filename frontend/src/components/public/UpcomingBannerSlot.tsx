import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Facebook, MessageCircle } from 'lucide-react'
import { useCmsContent } from '@/cms/CmsProvider'
import { GlowButton } from '@/components/ui/GlowButton'
import { buildShareLinks, copyShareLink, tryNativeShare } from '@/utils/share'

function getCountdownParts(targetText: string, nowMs: number) {
  const targetMs = Date.parse(targetText)
  if (!Number.isFinite(targetMs)) return null
  const diff = targetMs - nowMs
  if (diff <= 0) return null

  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds }
}

export function UpcomingBannerSlot() {
  const active = useCmsContent()
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const banners = [...active.upcomingBanners]
    .filter((b) => b.enabled)
    .sort((a, b) => a.order - b.order)

  if (banners.length === 0) return null

  return (
    <div className="mt-6 flex flex-col gap-3 sm:mt-8">
      {banners.slice(0, 2).map((banner, idx) => (
        (() => {
          const shareUrl = banner.externalLink || banner.ctaLink || window.location.href
          const shareText = `${banner.title} - ${banner.date}`
          const shareLinks = buildShareLinks({ url: shareUrl, text: shareText })
          return (
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: idx * 0.08 }}
          className="neon-border glass-card-glow overflow-hidden"
        >
          <div className="relative p-4 sm:p-5">
            {banner.imageDataUrl ? (
              <>
                <img
                  src={banner.imageDataUrl}
                  alt={banner.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/55" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-empire-purple/20 via-empire-blue-electric/10 to-transparent opacity-90" />
            )}
            <div className="relative flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-theme-muted">
                  Next session
                </p>
                <p className="mt-1 break-words font-display text-base font-bold text-theme-primary sm:text-lg">
                  {banner.title}
                </p>
                <p className="mt-1 text-xs text-theme-muted/90">{banner.date}</p>
                {(() => {
                  const countdown = getCountdownParts(banner.date, nowMs)
                  if (!countdown) return null
                  const items = [
                    { label: 'D', value: countdown.days },
                    { label: 'H', value: countdown.hours },
                    { label: 'M', value: countdown.minutes },
                    { label: 'S', value: countdown.seconds },
                  ]
                  return (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {items.map((item) => (
                        <div
                          key={item.label}
                          className="min-w-14 rounded-xl border border-white/20 bg-black/25 px-2 py-1 text-center backdrop-blur-sm"
                        >
                          <p className="font-display text-sm font-bold text-white">
                            {String(item.value).padStart(2, '0')}
                          </p>
                          <p className="text-[10px] font-semibold text-white/80">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              <GlowButton
                href={banner.ctaLink}
                variant="secondary"
                className="w-full border-white/40 bg-white/90 text-slate-900 hover:bg-white sm:w-auto"
              >
                {banner.ctaLabel}
              </GlowButton>
              {banner.externalLink ? (
                <a
                  href={banner.externalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/20 bg-transparent px-4 text-sm font-semibold text-white transition hover:bg-white/15 sm:w-auto"
                >
                  Open Post
                </a>
              ) : null}
            </div>
            <div className="relative mt-3 flex flex-wrap gap-2">
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-xs text-white/90 hover:bg-black/45"
              >
                <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</span>
              </a>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-xs text-white/90 hover:bg-black/45"
              >
                <span className="inline-flex items-center gap-1"><Facebook className="h-3.5 w-3.5" />Facebook</span>
              </a>
              <button
                type="button"
                onClick={async () => {
                  const nativeDone = await tryNativeShare({ url: shareUrl, text: shareText })
                  if (!nativeDone) await copyShareLink(shareUrl)
                }}
                className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-xs text-white/90 hover:bg-black/45"
              >
                Share / Copy
              </button>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-empire-purple to-empire-blue-electric" />
          </div>
        </motion.div>
          )
        })()
      ))}
    </div>
  )
}

