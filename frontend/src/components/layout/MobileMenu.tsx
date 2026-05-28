import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Home,
  User,
  TrendingUp,
  BookOpen,
  Play,
  Users,
  MessageCircle,
  ChevronRight,
  Calculator,
  Radio,
  LogIn,
} from 'lucide-react'
import { useEffect } from 'react'
import { BRAND, NAV_SECTIONS } from '@/constants/brand'
import { useLanguage } from '@/context/LanguageContext'
import { scrollToSection } from '@/hooks/useScrollSpy'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useStudentAccess } from '@/context/StudentAccessContext'

const NAV_ICONS: Record<string, typeof Home> = {
  home: Home,
  tools: Calculator,
  live: Radio,
  about: User,
  results: TrendingUp,
  lessons: BookOpen,
  videos: Play,
  community: Users,
  contact: MessageCircle,
}

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  activeId: string
}

const panelVariants = {
  closed: { x: '100%' },
  open: { x: 0 },
}

const itemVariants = {
  closed: { opacity: 0, x: 24 },
  open: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.05 + i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
}

export function MobileMenu({ open, onClose, activeId }: MobileMenuProps) {
  const { t } = useLanguage()
  const { isLoggedIn, membershipStatus } = useStudentAccess()

  const navLabels: Record<string, string> = {
    home: t.nav.home,
    tools: t.nav.tools,
    live: t.nav.live,
    about: t.nav.about,
    results: t.nav.results,
    lessons: t.nav.lessons,
    videos: t.nav.videos,
    community: t.nav.community,
    contact: t.nav.contact,
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleNav = (id: string) => {
    scrollToSection(id)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mobile-menu-backdrop fixed inset-0 z-[60] lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          />

          <motion.aside
            initial="closed"
            animate="open"
            exit="closed"
            variants={panelVariants}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="mobile-menu-panel fixed bottom-0 right-0 top-0 z-[70] flex w-[min(100%,340px)] flex-col lg:hidden"
          >
            <div className="mobile-menu-glow pointer-events-none absolute -left-20 top-1/4 h-64 w-64 rounded-full" />

            <div className="relative flex items-center justify-between border-b border-theme px-5 pb-4 pt-safe">
              <div>
                <p className="font-display text-lg font-bold text-gradient-brand">REAGLE FX</p>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-theme-accent">
                  Empire · 2030
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-theme bg-theme-elevated/80 text-theme-primary backdrop-blur-xl active:scale-95"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-5">
              <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-theme-muted">
                Navigation
              </p>
              <ul className="space-y-2">
                {NAV_SECTIONS.map(({ id, key }, i) => {
                  const Icon = NAV_ICONS[key] ?? Home
                  const isActive = activeId === id
                  return (
                    <motion.li
                      key={id}
                      custom={i}
                      variants={itemVariants}
                      initial="closed"
                      animate="open"
                    >
                      <button
                        type="button"
                        onClick={() => handleNav(id)}
                        className={`mobile-nav-item group flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition active:scale-[0.98] ${
                          isActive ? 'mobile-nav-item-active' : ''
                        }`}
                      >
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                            isActive
                              ? 'bg-theme-accent text-white shadow-glow-sm'
                              : 'bg-theme-elevated text-theme-accent'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="flex-1">
                          <span
                            className={`block font-display text-base font-semibold ${
                              isActive ? 'text-theme-accent' : 'text-theme-primary'
                            }`}
                          >
                            {navLabels[key]}
                          </span>
                          <span className="text-[11px] text-theme-muted">
                            {String(i + 1).padStart(2, '0')} — Reagle FX
                          </span>
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 transition group-active:translate-x-0.5 ${
                            isActive ? 'text-theme-accent' : 'text-theme-muted/50'
                          }`}
                        />
                      </button>
                    </motion.li>
                  )
                })}
              </ul>
            </nav>

            <div className="border-t border-theme p-4 pb-safe">
              <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-theme bg-theme-elevated/60 p-3 backdrop-blur-xl">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  window.history.pushState({}, '', '/login')
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
                className={`mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border py-3.5 text-sm font-semibold active:scale-[0.98] ${
                  isLoggedIn && membershipStatus === 'paid'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : isLoggedIn && membershipStatus === 'unpaid'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border-theme-accent/35 bg-theme-accent/10 text-theme-accent'
                }`}
              >
                <LogIn className="h-5 w-5" />
                {isLoggedIn
                  ? membershipStatus === 'paid'
                    ? t.studentLogin.paidBadge
                    : membershipStatus === 'unpaid'
                      ? t.studentLogin.unpaidBadge
                      : t.studentLogin.notFoundBadge
                  : t.nav.login}
              </button>
              <a
                href={BRAND.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 font-semibold text-white shadow-[0_0_28px_rgba(16,185,129,0.35)] active:scale-[0.98]"
              >
                <MessageCircle className="h-5 w-5" />
                {t.mobile.joinWhatsapp}
              </a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
