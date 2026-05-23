import { motion } from 'framer-motion'
import {
  ArrowRight,
  MessageCircle,
  TrendingUp,
  Users,
  Zap,
  Shield,
} from 'lucide-react'
import { BRAND } from '@/constants/brand'
import { useLanguage } from '@/context/LanguageContext'
import { scrollToSection } from '@/hooks/useScrollSpy'
import { GlowButton } from '@/components/ui/GlowButton'
import { ParticlesBackground } from '@/components/ui/ParticlesBackground'
import { CandlestickChart } from '@/components/ui/CandlestickChart'

const stats = [
  { key: 'statFollowers', icon: Users },
  { key: 'statCommunity', icon: Zap },
  { key: 'statMentorship', icon: TrendingUp },
  { key: 'statBeginner', icon: Shield },
] as const

export function Hero() {
  const { t } = useLanguage()

  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-20"
    >
      <div className="absolute inset-0 bg-gradient-empire" />
      <div className="glow-orb -left-40 top-20 h-96 w-96 bg-empire-purple/25" />
      <div className="glow-orb -right-20 bottom-20 h-80 w-80 bg-empire-blue/20" />

      <div className="absolute inset-0 opacity-40">
        <CandlestickChart />
      </div>
      <ParticlesBackground count={50} />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-empire-black/20 to-empire-black" />

      {/* Floating profit cards */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="glass-card absolute right-4 top-32 hidden border-emerald-500/30 p-4 shadow-glow-sm md:block lg:right-12 lg:top-40"
      >
        <p className="text-xs text-gray-400">{t.hero.profitLabel}</p>
        <p className="font-display text-2xl font-bold text-emerald-400">
          {t.hero.profitValue}
        </p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="glass-card absolute left-4 top-48 hidden border-empire-blue-electric/30 p-4 md:block lg:left-12"
      >
        <p className="text-xs text-gray-400">{t.hero.sessionLabel}</p>
        <p className="font-display text-xl font-bold text-empire-blue-electric">
          {t.hero.sessionValue}
        </p>
      </motion.div>

      <div className="section-container relative z-10 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-empire-purple/40 bg-empire-purple/10 px-4 py-2 text-sm font-semibold text-empire-purple-glow"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            {t.hero.badge}
          </motion.span>

          <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="text-gradient">{t.hero.headline}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg md:text-xl">
            {t.hero.subheadline}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <GlowButton href={BRAND.whatsappLink} variant="whatsapp">
              <MessageCircle className="h-5 w-5" />
              {t.hero.ctaWhatsapp}
            </GlowButton>
            <GlowButton
              variant="secondary"
              onClick={() => scrollToSection('results')}
              external={false}
            >
              {t.hero.ctaResults}
              <ArrowRight className="h-4 w-4" />
            </GlowButton>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          >
            {stats.map(({ key, icon: Icon }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="glass-card-glow flex flex-col items-center gap-2 p-4 sm:p-5"
              >
                <Icon className="h-5 w-5 text-empire-purple-glow" />
                <span className="text-center text-xs font-medium text-gray-300 sm:text-sm">
                  {t.hero[key]}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="h-10 w-6 rounded-full border-2 border-white/20 p-1">
          <motion.div
            className="mx-auto h-2 w-1 rounded-full bg-empire-purple-glow"
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </div>
      </motion.div>
    </section>
  )
}
