import { Router } from 'express'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import { requireStudentAuth } from '../middleware/requireStudentAuth.js'
import {
  createLiveSession,
  getActiveLiveSession,
  listLiveSessions,
  setLiveSessionStatus,
  updateLiveSession,
} from '../services/liveSessionService.js'

export const liveRoutes = Router()

liveRoutes.get('/active', requireStudentAuth, async (_req, res, next) => {
  try {
    const data = await getActiveLiveSession()
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

liveRoutes.get('/admin/list', requireAdminAuth, async (_req, res, next) => {
  try {
    const data = await listLiveSessions()
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

liveRoutes.post('/admin/create', requireAdminAuth, async (req, res, next) => {
  try {
    const body = req.body as Record<string, string | undefined>
    const data = await createLiveSession({
      title: body.title ?? '',
      description: body.description,
      streamUrl: body.streamUrl,
      meetingUrl: body.meetingUrl,
      pair: body.pair,
      scheduledAt: body.scheduledAt,
    })
    return res.status(201).json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

liveRoutes.patch('/admin/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>
    const data = await updateLiveSession(req.params.id, {
      title: typeof body.title === 'string' ? body.title : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      streamUrl: typeof body.streamUrl === 'string' ? body.streamUrl : undefined,
      meetingUrl: typeof body.meetingUrl === 'string' ? body.meetingUrl : undefined,
      pair: typeof body.pair === 'string' ? body.pair : undefined,
      coachNote: typeof body.coachNote === 'string' ? body.coachNote : undefined,
      signalSide:
        body.signalSide === 'buy' || body.signalSide === 'sell' || body.signalSide === 'neutral'
          ? body.signalSide
          : undefined,
      signalEntry: body.signalEntry != null ? Number(body.signalEntry) : undefined,
      signalStop: body.signalStop != null ? Number(body.signalStop) : undefined,
      signalTarget: body.signalTarget != null ? Number(body.signalTarget) : undefined,
      scheduledAt: typeof body.scheduledAt === 'string' ? body.scheduledAt : undefined,
    })
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

liveRoutes.post('/admin/:id/status', requireAdminAuth, async (req, res, next) => {
  try {
    const status = (req.body as { status?: string }).status
    if (status !== 'scheduled' && status !== 'live' && status !== 'ended') {
      return res.status(400).json({ error: 'status must be scheduled, live, or ended' })
    }
    const data = await setLiveSessionStatus(req.params.id, status)
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})
