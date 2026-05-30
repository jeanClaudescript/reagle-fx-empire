import { Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import {
  getRememberedAdminEmail,
  hasAdminAccounts,
  loginAdmin,
} from '@/admin/auth'

export function AdminLoginPanel({
  showLogo = true,
  onLogoTap,
}: {
  showLogo?: boolean
  onLogoTap?: () => void
}) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFirstSetup, setIsFirstSetup] = useState(false)

  useEffect(() => {
    void hasAdminAccounts().then((has) => setIsFirstSetup(!has))
    const saved = getRememberedAdminEmail()
    if (saved) setEmail(saved)
  }, [])

  return (
    <form
      className="auth-form-stack"
      onSubmit={async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
          await loginAdmin(email, password, remember)
          window.location.pathname = '/admin'
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Login failed')
        } finally {
          setLoading(false)
        }
      }}
    >
      {showLogo && (
        <button type="button" className="auth-logo auth-logo--admin mx-auto" onClick={onLogoTap} aria-hidden>
          <Shield className="h-7 w-7 text-white" />
        </button>
      )}
      <h2 className="auth-form-title">{t.authPage.adminWelcome}</h2>
      <p className="auth-form-subtitle">
        {isFirstSetup ? t.authPage.adminFirstSetup : t.authPage.adminSubtitle}
      </p>

      {isFirstSetup && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-xs text-emerald-400">
          {t.authPage.adminFirstSetupHint}
        </p>
      )}

      <label className="auth-field">
        <span className="auth-field__label">{t.authPage.adminEmail}</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="auth-input"
          autoComplete="username"
          required
        />
      </label>

      <label className="auth-field">
        <span className="auth-field__label">{t.authPage.adminPassword}</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          className="auth-input"
          autoComplete={isFirstSetup ? 'new-password' : 'current-password'}
          minLength={6}
          required
        />
      </label>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-theme-muted">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="rounded border-theme"
        />
        {t.authPage.adminRemember}
      </label>

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" disabled={loading} className="auth-primary-btn auth-primary-btn--solid">
        {loading ? '…' : isFirstSetup ? t.authPage.adminCreateAndSignIn : t.authPage.adminSignIn}
      </button>

      <p className="auth-footnote">{t.authPage.adminFootnote}</p>
    </form>
  )
}
