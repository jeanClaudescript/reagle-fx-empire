import {
  AlertCircle,
  BadgeCheck,
  Clock,
  LogOut,
  Radio,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess, type StudentMembershipStatus } from '@/context/StudentAccessContext'
import { GlowButton } from '@/components/ui/GlowButton'

type View = 'form' | StudentMembershipStatus
export type StudentAuthMode = 'login' | 'signup'

export function StudentLoginPanel({
  mode,
  onSwitchMode,
  onDone,
  showLogo = true,
  onLogoTap,
}: {
  mode: StudentAuthMode
  onSwitchMode?: (mode: StudentAuthMode) => void
  onDone?: () => void
  showLogo?: boolean
  /** Hidden admin: tap logo 5× (no visible label). */
  onLogoTap?: () => void
}) {
  const { t } = useLanguage()
  const { checkAccess, loading, isLoggedIn, membershipStatus, contact, referralCode, logout } =
    useStudentAccess()
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [referrerCode, setReferrerCode] = useState(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase()
    return ref || ''
  })
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('form')

  useEffect(() => {
    if (isLoggedIn) setView(membershipStatus)
    else setView('form')
    setPhone(contact?.phone ?? '')
    setEmail(contact?.email ?? '')
  }, [isLoggedIn, membershipStatus, contact])

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!phone.trim() && !email.trim()) {
      setError(t.studentLogin.needContact)
      return
    }
    setError(null)

    if (mode === 'signup') {
      onDone?.()
      const params = new URLSearchParams()
      if (phone.trim()) params.set('phone', phone.trim())
      if (email.trim()) params.set('email', email.trim())
      if (referrerCode.trim()) params.set('ref', referrerCode.trim().toUpperCase())
      const qs = params.toString()
      window.history.pushState({}, '', `/pay${qs ? `?${qs}` : ''}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    }

    const status = await checkAccess({
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    })
    if (status === 'none') {
      setError(t.studentLogin.error)
      setView('form')
      return
    }
    setView(status)
  }

  const handleLogout = () => {
    logout()
    setView('form')
    setPhone('')
    setEmail('')
  }

  const goPay = () => {
    onDone?.()
    const params = new URLSearchParams()
    if (phone.trim()) params.set('phone', phone.trim())
    if (email.trim()) params.set('email', email.trim())
    const qs = params.toString()
    window.history.pushState({}, '', `/pay${qs ? `?${qs}` : ''}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const goHomeSection = (id: string) => {
    onDone?.()
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 300)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (view !== 'form') {
    return (
      <div className="auth-form-stack">
        {view === 'paid' && (
          <ResultView
            icon={<BadgeCheck className="h-12 w-12 text-emerald-500" />}
            badge={t.studentLogin.paidBadge}
            badgeClass="student-status-badge student-status-badge--paid"
            title={t.studentLogin.paidTitle}
            body={t.studentLogin.paidBody}
            contact={contact}
            contactLabel={t.studentLogin.signedInAs}
          >
            {referralCode ? <ReferralShare code={referralCode} /> : null}
            <GlowButton
              variant="primary"
              external={false}
              className="auth-primary-btn"
              onClick={() => {
                window.history.pushState({}, '', '/desk')
                window.dispatchEvent(new PopStateEvent('popstate'))
                onDone?.()
              }}
            >
              <Radio className="h-4 w-4" />
              {t.vip.openDesk}
            </GlowButton>
            <GlowButton variant="secondary" external={false} className="auth-secondary-btn" onClick={() => goHomeSection('home')}>
              {t.vip.backToSite}
            </GlowButton>
          </ResultView>
        )}
        {view === 'unpaid' && (
          <ResultView
            icon={<Clock className="h-12 w-12 text-amber-500" />}
            badge={t.studentLogin.unpaidBadge}
            badgeClass="student-status-badge student-status-badge--unpaid"
            title={t.studentLogin.unpaidTitle}
            body={t.studentLogin.unpaidBody}
            contact={contact}
            contactLabel={t.studentLogin.signedInAs}
          >
            <button type="button" className="auth-primary-btn auth-primary-btn--solid" onClick={goPay}>
              {t.studentLogin.payCta}
            </button>
            <GlowButton variant="secondary" external={false} className="auth-secondary-btn" onClick={() => goHomeSection('tools')}>
              {t.studentLogin.previewTools}
            </GlowButton>
          </ResultView>
        )}
        {view === 'not_found' && (
          <ResultView
            icon={<AlertCircle className="h-12 w-12 text-rose-500" />}
            badge={t.studentLogin.notFoundBadge}
            badgeClass="student-status-badge student-status-badge--missing"
            title={t.studentLogin.notFoundTitle}
            body={t.studentLogin.notFoundBody}
            contact={contact}
            contactLabel={t.studentLogin.signedInAs}
          >
            <button type="button" className="auth-primary-btn auth-primary-btn--solid" onClick={goPay}>
              <Sparkles className="h-4 w-4" />
              {t.studentLogin.registerCta}
            </button>
            <button type="button" className="auth-text-link" onClick={() => setView('form')}>
              {t.studentLogin.tryAgain}
            </button>
          </ResultView>
        )}
        <button type="button" onClick={handleLogout} className="auth-logout-btn">
          <LogOut className="h-4 w-4" />
          {t.studentLogin.logout}
        </button>
      </div>
    )
  }

  const isLogin = mode === 'login'

  return (
    <form className="auth-form-stack" onSubmit={submit}>
      {showLogo && (
        <button
          type="button"
          className="auth-logo mx-auto"
          onClick={onLogoTap}
          aria-label={t.authPage.brandMark}
        >
          <span className="auth-logo__mark">RFX</span>
        </button>
      )}
      <h2 className="auth-form-title">
        {isLogin ? t.authPage.loginWelcome : t.authPage.signupWelcome}
      </h2>
      <p className="auth-form-subtitle">
        {isLogin ? t.authPage.loginSubtitle : t.authPage.signupSubtitle}
      </p>

      <label className="auth-field">
        <span className="auth-field__label">{t.studentLogin.phone}</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+250 7XX XXX XXX"
          className="auth-input"
          autoComplete="tel"
        />
      </label>

      <div className="auth-divider">
        <span>{t.authPage.or}</span>
      </div>

      <label className="auth-field">
        <span className="auth-field__label">{t.studentLogin.email}</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="auth-input"
          autoComplete="email"
        />
      </label>

      {!isLogin && (
        <label className="auth-field">
          <span className="auth-field__label">{t.pay.referralLabel}</span>
          <input
            value={referrerCode}
            onChange={(e) => setReferrerCode(e.target.value.toUpperCase())}
            placeholder="REF-XXXX"
            className="auth-input"
          />
        </label>
      )}

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" disabled={loading} className="auth-primary-btn auth-primary-btn--solid">
        {loading ? '…' : isLogin ? t.authPage.signIn : t.authPage.createAccount}
      </button>

      <p className="auth-switch-line">
        {isLogin ? (
          <>
            {t.authPage.noAccount}{' '}
            <button type="button" className="auth-switch-link" onClick={() => onSwitchMode?.('signup')}>
              {t.authPage.createAccountLink}
            </button>
          </>
        ) : (
          <>
            {t.authPage.alreadyHaveAccount}{' '}
            <button type="button" className="auth-switch-link" onClick={() => onSwitchMode?.('login')}>
              {t.authPage.signInLink}
            </button>
          </>
        )}
      </p>

      <p className="auth-footnote">{t.authPage.studentFootnote}</p>
    </form>
  )
}

function ReferralShare({ code }: { code: string }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/pay?ref=${encodeURIComponent(code)}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="w-full rounded-xl border border-theme bg-theme-surface/50 px-4 py-3 text-left text-sm">
      <p className="font-semibold text-theme-primary">{t.studentLogin.referralTitle}</p>
      <p className="mt-1 font-mono text-lg font-bold text-theme-accent">{code}</p>
      <button type="button" className="mt-2 text-xs font-semibold text-theme-accent underline" onClick={() => void copy()}>
        {copied ? t.studentLogin.copied : t.studentLogin.copyLink}
      </button>
      <p className="mt-2 text-xs text-theme-muted">{t.studentLogin.referralHint}</p>
    </div>
  )
}

function ResultView({
  icon,
  badge,
  badgeClass,
  title,
  body,
  contact,
  contactLabel,
  children,
}: {
  icon: ReactNode
  badge: string
  badgeClass: string
  title: string
  body: string
  contact: { phone?: string; email?: string; name?: string } | null
  contactLabel: string
  children: ReactNode
}) {
  const display = contact?.name?.trim() || contact?.phone || contact?.email || ''
  return (
    <>
      <div className="auth-result-icon">{icon}</div>
      <span className={`${badgeClass} mx-auto`}>{badge}</span>
      <h2 className="auth-form-title mt-3">{title}</h2>
      <p className="auth-form-subtitle">{body}</p>
      {display ? (
        <p className="text-center text-xs text-theme-muted">
          {contactLabel}: <strong className="text-theme-primary">{display}</strong>
        </p>
      ) : null}
      <div className="mt-4 flex w-full flex-col gap-2">{children}</div>
    </>
  )
}
