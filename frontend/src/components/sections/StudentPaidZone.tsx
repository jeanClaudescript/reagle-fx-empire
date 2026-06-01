import { Crown, LayoutDashboard } from 'lucide-react'
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
    <section className="ps-section">
      <div className="ps-section__inner">
        <div className="ps-hub-hero ps-hub-hero--center admin-hub-hero--compact">
          <span className="ps-hub-hero__glow ps-hub-hero__glow--amber" aria-hidden />
          <span className="ps-hub-hero__eyebrow ps-status-pill ps-status-pill--vip inline-flex">
            <Crown className="h-3.5 w-3.5" />
            {t.vip.badge}
          </span>
          <h2 className="ps-hub-hero__title mt-3">{t.vip.entryTitle}</h2>
          <p className="ps-hub-hero__desc ps-hub-hero__desc--center mt-2">{t.vip.entryBody}</p>
          <div className="ps-hub-hero__actions">
            <GlowButton variant="primary" external={false} onClick={goDesk}>
              <LayoutDashboard className="h-4 w-4" />
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
