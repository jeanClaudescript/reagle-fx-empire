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
    push(`${label} saved to draft.`, 'success')
  }, [draft, label, push, setValidationIssues])

  const handlePublish = useCallback(async () => {
    const ok = await confirm({
      title: `Publish ${label}?`,
      message: `Only this section will go live. Other sections stay as they are on the site.`,
      confirmLabel: 'Publish section',
    })
    if (!ok) return

    setBusy(true)
    push(`Validating ${label}…`, 'info')
    await new Promise((r) => window.setTimeout(r, 200))

    const result = publishSectionValidated(section)
    setBusy(false)

    if (!result.ok) {
      push('Cannot publish — fix the highlighted fields.', 'error')
      return
    }

    push(`${label} published to live site.`, 'success')
  }, [confirm, label, publishSectionValidated, push, section])

  return (
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
        Save
      </button>
      <button
        type="button"
        className="admin-btn admin-btn--primary admin-btn--sm"
        onClick={handlePublish}
        disabled={!isHydrated || busy}
      >
        <Upload className="h-4 w-4" />
        Publish
      </button>
    </div>
  )
}
