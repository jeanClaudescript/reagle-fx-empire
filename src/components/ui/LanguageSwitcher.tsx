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
        className={`flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 backdrop-blur-sm transition-colors hover:border-empire-purple/40 hover:text-white ${
          compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'
        }`}
        aria-label="Change language"
      >
        <Globe className="h-4 w-4 text-empire-purple-glow" />
        {!compact && <span>{currentLabel}</span>}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-empire-navy/95 py-1 shadow-glass backdrop-blur-xl">
          {LANGUAGES.map(({ code, labelKey }) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setLanguage(code as Language)
                setOpen(false)
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-empire-purple/20 ${
                language === code ? 'text-empire-purple-glow' : 'text-gray-300'
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
