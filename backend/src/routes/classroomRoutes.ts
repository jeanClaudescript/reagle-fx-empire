import { Router } from 'express'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import { requireVipMembership } from '../middleware/requireVipMembership.js'
import {
  createClassroomRoom,
  getActiveClassroomRoom,
  getClassroomRoom,
  getRecordingEvents,
  getRoomChartState,
  listClassroomRooms,
  listRecentChatMessages,
  listRoomAttendance,
  listRoomRecordings,
  setClassroomRoomStatus,
  updateClassroomRoom,
} from '../services/classroomService.js'

export const classroomRoutes = Router()

classroomRoutes.get('/active', requireVipMembership, async (_req, res, next) => {
  try {
    const data = await getActiveClassroomRoom()
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

classroomRoutes.get('/rooms/:id', requireVipMembership, async (req, res, next) => {
  try {
    const data = await getClassroomRoom(req.params.id)
    if (data.status !== 'live') {
      return res.status(403).json({ error: 'Classroom is not live' })
    }
    const chartState = await getRoomChartState(req.params.id)
    const chat = await listRecentChatMessages(req.params.id)
    return res.json({ data: { room: data, chartState, chat } })
  } catch (error) {
    return next(error)
  }
})

classroomRoutes.get('/admin/list', requireAdminAuth, async (req, res, next) => {
  try {
    const teacherId = req.adminUser ? String(req.adminUser._id) : undefined
    const data = await listClassroomRooms(teacherId)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

classroomRoutes.post('/admin/create', requireAdminAuth, async (req, res, next) => {
  try {
    const body = req.body as Record<string, string | boolean | undefined>
    const data = await createClassroomRoom({
      teacherId: String(req.adminUser!._id),
      title: String(body.title ?? ''),
      description: typeof body.description === 'string' ? body.description : undefined,
      symbol: typeof body.symbol === 'string' ? body.symbol : undefined,
      timeframe: typeof body.timeframe === 'string' ? body.timeframe : undefined,
      enableLiveTeaching: body.enableLiveTeaching === true,
      jitsiRoomName: typeof body.jitsiRoomName === 'string' ? body.jitsiRoomName : undefined,
      teachingSessionTitle:
        typeof body.teachingSessionTitle === 'string' ? body.teachingSessionTitle : undefined,
      teachingScheduledAt:
        typeof body.teachingScheduledAt === 'string' ? body.teachingScheduledAt : undefined,
      jitsiMode: body.jitsiMode === 'screenshare' ? 'screenshare' : 'webcam',
    })
    return res.status(201).json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

classroomRoutes.patch('/admin/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const body = req.body as Record<string, string | boolean | undefined>
    const data = await updateClassroomRoom(req.params.id, {
      title: typeof body.title === 'string' ? body.title : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      symbol: typeof body.symbol === 'string' ? body.symbol : undefined,
      timeframe: typeof body.timeframe === 'string' ? body.timeframe : undefined,
      enableLiveTeaching:
        typeof body.enableLiveTeaching === 'boolean' ? body.enableLiveTeaching : undefined,
      jitsiRoomName: typeof body.jitsiRoomName === 'string' ? body.jitsiRoomName : undefined,
      teachingSessionTitle:
        typeof body.teachingSessionTitle === 'string' ? body.teachingSessionTitle : undefined,
      teachingScheduledAt:
        typeof body.teachingScheduledAt === 'string' ? body.teachingScheduledAt : undefined,
      jitsiMode:
        body.jitsiMode === 'screenshare' || body.jitsiMode === 'webcam'
          ? body.jitsiMode
          : undefined,
    })
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

classroomRoutes.post('/admin/:id/start', requireAdminAuth, async (req, res, next) => {
  try {
    const data = await setClassroomRoomStatus(req.params.id, 'live')
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

classroomRoutes.post('/admin/:id/end', requireAdminAuth, async (req, res, next) => {
  try {
    const data = await setClassroomRoomStatus(req.params.id, 'ended')
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

classroomRoutes.get('/admin/:id/attendance', requireAdminAuth, async (req, res, next) => {
  try {
    const data = await listRoomAttendance(req.params.id)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

classroomRoutes.get('/admin/:id/recordings', requireAdminAuth, async (req, res, next) => {
  try {
    const data = await listRoomRecordings(req.params.id)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

classroomRoutes.get('/admin/recordings/:recordingId/replay', requireAdminAuth, async (req, res, next) => {
  try {
    const data = await getRecordingEvents(req.params.recordingId)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

classroomRoutes.get('/admin/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const room = await getClassroomRoom(req.params.id)
    const chartState = await getRoomChartState(req.params.id)
    const chat = await listRecentChatMessages(req.params.id)
    return res.json({ data: { room, chartState, chat } })
  } catch (error) {
    return next(error)
  }
})
