import { Calculator, Lock, MapPin, Radio, Sparkles } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { GlowButton } from '@/components/ui/GlowButton'
import { ProgramValueCard } from '@/components/student/ProgramValueCard'
import { usePaymentConfig } from '@/hooks/usePaymentConfig'

const PERK_ICONS = [Radio, MapPin, Sparkles, Calculator] as const

/** Public teaser — full tools/live stay in paid zone only. */
export function StudentUpgradeTeaser() {
  const { t } = useLanguage()
  const { priceLabel } = usePaymentConfig()
  const unlockLabel = priceLabel ? `${t.live.unlockCta} — ${priceLabel}` : t.live.unlockCta
  const perks = [t.live.perkLive, t.live.perkPhysical, t.live.perkPaper, t.live.perkTools]

  return (
    <section id="tools" className="ps-section relative">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-empire-purple/5 to-transparent" aria-hidden />
      <div className="ps-section__inner relative">
        <div className="ps-hub-hero ps-hub-hero--center">
          <span className="ps-hub-hero__glow" aria-hidden />
          <span className="ps-status-pill ps-status-pill--vip inline-flex gap-2 border-theme-accent/30 bg-theme-accent/10 text-theme-accent">
            <Lock className="h-3.5 w-3.5" />
            {t.studentZone.membersOnly}
          </span>
          <h2 className="ps-hub-hero__title mt-4">{t.studentZone.title}</h2>
          <p className="ps-hub-hero__desc ps-hub-hero__desc--center">{t.studentZone.subtitle}</p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {perks.map((item, i) => {
            const Icon = PERK_ICONS[i] ?? Sparkles
            return (
              <div key={item} className="ps-hub-card group">
                <span className="ps-hub-card__icon ps-hub-card__icon--sky">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="admin-hub-card__body">
                  <span className="admin-hub-card__title">{item}</span>
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-8">
          <ProgramValueCard />
        </div>

        <div className="ps-hub-hero__actions mt-8">
          <GlowButton href="/pay" variant="primary" external={false}>
            {unlockLabel}
          </GlowButton>
          <GlowButton
            variant="secondary"
            external={false}
            onClick={() => {
              window.history.pushState({}, '', '/login')
              window.dispatchEvent(new PopStateEvent('popstate'))
            }}
          >
            {t.nav.login}
          </GlowButton>
        </div>

        <p id="live" className="sr-only">
          {t.nav.live}
        </p>
      </div>
    </section>
  )
}
