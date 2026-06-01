import { Crown } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { StudentUpgradeTeaser } from '@/components/sections/StudentUpgradeTeaser'
import { GlowButton } from '@/components/ui/GlowButton'

/**
 * Public homepage block: unpaid visitors see upgrade teaser;
 * paid members see a VIP desk entry banner (tools live on /desk).
 */
export function StudentPaidZone() {
  const { t } = useLanguage()
  const { accessMode, hasVipSession, loading } = useStudentAccess()
  const showDeskEntry =
    accessMode === 'paid' || accessMode === 'promo' || (hasVipSession && accessMode !== 'expired')

  if (loading) {
    return <div className="min-h-[24vh] border-t border-theme" aria-hidden />
  }

  if (!showDeskEntry) {
    return <StudentUpgradeTeaser />
  }

  const goDesk = () => {
    window.history.pushState({}, '', '/desk')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <section className="border-t border-theme bg-theme-bg section-pad">
      <div className="section-container">
        <div className="vip-entry-banner">
          <div className="vip-entry-banner__glow" aria-hidden />
          <Crown className="h-10 w-10 text-amber-400" />
          <h2 className="mt-4 font-display text-2xl font-bold text-theme-primary">{t.vip.entryTitle}</h2>
          <p className="mt-2 max-w-lg text-sm text-theme-muted">{t.vip.entryBody}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <GlowButton variant="primary" external={false} onClick={goDesk}>
              {hasVipSession ? t.vip.openDesk : t.nav.login}
            </GlowButton>
            <GlowButton href="/" variant="secondary" external={false}>
              {t.nav.home}
            </GlowButton>
          </div>
        </div>
      </div>
    </section>
  )
}
