import { motion } from 'framer-motion'
import { Award, BookOpen, TrendingUp, Video } from 'lucide-react'
import { BRAND } from '@/constants/brand'
import { useLanguage } from '@/context/LanguageContext'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/ScrollReveal'

const statKeys = [
  { key: 'statYears', valueKey: 'yearsValue', icon: Award },
  { key: 'statStudents', valueKey: 'studentsValue', icon: BookOpen },
  { key: 'statGrowth', valueKey: 'growthValue', icon: TrendingUp },
  { key: 'statSessions', valueKey: 'sessionsValue', icon: Video },
] as const

export function About() {
  const { t } = useLanguage()

  return (
    <section id="about" className="relative py-20 md:py-28">
      <div className="glow-orb right-0 top-1/4 h-72 w-72 bg-empire-purple/15" />
      <div className="section-container">
        <SectionHeading
          label={t.about.label}
          title={t.about.title}
          align="left"
        />

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <ScrollReveal direction="left">
            <div className="neon-border">
              <div className="glass-card relative aspect-[4/5] overflow-hidden sm:aspect-square">
                <div className="absolute inset-0 bg-gradient-to-br from-empire-purple/30 via-empire-navy to-empire-blue/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    className="mb-6 h-32 w-32 rounded-full border border-empire-purple/30 bg-gradient-to-br from-empire-purple/20 to-transparent p-1 sm:h-40 sm:w-40"
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-empire-black/80">
                      <span className="font-display text-4xl font-bold text-gradient-brand sm:text-5xl">
                        CP
                      </span>
                    </div>
                  </motion.div>
                  <p className="font-display text-xl font-bold text-white">{BRAND.mentor}</p>
                  <p className="mt-1 text-sm text-empire-purple-glow">{BRAND.brand}</p>
                  <p className="mt-4 text-sm text-gray-400">{BRAND.location}</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-empire-black to-transparent" />
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.1}>
            <div className="space-y-5 text-gray-400">
              <p className="text-base leading-relaxed sm:text-lg">{t.about.story}</p>
              <p className="leading-relaxed">{t.about.mission}</p>
              <p className="leading-relaxed">{t.about.experience}</p>
              <p className="border-l-2 border-empire-purple pl-4 italic text-gray-300">
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
                <p className="font-display text-3xl font-bold text-white sm:text-4xl">
                  {t.about[valueKey]}
                </p>
                <p className="mt-1 text-xs text-gray-400 sm:text-sm">{t.about[key]}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
