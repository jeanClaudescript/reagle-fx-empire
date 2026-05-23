import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { BRAND, NAV_SECTIONS } from '@/constants/brand'
import { useLanguage } from '@/context/LanguageContext'
import { useScrollSpy, scrollToSection } from '@/hooks/useScrollSpy'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export function Navbar() {
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const sectionIds = NAV_SECTIONS.map((s) => s.id)
  const activeId = useScrollSpy(sectionIds)

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
        className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-empire-black/70 backdrop-blur-xl"
      >
        <div className="section-container flex h-16 items-center justify-between sm:h-[72px]">
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="group flex flex-col text-left"
          >
            <span className="font-display text-lg font-bold leading-none tracking-tight text-gradient-brand sm:text-xl">
              REAGLE FX
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-empire-purple-glow/80 sm:text-xs">
              Empire · {BRAND.mentor}
            </span>
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_SECTIONS.map(({ id, key }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleNav(id)}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeId === id
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {navLabels[key]}
                {activeId === id && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 -z-10 rounded-lg bg-empire-purple/20 shadow-glow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher compact />
            <button
              type="button"
              className="rounded-lg p-2 text-gray-300 hover:bg-white/5 lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-white/10 bg-empire-navy/95 backdrop-blur-xl lg:hidden"
          >
            <nav className="section-container flex flex-col gap-1 py-4">
              {NAV_SECTIONS.map(({ id, key }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleNav(id)}
                  className={`rounded-xl px-4 py-3.5 text-left text-base font-medium ${
                    activeId === id
                      ? 'bg-empire-purple/20 text-empire-purple-glow'
                      : 'text-gray-300'
                  }`}
                >
                  {navLabels[key]}
                </button>
              ))}
              <div className="mt-2 border-t border-white/10 pt-3">
                <LanguageSwitcher />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
