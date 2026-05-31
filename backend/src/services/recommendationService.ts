import { LiveSessionModel } from '../models/LiveSession.js'
import { getPublishedCms } from './cmsService.js'
import { listRecentViews } from './viewTrackingService.js'
import { getOrCreateInterests } from './engagementService.js'
import { AppUserModel } from '../models/AppUser.js'

const MASTERY_KEYS = ['risk', 'technical', 'psychology', 'structure', 'beginner', 'live'] as const

export async function getRecommendations(userId: string) {
  const [user, interests, views, liveSessions] = await Promise.all([
    AppUserModel.findById(userId).select('programType paidUntil').lean(),
    getOrCreateInterests(userId),
    listRecentViews(userId, 30),
    LiveSessionModel.find({ status: { $in: ['scheduled', 'live'] } })
      .sort({ scheduledAt: 1, createdAt: -1 })
      .limit(5)
      .lean(),
  ])

  const viewedLessonIds = new Set(
    views.filter((v) => v.contentType === 'lesson').map((v) => v.contentId),
  )

  let continueLesson: { id: string; title: string; reason: string } | null = null
  try {
    const cms = await getPublishedCms()
    for (const key of MASTERY_KEYS) {
      if (viewedLessonIds.has(key)) continue
      const media = cms.mastery?.byKey?.[key]
      continueLesson = {
        id: key,
        title: key.charAt(0).toUpperCase() + key.slice(1),
        reason: media ? 'Recommended next lesson' : 'Continue your learning path',
      }
      break
    }
  } catch {
    /* cms optional */
  }

  const upcomingLive = liveSessions.find((s) => s.status === 'scheduled' && s.scheduledAt)
  const liveNow = liveSessions.find((s) => s.status === 'live')

  const pairHint = interests.pairs[0] ?? 'EUR/USD'

  return {
    continueLearning: continueLesson,
    recommendedLesson: continueLesson,
    upcomingLiveSession: upcomingLive
      ? {
          id: String(upcomingLive._id),
          title: upcomingLive.title,
          scheduledAt: upcomingLive.scheduledAt?.toISOString(),
          pair: upcomingLive.pair,
        }
      : liveNow
        ? {
            id: String(liveNow._id),
            title: liveNow.title,
            scheduledAt: liveNow.startedAt?.toISOString(),
            pair: liveNow.pair,
            isLive: true,
          }
        : null,
    focusPair: pairHint,
    programType: user?.programType ?? null,
    incompleteQuiz: null,
    nextModule: continueLesson,
  }
}
