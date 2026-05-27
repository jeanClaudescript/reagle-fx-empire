import type { Language, Translations } from './types'
import en from './locales/en.json'
import rw from './locales/rw.json'
import fr from './locales/fr.json'
import sw from './locales/sw.json'

export type { Language, Translations }

const translations: Record<Language, Translations> = {
  en: en as Translations,
  rw: rw as Translations,
  fr: fr as Translations,
  sw: sw as Translations,
}

export function getTranslations(lang: Language): Translations {
  return translations[lang] ?? translations.en
}

export const LANGUAGES: { code: Language; labelKey: keyof Translations['languages'] }[] = [
  { code: 'en', labelKey: 'en' },
  { code: 'rw', labelKey: 'rw' },
  { code: 'fr', labelKey: 'fr' },
  { code: 'sw', labelKey: 'sw' },
]
