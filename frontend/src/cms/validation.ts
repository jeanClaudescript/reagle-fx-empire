import type { CMSData } from './types'
import type { AdminTab } from '@/admin/layout/adminNav'

export type ContentSectionId = Exclude<AdminTab, 'dashboard'>

export interface ValidationIssue {
  section: ContentSectionId
  field: string
  message: string
}

export interface PublishValidationResult {
  ok: boolean
  issues: ValidationIssue[]
}

function isNonEmpty(value: string | undefined) {
  return Boolean(value?.trim())
}

export function validateSection(section: ContentSectionId, data: CMSData): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (section === 'updates') {
    for (const update of data.dailyUpdates ?? []) {
      if (!update.enabled) continue
      if (update.type === 'text' && !isNonEmpty(update.caption)) {
        issues.push({
          section,
          field: `update:${update.id}.caption`,
          message: 'Text update needs a message',
        })
      }
      if ((update.type === 'image' || update.type === 'video') && !update.mediaDataUrl) {
        issues.push({
          section,
          field: `update:${update.id}.media`,
          message: `Update "${update.caption.slice(0, 24) || update.id}" needs media`,
        })
      }
    }
  }

  if (section === 'upcoming') {
    for (const banner of data.upcomingBanners) {
      if (!banner.enabled) continue
      if (!isNonEmpty(banner.title)) {
        issues.push({
          section,
          field: `banner:${banner.id}.title`,
          message: `Banner "${banner.id}" needs a title`,
        })
      }
      if (!isNonEmpty(banner.date)) {
        issues.push({
          section,
          field: `banner:${banner.id}.date`,
          message: `Banner "${banner.title || banner.id}" needs a date`,
        })
      }
      if (!isNonEmpty(banner.ctaLabel)) {
        issues.push({
          section,
          field: `banner:${banner.id}.ctaLabel`,
          message: `Banner "${banner.title || banner.id}" needs a CTA label`,
        })
      }
    }
  }

  if (section === 'about') {
    if (!isNonEmpty(data.about.title)) {
      issues.push({ section, field: 'about.title', message: 'Coach title is required' })
    }
    if (!isNonEmpty(data.about.bio)) {
      issues.push({ section, field: 'about.bio', message: 'Coach bio is required' })
    }
  }

  if (section === 'certificates') {
    for (const cert of data.certificates) {
      if (!cert.imageDataUrl) {
        issues.push({
          section,
          field: `certificate:${cert.id}.image`,
          message: `Certificate "${cert.title || cert.id}" needs an image`,
        })
      }
    }
  }

  if (section === 'proven') {
    for (const media of data.provenResults.media) {
      if (media.type === 'placeholder') continue
      if ((media.type === 'image' || media.type === 'video') && !media.mediaDataUrl) {
        issues.push({
          section,
          field: `proven:${media.id}.media`,
          message: `Proven result "${media.title || media.id}" needs uploaded media`,
        })
      }
    }
  }

  if (section === 'mastery') {
    for (const [key, media] of Object.entries(data.mastery.byKey)) {
      if (!media) continue
      if ((media.type === 'image' || media.type === 'video') && !media.mediaDataUrl) {
        issues.push({
          section,
          field: `mastery:${key}.media`,
          message: `Mastery card "${key}" has incomplete media`,
        })
      }
    }
  }

  if (section === 'videos') {
    for (const item of data.teachingVideos) {
      const hasVideo = Boolean(item.videoDataUrl)
      const hasPoster = Boolean(item.posterDataUrl)
      if ((hasVideo || hasPoster) && !isNonEmpty(item.label)) {
        issues.push({
          section,
          field: `video:${item.id}.label`,
          message: 'Teaching video needs a label when media is attached',
        })
      }
    }
  }

  return issues
}

export const CONTENT_SECTIONS: ContentSectionId[] = [
  'updates',
  'upcoming',
  'about',
  'certificates',
  'proven',
  'mastery',
  'videos',
  'texts',
  'settings',
]

export function validatePublish(data: CMSData): PublishValidationResult {
  const issues = CONTENT_SECTIONS.flatMap((section) => validateSection(section, data))
  return { ok: issues.length === 0, issues }
}

export function pickSectionData(section: ContentSectionId, data: CMSData): unknown {
  switch (section) {
    case 'updates':
      return data.dailyUpdates
    case 'upcoming':
      return data.upcomingBanners
    case 'about':
      return data.about
    case 'certificates':
      return data.certificates
    case 'proven':
      return data.provenResults
    case 'mastery':
      return data.mastery
    case 'videos':
      return data.teachingVideos
    case 'texts':
      return data.textOverridesByLang
    case 'settings':
      return data.settings
    default:
      return null
  }
}

export function sectionHasDraftChanges(
  section: ContentSectionId,
  draft: CMSData,
  published: CMSData,
) {
  return JSON.stringify(pickSectionData(section, draft)) !== JSON.stringify(pickSectionData(section, published))
}
