import { motion } from 'framer-motion'
import {
  Brain,
  BarChart3,
  Shield,
  Layers,
  GraduationCap,
  Radio,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useCmsContent } from '@/cms/CmsProvider'
import { isSectionEnabled } from '@/cms/sectionVisibility'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StaggerContainer, StaggerItem } from '@/components/ui/ScrollReveal'

const lessons = [
  { titleKey: 'risk', descKey: 'riskDesc', icon: Shield },
  { titleKey: 'technical', descKey: 'technicalDesc', icon: BarChart3 },
  { titleKey: 'psychology', descKey: 'psychologyDesc', icon: Brain },
  { titleKey: 'structure', descKey: 'structureDesc', icon: Layers },
  { titleKey: 'beginner', descKey: 'beginnerDesc', icon: GraduationCap },
  { titleKey: 'live', descKey: 'liveDesc', icon: Radio },
] as const

export function Lessons() {
  const { t } = useLanguage()
  const active = useCmsContent()

  if (!isSectionEnabled(active, 'lessons')) return null

  return (
    <section id="lessons" className="relative py-20 md:py-28">
      <div className="glow-orb -left-32 bottom-0 h-80 w-80 bg-empire-blue/15" />
      <div className="section-container relative">
        <SectionHeading
          label={t.lessons.label}
          title={t.lessons.title}
          subtitle={t.lessons.subtitle}
        />

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {lessons.map(({ titleKey, descKey, icon: Icon }) => (
            <StaggerItem key={titleKey}>
              <motion.div
                whileHover={{ y: -6 }}
                className="glass-card-glow group h-full p-6 sm:p-8"
              >
                <div className="mb-4 inline-flex rounded-xl bg-empire-purple/20 p-3 transition group-hover:bg-empire-purple/30 group-hover:shadow-glow-sm">
                  <Icon className="h-6 w-6 text-empire-purple-glow" />
                </div>
                <h3 className="font-display text-lg font-bold text-theme-primary sm:text-xl">
                  {t.lessons[titleKey]}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-theme-muted">
                  {t.lessons[descKey]}
                </p>

                {(() => {
                    const media = active.mastery.byKey[titleKey]
                    if (!media?.mediaDataUrl || media.type === 'placeholder') return null
                    const isVertical = media.orientation === 'vertical'
                    const aspect = isVertical ? 'aspect-[9/16]' : 'aspect-[16/9]'
                    const hasMedia = Boolean(media.mediaDataUrl)

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mt-5"
                      >
                        <div className="neon-border rounded-2xl">
                          <div className="glass-card overflow-hidden">
                            <div className={`relative w-full ${aspect} bg-empire-navy/40`}>
                              {media.type === 'image' && hasMedia ? (
                                <img
                                  src={media.mediaDataUrl}
                                  alt={media.title ?? 'Lesson media'}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-cover"
                                />
                              ) : media.type === 'video' && hasMedia ? (
                                <video
                                  src={media.mediaDataUrl}
                                  muted
                                  loop
                                  playsInline
                                  autoPlay
                                  preload="metadata"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full animate-pulse bg-gradient-to-br from-empire-purple/25 to-empire-blue-electric/10" />
                              )}
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })()}
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
