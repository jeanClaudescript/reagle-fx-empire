import { useCallback, useState } from 'react'
import { Save, Upload } from 'lucide-react'
import { useCms } from '@/cms/CmsProvider'
import { useAdminToast } from '@/admin/toast'
import { useAdminConfirm } from '@/admin/confirm'
import type { ContentSectionId } from '@/cms/validation'
import { getAdminNavLabel } from '@/admin/layout/adminNav'
import { saveDraftCMS } from '@/cms/storage'

interface SectionEditorActionsProps {
  section: ContentSectionId
}

export function SectionEditorActions({ section }: SectionEditorActionsProps) {
  const { draft, isHydrated, publishSectionValidated, sectionStates, setValidationIssues } = useCms()
  const { push } = useAdminToast()
  const { confirm } = useAdminConfirm()
  const [busy, setBusy] = useState(false)

  const state = sectionStates[section]
  const label = getAdminNavLabel(section)

  const handleSave = useCallback(() => {
    saveDraftCMS(draft)
    setValidationIssues([])
    push(`${label} draft saved.`, 'success')
  }, [draft, label, push, setValidationIssues])

  const handlePublish = useCallback(async () => {
    const ok = await confirm({
      title: `Publish ${label}?`,
      message: 'This section goes live on the public site. Other sections stay unchanged.',
      confirmLabel: 'Publish section',
    })
    if (!ok) return

    setBusy(true)
    push(`Checking ${label}…`, 'info')
    await new Promise((r) => window.setTimeout(r, 200))

    const result = publishSectionValidated(section)
    setBusy(false)

    if (!result.ok) {
      push('Fix the highlighted fields before publishing.', 'error')
      return
    }

    push(`${label} is live — students see it now.`, 'success')
  }, [confirm, label, publishSectionValidated, push, section])

  return (
    <div className="admin-section-actions-wrap">
      <div className="admin-section-actions">
        {state?.status === 'draft' && (
          <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-400 sm:inline">
            Unpublished
          </span>
        )}
        <button
          type="button"
          className="admin-btn admin-btn--secondary admin-btn--sm"
          onClick={handleSave}
          disabled={!isHydrated || busy}
        >
          <Save className="h-4 w-4" />
          Save draft
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--primary admin-btn--sm"
          onClick={handlePublish}
          disabled={!isHydrated || busy}
        >
          <Upload className="h-4 w-4" />
          Publish section
        </button>
      </div>
      <p className="admin-section-actions-hint">
        Save draft keeps edits on this device. Publish section pushes only {label} to the live site.
      </p>
    </div>
  )
}
