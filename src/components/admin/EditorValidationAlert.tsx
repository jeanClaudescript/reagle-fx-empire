import { AlertCircle } from 'lucide-react'
import { useCms } from '@/cms/CmsProvider'
import { useCmsValidation } from '@/admin/CmsValidationContext'
import type { ContentSectionId } from '@/cms/validation'
import { SectionStateBadge } from '@/components/admin/SectionStateBadge'

export function EditorValidationAlert({ section }: { section: ContentSectionId }) {
  const { sectionStates } = useCms()
  const { issuesForSection } = useCmsValidation()
  const state = sectionStates[section]
  const issues = issuesForSection(section)

  if (!state) return null

  return (
    <div className="flex flex-col gap-3">
      <SectionStateBadge state={state} />
      {issues.length > 0 && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <p className="text-sm font-semibold text-rose-400">Missing required fields</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-theme-muted">
                {issues.map((issue) => (
                  <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
