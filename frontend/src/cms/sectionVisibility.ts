import type { CMSData } from './types'
import { DEFAULT_CMS_DATA } from './defaultCms'

function sections(data: CMSData) {
  return data.settings?.sections ?? DEFAULT_CMS_DATA.settings.sections
}

export function isSectionEnabled(data: CMSData, id: keyof typeof DEFAULT_CMS_DATA.settings.sections) {
  return sections(data)[id] !== false
}
