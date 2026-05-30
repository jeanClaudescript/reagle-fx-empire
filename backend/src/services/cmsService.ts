import { DEFAULT_CMS_DATA } from '../data/defaultCms.js'
import { CmsStateModel } from '../models/CmsState.js'
import type { CMSData } from '../types/cms.js'

const SINGLETON_KEY = 'singleton' as const

function normalizeCmsData(data: CMSData): CMSData {
  return {
    ...DEFAULT_CMS_DATA,
    ...data,
    version: 1,
    about: {
      ...DEFAULT_CMS_DATA.about,
      ...data.about,
      bio: data.about?.bio?.trim() || DEFAULT_CMS_DATA.about.bio,
    },
    provenResults: {
      media: [...(data.provenResults?.media ?? DEFAULT_CMS_DATA.provenResults.media)].sort(
        (a, b) => a.order - b.order,
      ),
    },
    mastery: { byKey: data.mastery?.byKey ?? {} },
    settings: {
      sections: {
        ...DEFAULT_CMS_DATA.settings.sections,
        ...(data.settings?.sections ?? {}),
      },
    },
    upcomingBanners: [...(data.upcomingBanners ?? [])].sort((a, b) => a.order - b.order),
    certificates: [...(data.certificates ?? [])].sort((a, b) => a.order - b.order),
    teachingVideos: [...(data.teachingVideos ?? [])].sort((a, b) => a.order - b.order),
    vipBooks: [...(data.vipBooks ?? [])].sort((a, b) => a.order - b.order),
  }
}

async function ensureState() {
  const existing = await CmsStateModel.findOne({ key: SINGLETON_KEY })
  if (existing) return existing

  const seeded = await CmsStateModel.create({
    key: SINGLETON_KEY,
    draft: DEFAULT_CMS_DATA,
    published: DEFAULT_CMS_DATA,
    updatedAt: new Date(),
  })
  return seeded
}

export async function getPublishedCms(): Promise<CMSData> {
  const state = await ensureState()
  return normalizeCmsData(state.published)
}

export async function getDraftCms(): Promise<CMSData> {
  const state = await ensureState()
  return normalizeCmsData(state.draft)
}

export async function saveDraftCms(data: CMSData): Promise<CMSData> {
  const normalized = normalizeCmsData(data)
  const state = await CmsStateModel.findOneAndUpdate(
    { key: SINGLETON_KEY },
    { draft: normalized, updatedAt: new Date() },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
  if (!state) {
    throw new Error('Failed to save draft CMS state')
  }
  return normalizeCmsData(state.draft)
}

export async function publishDraftCms(): Promise<CMSData> {
  const state = await ensureState()
  const published = normalizeCmsData(state.draft)
  const updated = await CmsStateModel.findOneAndUpdate(
    { key: SINGLETON_KEY },
    { published, updatedAt: new Date() },
    { new: true },
  )
  if (!updated) {
    throw new Error('Failed to publish CMS state')
  }
  return normalizeCmsData(updated.published)
}

export async function resetDraftFromPublished(): Promise<CMSData> {
  const state = await ensureState()
  const draft = normalizeCmsData(state.published)
  const updated = await CmsStateModel.findOneAndUpdate(
    { key: SINGLETON_KEY },
    { draft, updatedAt: new Date() },
    { new: true },
  )
  if (!updated) {
    throw new Error('Failed to reset draft CMS state')
  }
  return normalizeCmsData(updated.draft)
}
