import { Router } from 'express'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import { requireStudentAuth } from '../middleware/requireStudentAuth.js'
import {
  listCommunityMessages,
  listDirectThread,
  listDirectThreadsForAdmin,
  saveDeskChatMessage,
} from '../services/deskChatService.js'
import { emitToDirectThread, emitToAdmins, emitToVip } from '../socket/io.js'

export const deskChatRoutes = Router()

deskChatRoutes.get('/community', requireStudentAuth, async (_req, res, next) => {
  try {
    const data = await listCommunityMessages()
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.post('/community', requireStudentAuth, async (req, res, next) => {
  try {
    const body = req.body as { message?: string }
    const user = req.studentUser!
    const msg = await saveDeskChatMessage({
      channel: 'vip-community',
      fromUserId: String(user._id),
      fromUserName: user.name || user.phone || user.email || 'Student',
      fromRole: 'student',
      message: body.message ?? '',
    })
    emitToVip('desk:community:message', msg)
    emitToAdmins('desk:community:message', msg)
    return res.status(201).json({ ok: true, data: msg })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.get('/direct', requireStudentAuth, async (req, res, next) => {
  try {
    const studentId = String(req.studentUser!._id)
    const data = await listDirectThread(studentId)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.post('/direct', requireStudentAuth, async (req, res, next) => {
  try {
    const body = req.body as { message?: string }
    const user = req.studentUser!
    const studentId = String(user._id)
    const msg = await saveDeskChatMessage({
      channel: 'direct',
      fromUserId: studentId,
      fromUserName: user.name || user.phone || user.email || 'Student',
      fromRole: 'student',
      toUserId: 'admin',
      message: body.message ?? '',
    })
    emitToDirectThread(studentId, 'desk:direct:message', msg)
    emitToAdmins('desk:direct:message', msg)
    return res.status(201).json({ ok: true, data: msg })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.get('/admin/community', requireAdminAuth, async (_req, res, next) => {
  try {
    const data = await listCommunityMessages()
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.post('/admin/community', requireAdminAuth, async (req, res, next) => {
  try {
    const body = req.body as { message?: string }
    const user = req.adminUser!
    const msg = await saveDeskChatMessage({
      channel: 'vip-community',
      fromUserId: String(user._id),
      fromUserName: user.name || user.email || 'Coach',
      fromRole: 'admin',
      message: body.message ?? '',
    })
    emitToVip('desk:community:message', msg)
    emitToAdmins('desk:community:message', msg)
    return res.status(201).json({ ok: true, data: msg })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.get('/admin/direct/threads', requireAdminAuth, async (_req, res, next) => {
  try {
    const data = await listDirectThreadsForAdmin()
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.get('/admin/direct/:studentId', requireAdminAuth, async (req, res, next) => {
  try {
    const data = await listDirectThread(req.params.studentId)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.post('/admin/direct/:studentId', requireAdminAuth, async (req, res, next) => {
  try {
    const body = req.body as { message?: string }
    const user = req.adminUser!
    const studentId = req.params.studentId
    const msg = await saveDeskChatMessage({
      channel: 'direct',
      fromUserId: String(user._id),
      fromUserName: user.name || user.email || 'Coach',
      fromRole: 'admin',
      toUserId: studentId,
      message: body.message ?? '',
    })
    emitToDirectThread(studentId, 'desk:direct:message', msg)
    emitToAdmins('desk:direct:message', msg)
    return res.status(201).json({ ok: true, data: msg })
  } catch (error) {
    return next(error)
  }
})
