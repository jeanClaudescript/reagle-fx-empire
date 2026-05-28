import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, TrendingUp, Users, Shield } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { StudentLoginPanel, type StudentAuthMode } from '@/components/auth/StudentLoginPanel'
import { AdminLoginPanel } from '@/components/auth/AdminLoginPanel'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { BRAND } from '@/constants/brand'

export function LoginPage() {
  const { t } = useLanguage()
  const [studentMode, setStudentMode] = useState<StudentAuthMode>('login')
  const [adminOpen, setAdminOpen] = useState(false)
  const logoTaps = useRef({ count: 0, lastAt: 0 })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'admin' || params.get('role') === 'admin') {
      setAdminOpen(true)
    }
    if (params.get('mode') === 'signup') {
      setStudentMode('signup')
    }
  }, [])

  const onLogoTap = () => {
    const now = Date.now()
    if (now - logoTaps.current.lastAt > 900) logoTaps.current.count = 1
    else logoTaps.current.count += 1
    logoTaps.current.lastAt = now
    if (logoTaps.current.count >= 5) {
      setAdminOpen(true)
      logoTaps.current.count = 0
    }
  }

  const goHome = () => {
    window.history.pushState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="auth-page">
      <div className="auth-page__toolbar">
        <button type="button" onClick={goHome} className="auth-back-btn">
          <ArrowLeft className="h-4 w-4" />
          {t.authPage.backHome}
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <LanguageSwitcher compact />
        </div>
      </div>

      <div className="auth-page__grid">
        <div className="auth-page__form-side">
          <div className="auth-card">
            {adminOpen ? (
              <div className="auth-card__body">
                <AdminLoginPanel showLogo onLogoTap={onLogoTap} />
                <button
                  type="button"
                  className="auth-text-link mx-auto mt-4 block"
                  onClick={() => setAdminOpen(false)}
                >
                  ← {t.authPage.backToStudent}
                </button>
              </div>
            ) : (
              <>
                <div className="auth-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={studentMode === 'login'}
                    className={`auth-tab ${studentMode === 'login' ? 'auth-tab--active' : ''}`}
                    onClick={() => setStudentMode('login')}
                  >
                    {t.authPage.tabLogin}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={studentMode === 'signup'}
                    className={`auth-tab ${studentMode === 'signup' ? 'auth-tab--active' : ''}`}
                    onClick={() => setStudentMode('signup')}
                  >
                    {t.authPage.tabSignup}
                  </button>
                </div>

                <div className="auth-card__body">
                  <StudentLoginPanel
                    mode={studentMode}
                    onSwitchMode={setStudentMode}
                    showLogo
                    onLogoTap={onLogoTap}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="auth-page__hero-side">
          <div className="auth-hero">
            <p className="auth-hero__eyebrow">{BRAND.brand}</p>
            <h1 className="auth-hero__title">{t.authPage.heroTitle}</h1>
            <p className="auth-hero__text">{t.authPage.heroText}</p>
            <ul className="auth-hero__perks">
              <li>
                <TrendingUp className="h-5 w-5" />
                {t.authPage.perk1}
              </li>
              <li>
                <Users className="h-5 w-5" />
                {t.authPage.perk2}
              </li>
              <li>
                <Shield className="h-5 w-5" />
                {t.authPage.perk3}
              </li>
            </ul>
            <div className="auth-hero__preview" aria-hidden>
              <div className="auth-preview-card">
                <p className="text-xs text-white/70">EUR/USD</p>
                <p className="font-display text-2xl font-bold text-white">+124 pips</p>
              </div>
              <div className="auth-preview-card auth-preview-card--dim">
                <p className="text-xs text-white/70">Live class</p>
                <p className="font-display text-lg font-bold text-emerald-300">ON AIR</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
