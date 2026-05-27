import type { CMSData } from './types'
import type { ContentSectionId } from './validation'
import { CONTENT_SECTIONS, sectionHasDraftChanges, validateSection } from './validation'

export type SectionPublishStatus = 'draft' | 'published'

export interface SectionContentState {
  status: SectionPublishStatus
  isValid: boolean
  lastUpdated: number | null
  errors: ReturnType<typeof validateSection>
  hasChanges: boolean
}

export type SectionStateMap = Record<ContentSectionId, SectionContentState>

export function buildSectionStates(
  draft: CMSData,
  published: CMSData,
  lastUpdatedBySection: Partial<Record<ContentSectionId, number>>,
): SectionStateMap {
  const states = {} as SectionStateMap

  for (const section of CONTENT_SECTIONS) {
    const hasChanges = sectionHasDraftChanges(section, draft, published)
    const errors = validateSection(section, draft)
    states[section] = {
      status: hasChanges ? 'draft' : 'published',
      isValid: errors.length === 0,
      lastUpdated: lastUpdatedBySection[section] ?? null,
      errors,
      hasChanges,
    }
  }

  return states
}
