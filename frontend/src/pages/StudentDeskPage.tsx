import { useEffect } from 'react'
import { Crown, Loader2 } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { VipDeskShell } from '@/components/student/vip/VipDeskShell'
import { GlowButton } from '@/components/ui/GlowButton'

export function StudentDeskPage() {
  const { t } = useLanguage()
  const { loading, isPaid, hasVipSession, sessionError } = useStudentAccess()

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

  if (!isPaid || !hasVipSession) {
    return (
      <div className="vip-desk-gate">
        <Crown className="h-12 w-12 text-theme-accent" />
        <h1 className="mt-4 font-display text-2xl font-bold text-theme-primary">{t.vip.gateTitle}</h1>
        <p className="mt-2 max-w-md text-center text-sm text-theme-muted">
          {sessionError ?? t.vip.gateBody}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <GlowButton href="/login" variant="primary" external={false}>
            {t.nav.login}
          </GlowButton>
          <GlowButton href="/" variant="secondary" external={false}>
            {t.vip.backToSite}
          </GlowButton>
        </div>
      </div>
    )
  }

  return <VipDeskShell />
}
