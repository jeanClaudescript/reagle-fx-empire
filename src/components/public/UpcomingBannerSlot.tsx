import { motion } from 'framer-motion'
import { useCmsContent } from '@/cms/CmsProvider'
import { GlowButton } from '@/components/ui/GlowButton'

export function UpcomingBannerSlot() {
  const active = useCmsContent()

  const banners = [...active.upcomingBanners]
    .filter((b) => b.enabled)
    .sort((a, b) => a.order - b.order)

  if (banners.length === 0) return null

  return (
    <div className="mt-6 flex flex-col gap-3 sm:mt-8">
      {banners.slice(0, 2).map((banner, idx) => (
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: idx * 0.08 }}
          className="neon-border glass-card-glow overflow-hidden"
        >
          <div className="relative p-4 sm:p-5">
            <div className="absolute inset-0 bg-gradient-to-r from-empire-purple/20 via-empire-blue-electric/10 to-transparent opacity-90" />
            <div className="relative flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-theme-muted">
                  Next session
                </p>
                <p className="mt-1 break-words font-display text-base font-bold text-theme-primary sm:text-lg">
                  {banner.title}
                </p>
                <p className="mt-1 text-xs text-theme-muted/90">{banner.date}</p>
              </div>

              <GlowButton
                href={banner.ctaLink}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                {banner.ctaLabel}
              </GlowButton>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-empire-purple to-empire-blue-electric" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

