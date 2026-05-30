import { Calculator, Lock, MapPin, Radio, Sparkles } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { GlowButton } from '@/components/ui/GlowButton'
import { ProgramValueCard } from '@/components/student/ProgramValueCard'
import { usePaymentConfig } from '@/hooks/usePaymentConfig'

/** Public teaser — full tools/live stay in paid zone only. */
export function StudentUpgradeTeaser() {
  const { t } = useLanguage()
  const { priceLabel } = usePaymentConfig()
  const unlockLabel = priceLabel ? `${t.live.unlockCta} — ${priceLabel}` : t.live.unlockCta

  return (
    <section id="tools" className="relative border-t border-theme section-pad">
      <div className="absolute inset-0 bg-gradient-to-b from-empire-purple/5 to-transparent" />
      <div className="section-container relative text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-theme-accent/30 bg-theme-accent/10 px-3 py-1 text-xs font-semibold text-theme-accent">
          <Lock className="h-3.5 w-3.5" />
          {t.studentZone.membersOnly}
        </span>
        <h2 className="mt-4 font-display text-2xl font-bold text-theme-primary sm:text-3xl">
          {t.studentZone.title}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-theme-muted sm:text-base">{t.studentZone.subtitle}</p>

        <ul className="mx-auto mt-8 flex max-w-md flex-col gap-3 text-left text-sm text-theme-primary">
          {[t.live.perkLive, t.live.perkPhysical, t.live.perkPaper, t.live.perkTools].map((item) => (
            <li key={item} className="flex items-center gap-3 rounded-xl border border-theme bg-theme-surface/60 px-4 py-3">
              {item === t.live.perkTools ? (
                <Calculator className="h-5 w-5 shrink-0 text-theme-accent" />
              ) : item === t.live.perkLive ? (
                <Radio className="h-5 w-5 shrink-0 text-theme-accent" />
              ) : item === t.live.perkPhysical ? (
                <MapPin className="h-5 w-5 shrink-0 text-theme-accent" />
              ) : (
                <Sparkles className="h-5 w-5 shrink-0 text-theme-accent" />
              )}
              {item}
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-8 max-w-lg text-left">
          <ProgramValueCard />
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
