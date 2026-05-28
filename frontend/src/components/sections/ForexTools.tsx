import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator, LineChart, Radio, Shield, TrendingUp } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { ArrangeableToolsGrid, type ToolCategory } from '@/components/forex/ArrangeableToolsGrid'

const perks = [
  { key: 'perk1' as const, icon: Calculator },
  { key: 'perk2' as const, icon: Shield },
  { key: 'perk3' as const, icon: LineChart },
  { key: 'perk4' as const, icon: Radio },
]

const CATS: { id: ToolCategory; labelKey: 'catAll' | 'catMarket' | 'catRisk' | 'catAnalysis' | 'catLive'; icon: typeof TrendingUp }[] = [
  { id: 'all', labelKey: 'catAll', icon: TrendingUp },
  { id: 'market', labelKey: 'catMarket', icon: LineChart },
  { id: 'live', labelKey: 'catLive', icon: Radio },
  { id: 'risk', labelKey: 'catRisk', icon: Shield },
  { id: 'analysis', labelKey: 'catAnalysis', icon: Calculator },
]

export function ForexTools() {
  const { t } = useLanguage()
  const [category, setCategory] = useState<ToolCategory>('all')

  return (
    <section id="tools" className="section-premium relative py-16 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-theme-bg via-empire-purple/5 to-theme-bg" />
      <div className="section-container relative">
        <SectionHeading label={t.tools.label} title={t.tools.title} subtitle={t.tools.subtitle} />

        <ScrollReveal>
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            {perks.map(({ key, icon: Icon }, i) => (
              <motion.span
                key={key}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -3 }}
                className="perk-pill"
              >
                <Icon className="h-4 w-4 text-theme-accent" />
                {t.tools[key]}
              </motion.span>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="forex-cat-bar mb-6 flex flex-wrap justify-center gap-2">
            {CATS.map(({ id, labelKey, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`forex-cat-pill ${category === id ? 'forex-cat-pill--active' : ''}`}
                onClick={() => setCategory(id)}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.tools[labelKey]}
              </button>
            ))}
          </div>
          <ArrangeableToolsGrid category={category} />
        </ScrollReveal>
      </div>
    </section>
  )
}
