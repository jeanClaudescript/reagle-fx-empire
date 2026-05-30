import { useEffect } from 'react'
import { Crown, Loader2 } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { VipDeskShell } from '@/components/student/vip/VipDeskShell'
import { ProgramValueCard } from '@/components/student/ProgramValueCard'
import { GlowButton } from '@/components/ui/GlowButton'

export function StudentDeskPage() {
  const { t } = useLanguage()
  const { loading, isPaid, hasVipSession, sessionError, membershipExpired, membershipStatus } =
    useStudentAccess()

  useEffect(() => {
    if (!loading && isPaid && hasVipSession && window.location.pathname !== '/desk') {
      window.history.replaceState({}, '', '/desk')
    }
  }, [loading, isPaid, hasVipSession])

  if (loading) {
    return (
      <div className="vip-desk-gate">
        <Loader2 className="h-8 w-8 animate-spin text-theme-accent" />
        <p className="mt-3 text-sm text-theme-muted">{t.vip.loading}</p>
      </div>
    )
  }

  if (membershipExpired || membershipStatus === 'expired') {
    return (
      <div className="vip-desk-gate vip-desk-gate--renew">
        <Crown className="h-12 w-12 text-amber-400" />
        <h1 className="mt-4 font-display text-2xl font-bold text-theme-primary">{t.membership.expiredTitle}</h1>
        <p className="mt-2 max-w-md text-center text-sm text-theme-muted">{t.membership.expiredDeskBody}</p>
        <div className="mt-6 w-full max-w-lg">
          <ProgramValueCard compact />
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <GlowButton href="/pay" variant="primary" external={false}>
            {t.membership.renewCta}
          </GlowButton>
          <GlowButton href="/" variant="secondary" external={false}>
            {t.vip.backToSite}
          </GlowButton>
        </div>
      </div>
    )
  }

  if (!isPaid || !hasVipSession) {
    return (
      <div className="vip-desk-gate">
        <Crown className="h-12 w-12 text-theme-accent" />
        <h1 className="mt-4 font-display text-2xl font-bold text-theme-primary">{t.vip.gateTitle}</h1>
        <p className="mt-2 max-w-md text-center text-sm text-theme-muted">
          {sessionError ?? t.vip.gateBody}
        </p>
        <div className="mt-6 w-full max-w-lg">
          <ProgramValueCard compact />
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <GlowButton href="/pay" variant="primary" external={false}>
            {t.membership.joinCta}
          </GlowButton>
          <GlowButton href="/login" variant="secondary" external={false}>
            {t.nav.login}
          </GlowButton>
        </div>
      </div>
    )
  }

  return <VipDeskShell />
}
