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
import { LiveForexChart } from '@/components/ui/LiveForexChart'
import { DailyUpdatesStrip } from '@/components/public/DailyUpdatesStrip'
import { UpcomingBannerSlot } from '@/components/public/UpcomingBannerSlot'
import { usePaymentConfig } from '@/hooks/usePaymentConfig'

const stats = [
  { key: 'statFollowers', icon: Users },
  { key: 'statCommunity', icon: Zap },
  { key: 'statMentorship', icon: TrendingUp },
  { key: 'statBeginner', icon: Shield },
] as const

export function Hero() {
  const { t } = useLanguage()
  const { priceLabel } = usePaymentConfig()
  const unlockLabel = priceLabel ? `${t.hero.ctaUnlock} — ${priceLabel}` : t.hero.ctaUnlock

  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] flex-col overflow-hidden pt-[72px]"
    >
      <div className="hero-mesh absolute inset-0" />
      <div className="glow-orb -left-40 top-20 h-72 w-72 bg-empire-purple/20 dark:bg-empire-purple/25 sm:h-96 sm:w-96" />
      <div className="glow-orb -right-20 bottom-32 h-64 w-64 bg-empire-blue/15 dark:bg-empire-blue/20" />
      <ParticlesBackground count={40} className="opacity-60 dark:opacity-100" />

      <div className="scan-overlay pointer-events-none absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-theme-bg/30 to-theme-bg" />

      {/* Desktop floating cards */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="glass-card absolute right-6 top-28 z-20 hidden border-emerald-500/30 p-4 lg:block xl:right-12"
      >
        <p className="text-xs text-theme-muted">{t.hero.profitLabel}</p>
        <p className="font-display text-2xl font-bold text-emerald-500">{t.hero.profitValue}</p>
      </motion.div>

      <div className="section-container relative z-10 flex flex-1 flex-col justify-center py-8 sm:py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto w-full max-w-4xl text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-theme-accent/30 bg-theme-accent/10 px-3 py-1.5 text-xs font-semibold text-theme-accent sm:mb-6 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400 sm:h-2 sm:w-2" />
            {t.hero.badge}
          </motion.span>

          <h1 className="font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="text-gradient">{t.hero.headline}</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-theme-muted sm:mt-6 sm:text-lg md:text-xl">
            {t.hero.subheadline}
          </p>

          <DailyUpdatesStrip />

          <UpcomingBannerSlot />

          {/* Live forex chart — hero on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="mx-auto mt-6 w-full max-w-lg sm:mt-8 md:max-w-2xl lg:max-w-3xl"
          >
            <LiveForexChart
              className="h-[220px] w-full rounded-2xl sm:h-[280px] sm:rounded-3xl md:h-[320px]"
              compact
            />
          </motion.div>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
            <GlowButton href={BRAND.whatsappLink} variant="whatsapp" className="w-full sm:w-auto">
              <MessageCircle className="h-5 w-5" />
              {t.hero.ctaWhatsapp}
            </GlowButton>
            <GlowButton href="/pay" variant="primary" external={false} className="w-full sm:w-auto">
              {unlockLabel}
            </GlowButton>
            <GlowButton
              variant="secondary"
              onClick={() => scrollToSection('results')}
              external={false}
              className="w-full sm:w-auto"
            >
              {t.hero.ctaResults}
              <ArrowRight className="h-4 w-4" />
            </GlowButton>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-8 grid grid-cols-2 gap-2.5 sm:mt-10 sm:gap-4 lg:grid-cols-4"
          >
            {stats.map(({ key, icon: Icon }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 + i * 0.08 }}
                whileTap={{ scale: 0.97 }}
                className="mobile-stat-pill"
              >
                <Icon className="h-4 w-4 text-theme-accent sm:h-5 sm:w-5" />
                <span className="text-center text-[11px] font-medium leading-tight text-theme-primary sm:text-sm">
                  {t.hero[key]}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 sm:block"
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="h-9 w-5 rounded-full border-2 border-theme-border/30 p-1">
          <motion.div
            className="mx-auto h-1.5 w-1 rounded-full bg-theme-accent"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </div>
      </motion.div>
    </section>
  )
}
