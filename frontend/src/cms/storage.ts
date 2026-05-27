import type { CMSData } from './types'
import { DEFAULT_CMS_DATA } from './defaultCms'

const STORAGE_PUBLISHED_KEY = 'reagle-fx-cms-published-v1'
const STORAGE_DRAFT_KEY = 'reagle-fx-cms-draft-v1'
const STORAGE_HISTORY_KEY = 'reagle-fx-cms-history-v1'

function safeParse<T>(value: string | null): T | undefined {
  if (!value) return undefined
  try {
    return JSON.parse(value) as T
  } catch {
    return undefined
  }
}

export function loadPublishedCMS(): CMSData {
  return safeParse<CMSData>(localStorage.getItem(STORAGE_PUBLISHED_KEY)) ?? DEFAULT_CMS_DATA
}

export function loadDraftCMS(): CMSData {
  return safeParse<CMSData>(localStorage.getItem(STORAGE_DRAFT_KEY)) ?? loadPublishedCMS()
}

export type CMSHistoryEntry = {
  id: string
  at: number
  data: CMSData
}

export function loadHistory(): CMSHistoryEntry[] {
  return safeParse<CMSHistoryEntry[]>(localStorage.getItem(STORAGE_HISTORY_KEY)) ?? []
}

export function savePublishedCMS(data: CMSData) {
  const payload = JSON.stringify(data)
  if (payload.length > 4_500_000) {
    throw new CmsStorageError(
      'Published content is too large for browser storage. Use a smaller image.',
    )
  }
  try {
    localStorage.setItem(STORAGE_PUBLISHED_KEY, payload)
  } catch {
    throw new CmsStorageError('Could not save published content. Use a smaller image.')
  }
}

export class CmsStorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CmsStorageError'
  }
}

export function saveDraftCMS(data: CMSData) {
  const payload = JSON.stringify(data)
  if (payload.length > 4_500_000) {
    throw new CmsStorageError(
      'Draft is too large for browser storage. Use a smaller image (under ~2MB).',
    )
  }
  try {
    localStorage.setItem(STORAGE_DRAFT_KEY, payload)
  } catch {
    throw new CmsStorageError('Could not save draft. Clear space or use a smaller image.')
  }
}

export function saveHistory(entries: CMSHistoryEntry[]) {
  localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(entries))
}

export function normalizeCmsData(data: CMSData): CMSData {
  return ensureMediaOrders({
    ...DEFAULT_CMS_DATA,
    ...data,
    about: { ...DEFAULT_CMS_DATA.about, ...data.about },
    provenResults: {
      media: data.provenResults?.media ?? DEFAULT_CMS_DATA.provenResults.media,
    },
    mastery: { byKey: data.mastery?.byKey ?? {} },
    settings: {
      sections: {
        ...DEFAULT_CMS_DATA.settings.sections,
        ...(data.settings?.sections ?? {}),
      },
    },
  })
}

export function ensureMediaOrders(data: CMSData): CMSData {
  return {
    ...data,
    dailyUpdates: [...(data.dailyUpdates ?? [])].sort((a, b) => {
      const ta = Date.parse(a.createdAt) || 0
      const tb = Date.parse(b.createdAt) || 0
      if (tb !== ta) return tb - ta
      return a.order - b.order
    }),
    upcomingBanners: [...data.upcomingBanners].sort((a, b) => a.order - b.order),
    certificates: [...data.certificates].sort((a, b) => a.order - b.order),
    provenResults: {
      ...data.provenResults,
      media: [...data.provenResults.media].sort((a, b) => a.order - b.order),
    },
    teachingVideos: [...data.teachingVideos].sort((a, b) => a.order - b.order),
  }
}

