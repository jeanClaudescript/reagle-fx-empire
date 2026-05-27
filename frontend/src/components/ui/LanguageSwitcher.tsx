import { ChevronDown, Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { LANGUAGES } from '@/i18n'
import { useLanguage } from '@/context/LanguageContext'
import type { Language } from '@/i18n'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
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
        className={`flex items-center gap-1.5 rounded-xl border border-theme glass-card text-theme-muted transition-colors hover:border-theme-accent/40 hover:text-theme-primary ${
          compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'
        }`}
        aria-label="Change language"
      >
        <Globe className="h-4 w-4 text-theme-accent" />
        {!compact && <span>{currentLabel}</span>}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[140px] overflow-hidden rounded-xl border border-theme bg-theme-surface py-1 shadow-glass backdrop-blur-xl">
          {LANGUAGES.map(({ code, labelKey }) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setLanguage(code as Language)
                setOpen(false)
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-theme-accent/15 ${
                language === code ? 'text-theme-accent' : 'text-theme-muted'
              }`}
            >
              {t.languages[labelKey]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
