export type MediaOrientation = 'vertical' | 'horizontal'
export type MediaType = 'image' | 'video' | 'placeholder'
export type MasteryCardKey = 'risk' | 'technical' | 'psychology' | 'structure' | 'beginner' | 'live'
export type Language = 'en' | 'fr' | 'rw' | 'sw'

export type DeepPartial<T> = T extends (...args: unknown[]) => unknown
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T

export type DailyUpdateType = 'text' | 'image' | 'video'

export interface DailyUpdate {
  id: string
  enabled: boolean
  type: DailyUpdateType
  caption: string
  mediaDataUrl?: string
  posterDataUrl?: string
  externalLink?: string
  createdAt: string
  order: number
}

export interface UpcomingBanner {
  id: string
  enabled: boolean
  title: string
  date: string
  imageDataUrl?: string
  ctaLabel: string
  ctaLink: string
  externalLink?: string
  order: number
}

export interface CoachProfile {
  coachImageDataUrl?: string
  coachBackgroundDataUrl?: string
  title: string
  bio: string
}

export interface Certificate {
  id: string
  imageDataUrl: string
  title?: string
  externalLink?: string
  order: number
}

export interface CMSMedia {
  id: string
  type: MediaType
  orientation: MediaOrientation
  title?: string
  mediaDataUrl?: string
  posterDataUrl?: string
  externalLink?: string
  order: number
}

export interface ProvenResultsContent {
  media: CMSMedia[]
}

export interface MasteryMediaContent {
  byKey: Partial<Record<MasteryCardKey, CMSMedia>>
}

export interface TeachingVideoItem {
  id: string
  reelKey: `reel${1 | 2 | 3 | 4 | 5 | 6}`
  label: string
  videoDataUrl?: string
  posterDataUrl?: string
  order: number
}

export interface CMSSectionVisibility {
  results: boolean
  videos: boolean
  community: boolean
  certificates: boolean
  lessons: boolean
  dailyUpdates: boolean
}

export interface CMSSettings {
  sections: CMSSectionVisibility
}

export interface CMSData {
  version: 1
  dailyUpdates: DailyUpdate[]
  upcomingBanners: UpcomingBanner[]
  about: CoachProfile
  certificates: Certificate[]
  provenResults: ProvenResultsContent
  mastery: MasteryMediaContent
  teachingVideos: TeachingVideoItem[]
  textOverridesByLang: Partial<Record<Language, DeepPartial<Record<string, unknown>>>>
  settings: CMSSettings
}
