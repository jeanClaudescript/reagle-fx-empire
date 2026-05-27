import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { isAdminAuthenticated, loginAdminMock } from '@/admin/auth'
import { AdminThemeToggle } from '@/components/admin/AdminThemeToggle'
import { AdminLanguageSwitcher } from '@/components/admin/AdminLanguageSwitcher'

export function AdminLogin() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAdminAuthenticated()) {
      window.location.pathname = '/admin'
    }
  }, [])

  return (
    <div className="admin-shell relative flex min-h-[100svh] flex-col justify-center bg-theme-bg px-3 py-8 pt-[80px] sm:px-6 sm:pt-[90px]">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
        <AdminLanguageSwitcher compact />
        <AdminThemeToggle />
      </div>
      <div className="absolute inset-0">
        <div className="glow-orb -left-40 top-20 h-96 w-96 bg-empire-purple/20" />
        <div className="glow-orb -right-20 bottom-20 h-80 w-80 bg-empire-blue/15" />
      </div>

      <div className="relative mx-auto w-full max-w-md min-w-0 flex-col gap-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card-glow overflow-hidden rounded-3xl border-theme p-6 sm:p-8"
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-theme-muted">
            Admin Access
          </p>
          <h1 className="font-display text-2xl font-bold text-theme-primary sm:text-3xl">
            Reagle FX Empire CMS
          </h1>
          <p className="mt-2 text-sm text-theme-muted">
            Protected updates for premium content.
          </p>

          <form
            className="mt-6 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              setError(null)
              setLoading(true)
              try {
                const token = loginAdminMock(email, password)
                void token
                window.location.pathname = '/admin'
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Login failed')
              } finally {
                setLoading(false)
              }
            }}
          >
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-theme-primary">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border border-theme bg-theme-surface/80 px-4 text-sm text-theme-primary placeholder:text-theme-muted/70 focus:outline-none focus:ring-2 focus:ring-theme-accent/30"
                type="email"
                autoComplete="username"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-theme-primary">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border border-theme bg-theme-surface/80 px-4 text-sm text-theme-primary placeholder:text-theme-muted/70 focus:outline-none focus:ring-2 focus:ring-theme-accent/30"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            {error && <p className="text-sm text-rose-500">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="mt-2 h-12 rounded-xl bg-gradient-to-r from-empire-purple to-empire-blue text-white font-semibold shadow-glow hover:shadow-glow-blue disabled:opacity-60"
              type="submit"
            >
              {loading ? 'Signing in…' : t.footer.connect}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

