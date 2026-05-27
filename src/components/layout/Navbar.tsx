import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { BRAND, NAV_SECTIONS } from '@/constants/brand'
import { useLanguage } from '@/context/LanguageContext'
import { useScrollSpy, scrollToSection } from '@/hooks/useScrollSpy'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { MobileMenu } from '@/components/layout/MobileMenu'

export function Navbar() {
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const sectionIds = NAV_SECTIONS.map((s) => s.id)
  const activeId = useScrollSpy(sectionIds)
  const tapRef = useRef({ count: 0, lastAt: 0 })

  const navLabels: Record<string, string> = {
    home: t.nav.home,
    about: t.nav.about,
    results: t.nav.results,
    lessons: t.nav.lessons,
    videos: t.nav.videos,
    community: t.nav.community,
    contact: t.nav.contact,
  }

  const handleNav = (id: string) => {
    scrollToSection(id)
    setMenuOpen(false)
  }

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-0 right-0 top-0 z-50 border-b border-theme bg-theme-surface/90 pt-safe backdrop-blur-2xl"
      >
        <div className="section-container flex h-14 items-center justify-between sm:h-[72px]">
          <button
            type="button"
            onClick={() => {
              handleNav('home')
              if (!import.meta.env.DEV) return
              const now = Date.now()
              if (now - tapRef.current.lastAt > 900) tapRef.current.count = 1
              else tapRef.current.count += 1
              tapRef.current.lastAt = now
              if (tapRef.current.count >= 4) {
                window.location.pathname = '/admin-login'
              }
            }}
            className="group flex flex-col text-left"
          >
            <span className="font-display text-base font-bold leading-none tracking-tight text-gradient-brand sm:text-xl">
              REAGLE FX
            </span>
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-theme-accent/80 sm:text-xs">
              Empire · {BRAND.mentor}
            </span>
          </button>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_SECTIONS.map(({ id, key }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleNav(id)}
                className={`relative rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  activeId === id
                    ? 'text-theme-primary'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                {navLabels[key]}
                {activeId === id && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 -z-10 rounded-xl bg-theme-accent/15 shadow-glow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle compact />
            <LanguageSwitcher compact />
            <button
              type="button"
              className={`menu-trigger relative flex h-10 w-10 items-center justify-center rounded-xl border border-theme lg:hidden ${
                menuOpen ? 'bg-theme-accent text-white' : 'bg-theme-elevated/80 text-theme-primary'
              }`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} activeId={activeId} />
    </>
  )
}
