import { LogIn } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'

function goLogin() {
  window.history.pushState({}, '', '/login')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function StudentLoginNav({ onOpen }: { onOpen: () => void }) {
  const { t } = useLanguage()
  const { isLoggedIn, membershipStatus, loading } = useStudentAccess()

  if (loading && !isLoggedIn) {
    return (
      <span className="hidden h-9 w-20 animate-pulse rounded-xl bg-theme-elevated/60 sm:inline-block" aria-hidden />
    )
  }

  if (isLoggedIn) {
    const badgeClass =
      membershipStatus === 'paid'
        ? 'student-status-badge student-status-badge--paid'
        : membershipStatus === 'unpaid'
          ? 'student-status-badge student-status-badge--unpaid'
          : 'student-status-badge student-status-badge--missing'

    const label =
      membershipStatus === 'paid'
        ? t.studentLogin.paidBadge
        : membershipStatus === 'unpaid'
          ? t.studentLogin.unpaidBadge
          : t.studentLogin.notFoundBadge

    return (
      <button type="button" onClick={goLogin} className={`${badgeClass} hidden sm:inline-flex`}>
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (window.innerWidth < 640) goLogin()
        else onOpen()
      }}
      className="student-login-trigger hidden items-center gap-1.5 rounded-xl border border-theme-accent/35 bg-theme-accent/10 px-3 py-2 text-xs font-semibold text-theme-accent transition hover:bg-theme-accent/20 sm:inline-flex sm:text-sm"
    >
      <LogIn className="h-4 w-4" />
      {t.nav.login}
    </button>
  )
}
