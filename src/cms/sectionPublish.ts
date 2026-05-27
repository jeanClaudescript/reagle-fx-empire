import type { CMSData } from './types'
import type { ContentSectionId } from './validation'
import { normalizeCmsData } from './storage'

/** Copy one section from draft into published snapshot (other sections unchanged). */
export function mergeSectionIntoPublished(
  published: CMSData,
  draft: CMSData,
  section: ContentSectionId,
): CMSData {
  const base = { ...published }

  switch (section) {
    case 'upcoming':
      base.upcomingBanners = draft.upcomingBanners
      break
    case 'about':
      base.about = draft.about
      break
    case 'certificates':
      base.certificates = draft.certificates
      break
    case 'proven':
      base.provenResults = draft.provenResults
      break
    case 'mastery':
      base.mastery = draft.mastery
      break
    case 'videos':
      base.teachingVideos = draft.teachingVideos
      break
    case 'texts':
      base.textOverridesByLang = draft.textOverridesByLang
      break
    case 'settings':
      base.settings = draft.settings
      break
    default:
      break
  }

  return normalizeCmsData(base)
}
