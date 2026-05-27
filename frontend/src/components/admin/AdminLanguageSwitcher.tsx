import { ChevronDown, Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LANGUAGES } from '@/i18n'
import { useLanguage } from '@/context/LanguageContext'
import type { Language } from '@/i18n'

export function AdminLanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentLabel = t.languages[language === 'rw' ? 'rw' : language]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`admin-lang-trigger ${compact ? 'admin-lang-trigger--compact' : ''}`}
        aria-label="Change language"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4 shrink-0 text-theme-accent" />
        {!compact && <span className="max-w-[72px] truncate">{currentLabel}</span>}
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="admin-lang-dropdown"
          >
            {LANGUAGES.map(({ code, labelKey }) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLanguage(code as Language)
                  setOpen(false)
                }}
                className={`admin-lang-option ${language === code ? 'admin-lang-option--active' : ''}`}
              >
                {t.languages[labelKey]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
