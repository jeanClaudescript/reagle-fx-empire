import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getTranslations, type Language, type Translations } from '@/i18n'
import { useCms } from '@/cms/CmsProvider'
import { deepMerge } from '@/cms/merge'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'reagle-fx-lang'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null
    if (stored && ['en', 'rw', 'fr', 'sw'].includes(stored)) return stored
    return 'en'
  })

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang === 'rw' ? 'rw' : lang
  }, [])

  useEffect(() => {
    document.documentElement.lang = language === 'rw' ? 'rw' : language
  }, [language])

  const cms = useCms()

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: deepMerge(
        getTranslations(language),
        cms.effectiveRenderSource === 'draft'
          ? cms.draft.textOverridesByLang[language]
          : cms.published.textOverridesByLang[language],
      ) as Translations,
    }),
    [cms.draft, cms.published, cms.effectiveRenderSource, language, setLanguage],
  )

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
