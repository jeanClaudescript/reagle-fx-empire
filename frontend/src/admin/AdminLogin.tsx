import { useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { isAdminAuthenticated } from '@/admin/auth'
import { AdminLoginPanel } from '@/components/auth/AdminLoginPanel'
import { AdminThemeToggle } from '@/components/admin/AdminThemeToggle'
import { AdminLanguageSwitcher } from '@/components/admin/AdminLanguageSwitcher'

/** Legacy route — redirects to unified login. */
export function AdminLogin() {
  const { t } = useLanguage()

  useEffect(() => {
    if (isAdminAuthenticated()) {
      window.location.pathname = '/admin'
      return
    }
    window.history.replaceState({}, '', '/login?tab=admin')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])

  return (
    <div className="auth-page">
      <div className="auth-page__toolbar">
        <span className="text-sm text-theme-muted">{t.authPage.tabAdmin}</span>
        <div className="flex items-center gap-2">
          <AdminLanguageSwitcher compact />
          <AdminThemeToggle />
        </div>
      </div>
      <div className="auth-page__form-side mx-auto w-full max-w-md px-4 py-8">
        <div className="auth-card auth-card__body">
          <AdminLoginPanel />
        </div>
      </div>
    </div>
  )
}
