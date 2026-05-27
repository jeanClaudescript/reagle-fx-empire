import type { CMSData } from '../types/cms.js'

export const DEFAULT_CMS_DATA: CMSData = {
  version: 1,
  dailyUpdates: [],
  upcomingBanners: [],
  about: {
    coachImageDataUrl: undefined,
    coachBackgroundDataUrl: undefined,
    title: 'CoachPeter',
    bio: '',
  },
  certificates: [],
  provenResults: {
    media: [
      {
        id: 'placeholder-proven-results-1',
        type: 'placeholder',
        orientation: 'horizontal',
        title: 'MT5 profits',
        order: 1,
      },
    ],
  },
  mastery: {
    byKey: {},
  },
  teachingVideos: [
    { id: 'tv-1', reelKey: 'reel1', label: 'Reel 1', order: 1 },
    { id: 'tv-2', reelKey: 'reel2', label: 'Reel 2', order: 2 },
    { id: 'tv-3', reelKey: 'reel3', label: 'Reel 3', order: 3 },
    { id: 'tv-4', reelKey: 'reel4', label: 'Reel 4', order: 4 },
    { id: 'tv-5', reelKey: 'reel5', label: 'Reel 5', order: 5 },
    { id: 'tv-6', reelKey: 'reel6', label: 'Reel 6', order: 6 },
  ],
  textOverridesByLang: {},
  settings: {
    sections: {
      results: true,
      videos: true,
      community: true,
      certificates: true,
      lessons: true,
      dailyUpdates: true,
    },
  },
}
