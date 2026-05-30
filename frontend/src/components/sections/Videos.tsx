import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { useCmsContent } from '@/cms/CmsProvider'
import { isSectionEnabled } from '@/cms/sectionVisibility'

const gradients = [
  'from-purple-900/80 to-blue-900/60',
  'from-blue-900/80 to-cyan-900/60',
  'from-emerald-900/80 to-teal-900/60',
  'from-violet-900/80 to-purple-900/60',
  'from-indigo-900/80 to-blue-900/60',
  'from-fuchsia-900/80 to-pink-900/60',
]

export function Videos() {
  const { t } = useLanguage()
  const active = useCmsContent()
  const teaching = [...active.teachingVideos].sort((a, b) => a.order - b.order)

  if (!isSectionEnabled(active, 'videos') || teaching.length === 0) return null

  const reelKeys = teaching.map((x) => x.reelKey)

  return (
    <section id="videos" className="relative section-pad">
      <div className="section-container">
        <SectionHeading
          label={t.videos.label}
          title={t.videos.title}
          subtitle={t.videos.subtitle}
        />

        <ScrollReveal>
          <div className="carousel-breakout scrollbar-hide flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory md:gap-6">
            {reelKeys.map((key, i) => {
              const item = teaching[i]
              const label = item?.label?.trim() ? item.label : t.videos[key]
              const hasVideo = Boolean(item?.videoDataUrl)
              const hasPoster = Boolean(item?.posterDataUrl)
              const gradientsClass = gradients[i] ?? gradients[0]

              return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.03, y: -4 }}
                className="group relative w-[200px] shrink-0 snap-center sm:w-[220px] md:w-[240px]"
              >
                <div className="neon-border">
                  <div
                    className={`relative aspect-[9/16] overflow-hidden rounded-2xl bg-gradient-to-br ${gradientsClass}`}
                  >
                    {/* Media background (when uploaded) */}
                    {hasVideo ? (
                      <video
                        src={item.videoDataUrl}
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="metadata"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : hasPoster ? (
                      <img
                        src={item.posterDataUrl}
                        alt={label}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDQwTDQwIDAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+')] opacity-50" />
                    )}

                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm transition group-hover:border-empire-purple-glow group-hover:shadow-glow">
                        <Play className="ml-1 h-6 w-6 fill-white text-white" />
                      </div>
                    </motion.div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-16">
                      <p className="text-sm font-semibold text-white">
                        {label}
                      </p>
                      <p className="mt-1 text-xs text-empire-purple-glow">Reagle FX Empire</p>
                    </div>

                    <motion.div
                      className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-empire-purple via-empire-blue-electric to-empire-purple"
                      animate={{ scaleX: [0, 1, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                </div>
              </motion.div>
              )
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
