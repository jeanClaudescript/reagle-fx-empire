import { Router } from 'express'
import { requireVipMembership } from '../middleware/requireVipMembership.js'
import {
  dismissNotification,
  getDashboardHighlights,
  getInterests,
  getPreferences,
  getUnreadCounts,
  getWhatsNew,
  listActivityFeed,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markWhatsNewSeen,
  updateInterests,
  updatePreferences,
} from '../services/engagementService.js'
import { trackContentView } from '../services/viewTrackingService.js'
import { getRecommendations } from '../services/recommendationService.js'
import { onStudentJoinedLiveSession } from '../services/liveReminderService.js'
import type { ContentType } from '../types/engagement.js'

export const engagementRoutes = Router()

engagementRoutes.use(requireVipMembership)

engagementRoutes.get('/notifications', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const data = await listNotifications(userId)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.get('/feed', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const data = await listActivityFeed(userId)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.get('/unread-counts', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const data = await getUnreadCounts(userId)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const data = await markNotificationRead(userId, req.params.id)
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.post('/notifications/read-all', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const data = await markAllNotificationsRead(userId)
    return res.json(data)
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.post('/notifications/:id/dismiss', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const data = await dismissNotification(userId, req.params.id)
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.post('/views', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const body = req.body as { contentType?: ContentType; contentId?: string; metadata?: Record<string, unknown> }
    if (!body.contentType || !body.contentId) {
      return res.status(400).json({ error: 'contentType and contentId are required' })
    }
    const data = await trackContentView({
      userId,
      contentType: body.contentType,
      contentId: body.contentId,
      metadata: body.metadata,
    })
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.get('/preferences', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const data = await getPreferences(userId)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.put('/preferences', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const body = req.body as Record<string, unknown>
    const data = await updatePreferences(userId, {
      pushEnabled: typeof body.pushEnabled === 'boolean' ? body.pushEnabled : undefined,
      popupEnabled: typeof body.popupEnabled === 'boolean' ? body.popupEnabled : undefined,
      emailEnabled: typeof body.emailEnabled === 'boolean' ? body.emailEnabled : undefined,
      mutedContentTypes: Array.isArray(body.mutedContentTypes)
        ? body.mutedContentTypes.map(String)
        : undefined,
    })
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.get('/interests', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const data = await getInterests(userId)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.put('/interests', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const body = req.body as Record<string, unknown>
    const data = await updateInterests(userId, {
      topics: Array.isArray(body.topics) ? body.topics.map(String) : undefined,
      pairs: Array.isArray(body.pairs) ? body.pairs.map(String) : undefined,
      tradingStyles: Array.isArray(body.tradingStyles) ? body.tradingStyles.map(String) : undefined,
      programFocus:
        body.programFocus === 'forex' || body.programFocus === 'crypto' || body.programFocus === 'both'
          ? body.programFocus
          : undefined,
    })
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.get('/highlights', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const data = await getDashboardHighlights(userId)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.get('/recommendations', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const data = await getRecommendations(userId)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.get('/whats-new', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const data = await getWhatsNew(userId)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.post('/whats-new/seen', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    const data = await markWhatsNewSeen(userId)
    return res.json(data)
  } catch (error) {
    return next(error)
  }
})

engagementRoutes.post('/live-session/:sessionId/joined', async (req, res, next) => {
  try {
    const userId = String(req.studentUser!._id)
    await onStudentJoinedLiveSession(userId, req.params.sessionId)
    await trackContentView({
      userId,
      contentType: 'live_session',
      contentId: req.params.sessionId,
    })
    return res.json({ ok: true })
  } catch (error) {
    return next(error)
  }
})
