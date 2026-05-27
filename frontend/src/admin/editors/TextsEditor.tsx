import { useMemo, useState } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import { AdminTextArea, AdminTextInput, AdminSelect } from '@/components/admin/AdminInput'
import { useLanguage } from '@/context/LanguageContext'
import { useCms } from '@/cms/CmsProvider'
import type { Language } from '@/i18n'

const LANGUAGE_OPTIONS: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'rw', label: 'Kinyarwanda' },
  { code: 'fr', label: 'Français' },
  { code: 'sw', label: 'Kiswahili' },
]

export function TextsEditor() {
  const { language, t } = useLanguage()
  const { draft, updateDraft } = useCms()

  const [targetLang, setTargetLang] = useState<Language>(language)

  const overridesForLang = useMemo(() => {
    return draft.textOverridesByLang[targetLang] ?? {}
  }, [draft.textOverridesByLang, targetLang])

  const hero = overridesForLang.hero ?? {}
  const about = overridesForLang.about ?? {}
  const community = overridesForLang.community ?? {}
  const footer = overridesForLang.footer ?? {}

  return (
    <div className="flex flex-col gap-4">
      <AdminCard>
        <div className="admin-card-body">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="admin-editor-card-intro">Edit public text content (per language).</p>
            </div>

            <div className="w-full sm:w-56">
              <label className="mb-1 block text-sm font-semibold text-theme-primary">Language</label>
              <AdminSelect value={targetLang} onChange={(e) => setTargetLang(e.target.value as Language)} className="w-full">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </AdminSelect>
            </div>
          </div>
        </div>
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <div className="admin-card-body">
            <h3 className="font-display text-md font-bold text-theme-primary">Hero</h3>
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-theme-primary">Headline</label>
                <AdminTextArea
                  value={(hero as any).headline ?? t.hero.headline}
                  onChange={(e) => {
                    const value = e.target.value
                    updateDraft((prev) => ({
                      ...prev,
                      textOverridesByLang: {
                        ...prev.textOverridesByLang,
                        [targetLang]: {
                          ...(prev.textOverridesByLang[targetLang] ?? {}),
                          hero: {
                            ...((prev.textOverridesByLang[targetLang] ?? {}) as any).hero,
                            headline: value,
                          },
                        },
                      },
                    }))
                  }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-theme-primary">Subheadline</label>
                <AdminTextArea
                  value={(hero as any).subheadline ?? t.hero.subheadline}
                  onChange={(e) => {
                    const value = e.target.value
                    updateDraft((prev) => ({
                      ...prev,
                      textOverridesByLang: {
                        ...prev.textOverridesByLang,
                        [targetLang]: {
                          ...(prev.textOverridesByLang[targetLang] ?? {}),
                          hero: {
                            ...((prev.textOverridesByLang[targetLang] ?? {}) as any).hero,
                            subheadline: value,
                          },
                        },
                      },
                    }))
                  }}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-theme-primary">WhatsApp CTA</label>
                  <AdminTextInput
                    value={(hero as any).ctaWhatsapp ?? t.hero.ctaWhatsapp}
                    onChange={(e) => {
                      const value = e.target.value
                      updateDraft((prev) => ({
                        ...prev,
                        textOverridesByLang: {
                          ...prev.textOverridesByLang,
                          [targetLang]: {
                            ...(prev.textOverridesByLang[targetLang] ?? {}),
                            hero: {
                              ...((prev.textOverridesByLang[targetLang] ?? {}) as any).hero,
                              ctaWhatsapp: value,
                            },
                          },
                        },
                      }))
                    }}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-theme-primary">Results CTA</label>
                  <AdminTextInput
                    value={(hero as any).ctaResults ?? t.hero.ctaResults}
                    onChange={(e) => {
                      const value = e.target.value
                      updateDraft((prev) => ({
                        ...prev,
                        textOverridesByLang: {
                          ...prev.textOverridesByLang,
                          [targetLang]: {
                            ...(prev.textOverridesByLang[targetLang] ?? {}),
                            hero: {
                              ...((prev.textOverridesByLang[targetLang] ?? {}) as any).hero,
                              ctaResults: value,
                            },
                          },
                        },
                      }))
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="admin-card-body">
            <h3 className="font-display text-md font-bold text-theme-primary">About + Footer</h3>
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-theme-primary">Story</label>
                <AdminTextArea
                  value={(about as any).story ?? t.about.story}
                  onChange={(e) => {
                    const value = e.target.value
                    updateDraft((prev) => ({
                      ...prev,
                      textOverridesByLang: {
                        ...prev.textOverridesByLang,
                        [targetLang]: {
                          ...(prev.textOverridesByLang[targetLang] ?? {}),
                          about: {
                            ...((prev.textOverridesByLang[targetLang] ?? {}) as any).about,
                            story: value,
                          },
                        },
                      },
                    }))
                  }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-theme-primary">Mission</label>
                <AdminTextArea
                  value={(about as any).mission ?? t.about.mission}
                  onChange={(e) => {
                    const value = e.target.value
                    updateDraft((prev) => ({
                      ...prev,
                      textOverridesByLang: {
                        ...prev.textOverridesByLang,
                        [targetLang]: {
                          ...(prev.textOverridesByLang[targetLang] ?? {}),
                          about: {
                            ...((prev.textOverridesByLang[targetLang] ?? {}) as any).about,
                            mission: value,
                          },
                        },
                      },
                    }))
                  }}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-theme-primary">Community Title</label>
                  <AdminTextInput
                    value={(community as any).title ?? t.community.title}
                    onChange={(e) => {
                      const value = e.target.value
                      updateDraft((prev) => ({
                        ...prev,
                        textOverridesByLang: {
                          ...prev.textOverridesByLang,
                          [targetLang]: {
                            ...(prev.textOverridesByLang[targetLang] ?? {}),
                            community: {
                              ...((prev.textOverridesByLang[targetLang] ?? {}) as any).community,
                              title: value,
                            },
                          },
                        },
                      }))
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-theme-primary">Footer Tagline</label>
                  <AdminTextInput
                    value={(footer as any).tagline ?? t.footer.tagline}
                    onChange={(e) => {
                      const value = e.target.value
                      updateDraft((prev) => ({
                        ...prev,
                        textOverridesByLang: {
                          ...prev.textOverridesByLang,
                          [targetLang]: {
                            ...(prev.textOverridesByLang[targetLang] ?? {}),
                            footer: {
                              ...((prev.textOverridesByLang[targetLang] ?? {}) as any).footer,
                              tagline: value,
                            },
                          },
                        },
                      }))
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

