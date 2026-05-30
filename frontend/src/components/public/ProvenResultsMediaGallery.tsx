import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useCmsContent } from '@/cms/CmsProvider'
import { MediaThumb } from '@/components/media/MediaThumb'
import type { ImageViewerItem } from '@/components/admin/media/MediaViewerContext'

export function ProvenResultsMediaGallery() {
  const active = useCmsContent()
  const provenMedia = [...active.provenResults.media].sort((a, b) => a.order - b.order)

  const realMedia = provenMedia.filter(
    (m) => m.type !== 'placeholder' && Boolean(m.mediaDataUrl),
  )

  const imageGallery = useMemo<ImageViewerItem[]>(
    () =>
      realMedia
        .filter((m) => m.type === 'image')
        .map((m) => ({ src: m.mediaDataUrl!, alt: m.title ?? 'Proven result' })),
    [realMedia],
  )

  if (provenMedia.length === 0 || realMedia.length === 0) return null

  return (
    <div className="mt-10">
      <div className="neon-border mx-auto max-w-5xl">
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-sm font-semibold text-theme-primary">Real MT5 Results</p>
            <p className="text-xs text-theme-muted">Swipe →</p>
          </div>

          <div className="carousel-breakout scrollbar-hide mt-4 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
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
                        <MediaThumb
                          kind={m.type === 'image' ? 'image' : 'video'}
                          src={m.mediaDataUrl!}
                          alt={m.title ?? 'Proven result'}
                          title={m.title ?? 'Proven result'}
                          gallery={m.type === 'image' ? imageGallery : undefined}
                          shareUrl={m.externalLink}
                          className="absolute inset-0 h-full w-full"
                        >
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
                        </MediaThumb>

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 z-[1] p-3">
                          <p className="truncate text-[12px] font-semibold text-white">
                            {m.title ?? 'Proven result'}
                          </p>
                          {m.externalLink ? (
                            <a
                              href={m.externalLink}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex text-[10px] font-semibold text-white/90 underline decoration-white/40 underline-offset-2"
                            >
                              Open post
                            </a>
                          ) : null}
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
