import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote, TrendingUp, Wallet, Trophy } from 'lucide-react'
import { useState, useCallback } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const slides = [
  { type: 'mt5', profit: '+$2,450', label: 'profitToday', color: 'emerald' },
  { type: 'withdrawals', profit: '+$8,200', label: 'totalProfit', color: 'blue' },
  { type: 'studentWins', profit: '78%', label: 'winRate', color: 'purple' },
] as const

const testimonials = [
  { textKey: 'testimonial1', authorKey: 'author1' },
  { textKey: 'testimonial2', authorKey: 'author2' },
  { textKey: 'testimonial3', authorKey: 'author3' },
] as const

const galleryItems = [
  { title: 'EUR/USD', value: '+$340', pct: '+2.1%' },
  { title: 'GBP/JPY', value: '+$520', pct: '+3.4%' },
  { title: 'XAU/USD', value: '+$1,200', pct: '+5.8%' },
  { title: 'USD/CAD', value: '+$180', pct: '+1.2%' },
  { title: 'BTC/USD', value: '+$890', pct: '+4.2%' },
  { title: 'NAS100', value: '+$650', pct: '+2.9%' },
]

export function Results() {
  const { t } = useLanguage()
  const [slide, setSlide] = useState(0)
  const [testimonialIdx, setTestimonialIdx] = useState(0)

  const next = useCallback(() => setSlide((s) => (s + 1) % slides.length), [])
  const prev = useCallback(() => setSlide((s) => (s - 1 + slides.length) % slides.length), [])

  const typeLabels: Record<string, string> = {
    mt5: t.results.mt5,
    withdrawals: t.results.withdrawals,
    studentWins: t.results.studentWins,
  }

  return (
    <section id="results" className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-theme-elevated/50 via-transparent to-theme-bg" />
      <div className="glow-orb left-1/2 top-0 h-64 w-[500px] -translate-x-1/2 bg-empire-purple/10" />

      <div className="section-container relative">
        <SectionHeading
          label={t.results.label}
          title={t.results.title}
          subtitle={t.results.subtitle}
        />

        {/* Main slider */}
        <ScrollReveal className="relative mx-auto max-w-4xl">
          <div className="neon-border">
            <div className="glass-card overflow-hidden p-6 sm:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <div className="mb-4 flex justify-center">
                    {slide === 0 && <TrendingUp className="h-12 w-12 text-emerald-400" />}
                    {slide === 1 && <Wallet className="h-12 w-12 text-empire-blue-electric" />}
                    {slide === 2 && <Trophy className="h-12 w-12 text-empire-purple-glow" />}
                  </div>
                  <p className="text-sm uppercase tracking-widest text-theme-muted">
                    {typeLabels[slides[slide].type]}
                  </p>
                  <p className="mt-2 font-display text-5xl font-bold text-theme-primary sm:text-6xl">
                    {slides[slide].profit}
                  </p>
                  <p className="mt-2 text-theme-muted">
                    {t.results[slides[slide].label as keyof typeof t.results]}
                  </p>

                  {/* Mock chart bars */}
                  <div className="mt-8 flex h-24 items-end justify-center gap-2">
                    {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        className="w-3 rounded-t bg-gradient-to-t from-empire-purple to-empire-blue-electric sm:w-4"
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={prev}
                  className="rounded-full border border-theme p-2 text-theme-muted hover:border-theme-accent/50 hover:text-theme-primary"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSlide(i)}
                      className={`h-2 rounded-full transition-all ${
                        slide === i ? 'w-8 bg-empire-purple-glow' : 'w-2 bg-white/20'
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={next}
                  className="rounded-full border border-theme p-2 text-theme-muted hover:border-theme-accent/50 hover:text-theme-primary"
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Profit gallery */}
        <ScrollReveal delay={0.15} className="mt-12">
          <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
            {galleryItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="glass-card-glow min-w-[140px] shrink-0 p-4 sm:min-w-0"
              >
                <p className="text-xs text-theme-muted">{item.title}</p>
                <p className="font-display text-lg font-bold text-emerald-400">{item.value}</p>
                <p className="text-xs text-empire-purple-glow">{item.pct}</p>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>

        {/* Testimonials */}
        <ScrollReveal delay={0.2} className="mt-12">
          <h3 className="mb-6 text-center font-display text-xl font-semibold text-theme-primary">
            {t.results.testimonials}
          </h3>
          <div className="neon-border mx-auto max-w-2xl">
            <div className="glass-card p-8 text-center">
              <Quote className="mx-auto mb-4 h-8 w-8 text-empire-purple/50" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonialIdx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <p className="text-lg italic leading-relaxed text-theme-primary/80">
                    "{t.results[testimonials[testimonialIdx].textKey as keyof typeof t.results]}"
                  </p>
                  <p className="mt-4 text-sm font-medium text-empire-purple-glow">
                    — {t.results[testimonials[testimonialIdx].authorKey as keyof typeof t.results]}
                  </p>
                </motion.div>
              </AnimatePresence>
              <div className="mt-6 flex justify-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTestimonialIdx(i)}
                    className={`h-2 rounded-full transition-all ${
                      testimonialIdx === i ? 'w-6 bg-empire-purple' : 'w-2 bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
