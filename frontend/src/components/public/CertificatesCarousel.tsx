import { motion } from 'framer-motion'
import { useCmsContent } from '@/cms/CmsProvider'
import { isSectionEnabled } from '@/cms/sectionVisibility'

export function CertificatesCarousel() {
  const active = useCmsContent()

  const certificates = [...active.certificates].sort((a, b) => a.order - b.order)

  if (!isSectionEnabled(active, 'certificates') || certificates.length === 0) return null

  return (
    <div className="mt-5">
      <div className="relative">
        <div className="scrollbar-hide -mx-2 flex gap-3 overflow-x-auto px-2 pb-3 snap-x snap-mandatory">
          {certificates.map((c, i) => {
            const hasImg = Boolean(c.imageDataUrl)
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.04 }}
                className="snap-center min-w-[168px] sm:min-w-[196px]"
              >
                <div className="neon-border">
                  <div className="glass-card overflow-hidden p-3">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-empire-navy/40">
                      {hasImg ? (
                        <img
                          src={c.imageDataUrl}
                          alt={c.title ?? 'Certificate'}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full animate-pulse bg-gradient-to-br from-empire-purple/20 to-empire-blue-electric/10" />
                      )}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-2">
                        <p className="truncate text-[11px] font-semibold text-white">
                          {c.title ?? `Certificate ${i + 1}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* fade edges hinting it's scrollable */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-theme-bg to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-theme-bg to-transparent" />
      </div>

      {/* mini preview indicators */}
      <div className="mt-1 flex items-center gap-2 overflow-hidden">
        <div className="flex gap-2">
          {certificates.slice(0, 4).map((c) => (
            <span
              key={`mini-${c.id}`}
              className="inline-block h-2.5 w-14 rounded-full bg-theme-accent/15"
            />
          ))}
        </div>
        {certificates.length > 4 && (
          <span className="ml-auto text-xs text-theme-muted">+{certificates.length - 4}</span>
        )}
      </div>
    </div>
  )
}

