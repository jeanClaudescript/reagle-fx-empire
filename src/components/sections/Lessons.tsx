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
                <h3 className="font-display text-lg font-bold text-white sm:text-xl">
                  {t.lessons[titleKey]}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {t.lessons[descKey]}
                </p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
