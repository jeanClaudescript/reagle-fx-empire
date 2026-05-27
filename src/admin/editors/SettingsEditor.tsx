import { useCms } from '@/cms/CmsProvider'
import { useAdminConfirm } from '@/admin/confirm'
import type { CMSSectionId } from '@/cms/types'
import { AdminCard } from '@/components/admin/AdminCard'
import { useAdminToast } from '@/admin/toast'
import { loadDraftCMS, loadPublishedCMS, saveDraftCMS, savePublishedCMS } from '@/cms/storage'
import { DEFAULT_CMS_DATA } from '@/cms/defaultCms'
import { normalizeCmsData } from '@/cms/storage'

const SECTION_LABELS: Record<CMSSectionId, string> = {
  results: 'Proven Results',
  videos: 'Teaching Videos',
  community: 'Community',
  certificates: 'Certificates (carousel in About)',
  lessons: 'What They Master (Lessons)',
}

export function SettingsEditor() {
  const { draft, updateDraft, published } = useCms()
  const { push } = useAdminToast()
  const { confirm } = useAdminConfirm()
  const sections = draft.settings.sections ?? DEFAULT_CMS_DATA.settings.sections

  const toggle = (id: CMSSectionId, enabled: boolean) => {
    updateDraft((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        sections: {
          ...prev.settings.sections,
          [id]: enabled,
        },
      },
    }))
    push(`${SECTION_LABELS[id]} ${enabled ? 'visible' : 'hidden'} (draft)`, 'info')
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminCard>
        <div className="admin-card-body">
          <p className="admin-editor-card-intro">
            Control section visibility. Empty content still auto-hides (e.g. no certificates).
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {(Object.keys(SECTION_LABELS) as CMSSectionId[]).map((id) => (
              <li
                key={id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-theme bg-theme-surface/60 px-4 py-3"
              >
                <span className="text-sm font-semibold text-theme-primary">{SECTION_LABELS[id]}</span>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-theme-muted">
                  <input
                    type="checkbox"
                    checked={sections[id] !== false}
                    onChange={(e) => toggle(id, e.target.checked)}
                  />
                  Show on site
                </label>
              </li>
            ))}
          </ul>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-md font-bold text-theme-primary">Storage (frontend)</h3>
          <p className="mt-2 text-sm text-theme-muted">
            Content is saved in this browser via localStorage until the Node + MongoDB backend is connected.
          </p>
          <p className="mt-3 rounded-xl border border-theme bg-theme-elevated/50 px-3 py-2 font-mono text-xs text-theme-muted">
            MONGODB_URI=
          </p>
          <p className="mt-2 text-xs text-theme-muted">
            Published snapshot: {published.upcomingBanners.length} banners ·{' '}
            {published.certificates.length} certificates
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Reset all CMS data?',
                  message:
                    'All published and draft content in this browser will be erased. This cannot be undone.',
                  confirmLabel: 'Reset everything',
                  variant: 'danger',
                })
                if (!ok) return
                const fresh = normalizeCmsData(DEFAULT_CMS_DATA)
                savePublishedCMS(fresh)
                saveDraftCMS(fresh)
                window.location.reload()
              }}
            >
              Reset all CMS data
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={() => {
                const d = loadDraftCMS()
                const p = loadPublishedCMS()
                push(
                  `Draft banners: ${d.upcomingBanners.length} · Published: ${p.upcomingBanners.length}`,
                  'info',
                )
              }}
            >
              Check storage
            </button>
          </div>
        </div>
      </AdminCard>
    </div>
  )
}
