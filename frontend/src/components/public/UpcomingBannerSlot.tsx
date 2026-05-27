import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useCmsContent } from '@/cms/CmsProvider'
import { GlowButton } from '@/components/ui/GlowButton'
import { BannerCountdown } from '@/components/public/BannerCountdown'
import { ShareMenu } from '@/components/share/ShareMenu'
import { parseEventDate } from '@/utils/eventDate'

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
    <div className="mt-6 flex flex-col gap-3 sm:mt-8">
      {banners.slice(0, 2).map((banner, idx) => {
        const shareUrl = banner.externalLink || banner.ctaLink || window.location.href
        const shareText = `${banner.title} - ${banner.date}`
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
            <div className="relative p-4 sm:p-5">
              <ShareMenu
                url={shareUrl}
                text={shareText}
                variant="overlay"
                className="upcoming-banner-share !right-3 !top-3 z-20 !opacity-100"
              />

              {hasImage ? (
                <>
                  <img
                    src={banner.imageDataUrl}
                    alt={banner.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/60" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-empire-purple/20 via-theme-surface/40 to-empire-blue-electric/10" />
              )}

              <div className="relative flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="upcoming-banner-eyebrow text-[10px] font-semibold uppercase tracking-[0.22em]">
                    Upcoming event
                  </p>
                  <p className="upcoming-banner-title mt-1 break-words font-display text-base font-bold sm:text-lg">
                    {banner.title}
                  </p>

                  {targetMs ? (
                    <div className="mt-4">
                      <BannerCountdown
                        dateText={banner.date}
                        targetMs={targetMs}
                        nowMs={nowMs}
                        theme={hasImage ? 'on-media' : 'plain'}
                      />
                    </div>
                  ) : (
                    <p className="upcoming-banner-date mt-2 inline-flex rounded-lg border px-2.5 py-1 text-xs">
                      {banner.date}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                  <GlowButton
                    href={banner.ctaLink}
                    variant="secondary"
                    className={
                      hasImage
                        ? 'w-full border-white/40 bg-white/90 text-slate-900 hover:bg-white sm:w-auto'
                        : 'w-full sm:w-auto'
                    }
                  >
                    {banner.ctaLabel}
                  </GlowButton>
                  {banner.externalLink ? (
                    <a
                      href={banner.externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="upcoming-banner-link inline-flex h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-semibold transition sm:w-auto"
                    >
                      Open Post
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-empire-purple to-empire-blue-electric" />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
