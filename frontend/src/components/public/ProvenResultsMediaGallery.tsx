import { motion } from 'framer-motion'
import { useCmsContent } from '@/cms/CmsProvider'

export function ProvenResultsMediaGallery() {
  const active = useCmsContent()
  const provenMedia = [...active.provenResults.media].sort((a, b) => a.order - b.order)

  const realMedia = provenMedia.filter(
    (m) => m.type !== 'placeholder' && Boolean(m.mediaDataUrl),
  )

  // Preserve your current premium Results UI unless the admin uploads real media.
  if (provenMedia.length === 0 || realMedia.length === 0) return null

  return (
    <div className="mt-10">
      <div className="neon-border mx-auto max-w-5xl">
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-sm font-semibold text-theme-primary">Real MT5 Results</p>
            <p className="text-xs text-theme-muted">Swipe →</p>
          </div>

          <div className="scrollbar-hide -mx-3 mt-4 flex gap-4 overflow-x-auto px-3 pb-2 snap-x snap-mandatory">
            {realMedia.map((m, idx) => {
              const isVertical = m.orientation === 'vertical'
              const aspect = isVertical ? 'aspect-[9/16]' : 'aspect-[16/9]'
              const minW =
                isVertical ? 'min-w-[180px] sm:min-w-[210px]' : 'min-w-[260px] sm:min-w-[300px]'

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: idx * 0.03 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className={`${minW} snap-start`}
                >
                  <div className="neon-border">
                    <div className="glass-card overflow-hidden">
                      <div className={`relative w-full ${aspect} bg-empire-navy/40`}>
                        {m.type === 'image' ? (
                          <img
                            src={m.mediaDataUrl}
                            alt={m.title ?? 'Proven result'}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <video
                            src={m.mediaDataUrl}
                            muted
                            loop
                            playsInline
                            autoPlay
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />
                        )}

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <p className="truncate text-[12px] font-semibold text-white">
                            {m.title ?? 'Proven result'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

