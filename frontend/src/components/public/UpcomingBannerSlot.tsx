import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useCmsContent } from '@/cms/CmsProvider'
import { GlowButton } from '@/components/ui/GlowButton'
import { BannerCountdown } from '@/components/public/BannerCountdown'
import { ShareMenu } from '@/components/share/ShareMenu'
import { parseEventDate } from '@/utils/eventDate'

function resolveBannerShareUrl(banner: { ctaLink?: string; externalLink?: string }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const candidates = [banner.ctaLink, banner.externalLink].filter(Boolean) as string[]
  for (const raw of candidates) {
    try {
      const url = raw.startsWith('http') ? new URL(raw) : new URL(raw, origin)
      if (url.hostname.includes('wa.me') || url.hostname.includes('whatsapp.com')) continue
      if (url.hostname.includes('facebook.com') || url.hostname.includes('instagram.com')) continue
      if (!raw.startsWith('http') || url.origin === origin) return url.href
    } catch {
      if (raw.startsWith('/')) return `${origin}${raw}`
    }
  }
  return `${origin}/`
}

export function UpcomingBannerSlot() {
  const active = useCmsContent()
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const banners = useMemo(
    () => [...active.upcomingBanners].filter((b) => b.enabled).sort((a, b) => a.order - b.order),
    [active.upcomingBanners],
  )

  if (banners.length === 0) return null

  return (
    <div className="mt-3 flex flex-col gap-2 sm:mt-8 sm:gap-3">
      {banners.slice(0, 2).map((banner, idx) => {
        const shareUrl = resolveBannerShareUrl(banner)
        const shareText = `${banner.title} — ${banner.date}. Join on CoachPeter:`
        const targetMs = parseEventDate(banner.date, nowMs)
        const hasImage = Boolean(banner.imageDataUrl)
        const toneClass = hasImage ? 'upcoming-banner--media' : 'upcoming-banner--plain'

        return (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: idx * 0.08 }}
            className={`group/banner upcoming-banner neon-border glass-card-glow overflow-hidden ${toneClass}`}
          >
            <div className="upcoming-banner__inner relative">
              <ShareMenu
                url={shareUrl}
                text={shareText}
                variant="overlay"
                className="upcoming-banner-share !right-2 !top-2 z-20 !opacity-100 sm:!right-3 sm:!top-3"
              />

              {hasImage ? (
                <>
                  <img
                    src={banner.imageDataUrl}
                    alt={banner.title}
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                  <div className="upcoming-banner__overlay absolute inset-0" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-empire-purple/20 via-theme-surface/40 to-empire-blue-electric/10" />
              )}

              <div className="relative flex min-w-0 flex-col items-start gap-2 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 w-full flex-1">
                  <p className="upcoming-banner-eyebrow text-[8px] font-semibold uppercase tracking-[0.18em] sm:text-[10px] sm:tracking-[0.22em]">
                    Upcoming event
                  </p>
                  <p className="upcoming-banner-title mt-0.5 line-clamp-2 break-words font-display text-sm font-bold leading-tight sm:mt-1 sm:line-clamp-none sm:text-lg">
                    {banner.title}
                  </p>

                  {targetMs ? (
                    <div className="mt-1.5 sm:mt-3">
                      <BannerCountdown
                        dateText={banner.date}
                        targetMs={targetMs}
                        nowMs={nowMs}
                        theme={hasImage ? 'on-media' : 'plain'}
                      />
                    </div>
                  ) : (
                    <p className="upcoming-banner-date mt-1 inline-flex rounded-lg border px-2 py-0.5 text-[10px] sm:mt-2 sm:px-2.5 sm:py-1 sm:text-xs">
                      {banner.date}
                    </p>
                  )}
                </div>

                <div className="upcoming-banner__actions flex w-full shrink-0 flex-row gap-1.5 sm:w-auto sm:flex-col sm:gap-2 lg:flex-col xl:flex-row">
                  <GlowButton
                    href={banner.ctaLink}
                    variant="secondary"
                    className={
                      hasImage
                        ? 'h-9 min-h-9 flex-1 border-white/40 bg-white/90 px-3 text-xs text-slate-900 hover:bg-white sm:h-11 sm:min-h-[44px] sm:flex-none sm:px-4 sm:text-sm'
                        : 'h-9 min-h-9 flex-1 px-3 text-xs sm:h-11 sm:min-h-[44px] sm:flex-none sm:px-4 sm:text-sm'
                    }
                  >
                    {banner.ctaLabel}
                  </GlowButton>
                  {banner.externalLink ? (
                    <a
                      href={banner.externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="upcoming-banner-link inline-flex h-9 min-h-9 flex-1 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition sm:h-11 sm:min-h-[44px] sm:flex-none sm:px-4 sm:text-sm"
                    >
                      Open Post
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-empire-purple to-empire-blue-electric sm:h-1" />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
