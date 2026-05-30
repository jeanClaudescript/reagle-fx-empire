import { motion } from 'framer-motion'
import { Award, BookOpen, TrendingUp, Video } from 'lucide-react'
import { BRAND } from '@/constants/brand'
import { useLanguage } from '@/context/LanguageContext'
import { useCmsContent } from '@/cms/CmsProvider'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/ScrollReveal'
import { CertificatesCarousel } from '@/components/public/CertificatesCarousel'
import { MediaThumb } from '@/components/media/MediaThumb'

const statKeys = [
  { key: 'statYears', valueKey: 'yearsValue', icon: Award },
  { key: 'statStudents', valueKey: 'studentsValue', icon: BookOpen },
  { key: 'statGrowth', valueKey: 'growthValue', icon: TrendingUp },
  { key: 'statSessions', valueKey: 'sessionsValue', icon: Video },
] as const

export function About() {
  const { t } = useLanguage()
  const active = useCmsContent()
  const coachBackground = active.about.coachBackgroundDataUrl

  return (
    <section id="about" className="relative section-pad">
      <div className="glow-orb right-0 top-1/4 h-72 w-72 bg-empire-purple/15" />
      <div className="section-container">
        <SectionHeading
          label={t.about.label}
          title={t.about.title}
          align="left"
        />

        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <ScrollReveal direction="left">
            <div>
              <div className="neon-border">
                <div className="glass-card relative aspect-[4/5] overflow-hidden sm:aspect-square">
                  {coachBackground ? (
                    <>
                      <img
                        src={coachBackground}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        aria-hidden
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-theme-bg/20 via-theme-bg/50 to-theme-bg/85" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-empire-purple/30 via-empire-navy to-empire-blue/20" />
                  )}

                  <div className="relative z-10 flex h-full flex-col items-center justify-center p-8 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                      className="mb-6 h-32 w-32 rounded-full border border-empire-purple/30 bg-gradient-to-br from-empire-purple/20 to-transparent p-1 sm:h-40 sm:w-40"
                    >
                      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-theme/20 bg-theme-bg/90 shadow-glass">
                        {active.about.coachImageDataUrl ? (
                          <MediaThumb
                            kind="image"
                            src={active.about.coachImageDataUrl}
                            alt={active.about.title}
                            title={active.about.title}
                            className="absolute inset-0 h-full w-full rounded-full"
                          >
                            <img
                              src={active.about.coachImageDataUrl}
                              alt={active.about.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </MediaThumb>
                        ) : (
                          <span className="font-display text-4xl font-bold text-gradient-brand sm:text-5xl">
                            CP
                          </span>
                        )}
                      </div>
                    </motion.div>
                    <p className="font-display text-xl font-bold text-theme-primary">{active.about.title}</p>
                    <p className="mt-1 text-sm text-theme-accent">{BRAND.brand}</p>
                    <p className="mt-4 text-sm text-theme-muted">{BRAND.location}</p>
                    {active.about.bio.trim() ? (
                      <p className="mt-2 text-xs text-theme-muted/90">{active.about.bio}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <CertificatesCarousel />
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.1}>
            <div className="space-y-5 text-theme-muted">
              <p className="text-base leading-relaxed sm:text-lg">{t.about.story}</p>
              <p className="leading-relaxed">{t.about.mission}</p>
              <p className="leading-relaxed">{t.about.experience}</p>
              <p className="border-l-2 border-theme-accent pl-4 italic text-theme-primary/80">
                {t.about.philosophy}
              </p>
            </div>
          </ScrollReveal>
        </div>

        <StaggerContainer className="mt-16 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {statKeys.map(({ key, valueKey, icon: Icon }) => (
            <StaggerItem key={key}>
              <motion.div
                whileHover={{ y: -4 }}
                className="glass-card-glow group p-5 text-center sm:p-6"
              >
                <Icon className="mx-auto mb-3 h-8 w-8 text-empire-purple-glow transition group-hover:scale-110" />
                <p className="font-display text-3xl font-bold text-theme-primary sm:text-4xl">
                  {t.about[valueKey]}
                </p>
                <p className="mt-1 text-xs text-theme-muted sm:text-sm">{t.about[key]}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
