import { Router, type Request } from 'express'
import multer from 'multer'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import { requireStudentAuth } from '../middleware/requireStudentAuth.js'
import {
  listCommunityMessages,
  listDirectThread,
  listDirectThreadsForAdmin,
  markThreadRead,
  saveDeskChatMessage,
} from '../services/deskChatService.js'
import { isCloudinaryConfigured, uploadToCloudinary } from '../services/cloudinaryService.js'
import { emitToDirectThread, emitToAdmins, emitToVip } from '../socket/io.js'
import type { ChatSendPayload } from '../types/chat.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
})

function parseSendBody(body: unknown): ChatSendPayload {
  const b = body as ChatSendPayload
  return {
    message: b.message,
    messageType: b.messageType,
    attachments: b.attachments,
    replyTo: b.replyTo,
  }
}

async function handleUpload(req: Request & { file?: Express.Multer.File }) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Media upload is not configured on the server')
  }
  const file = req.file
  if (!file) throw new Error('No file uploaded')

  const isImage = file.mimetype.startsWith('image/')
  const isVideo = file.mimetype.startsWith('video/')
  const isAudio = file.mimetype.startsWith('audio/')

  let resourceType: 'image' | 'video' | 'raw' = 'raw'
  let attachmentType: 'image' | 'video' | 'voice' | 'file' = 'file'

  if (isImage) {
    resourceType = 'image'
    attachmentType = 'image'
  } else if (isVideo) {
    resourceType = 'video'
    attachmentType = 'video'
  } else if (isAudio) {
    resourceType = 'video'
    attachmentType = 'voice'
  }

  const result = await uploadToCloudinary(file.buffer, file.mimetype, resourceType)
  return {
    url: result.url,
    type: attachmentType,
    mimeType: file.mimetype,
    fileName: file.originalname,
  }
}

export const deskChatRoutes = Router()

deskChatRoutes.post('/upload', requireStudentAuth, upload.single('file'), async (req, res, next) => {
  try {
    const attachment = await handleUpload(req as Request & { file?: Express.Multer.File })
    return res.status(201).json({ ok: true, data: attachment })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.post('/admin/upload', requireAdminAuth, upload.single('file'), async (req, res, next) => {
  try {
    const attachment = await handleUpload(req as Request & { file?: Express.Multer.File })
    return res.status(201).json({ ok: true, data: attachment })
  } catch (error) {
    return next(error)
  }
})

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
    const user = req.studentUser!
    const msg = await saveDeskChatMessage({
      channel: 'vip-community',
      fromUserId: String(user._id),
      fromUserName: user.name || user.phone || user.email || 'Student',
      fromRole: 'student',
      payload: parseSendBody(req.body),
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
    const user = req.studentUser!
    const studentId = String(user._id)
    const msg = await saveDeskChatMessage({
      channel: 'direct',
      fromUserId: studentId,
      fromUserName: user.name || user.phone || user.email || 'Student',
      fromRole: 'student',
      toUserId: 'admin',
      payload: parseSendBody(req.body),
    })
    emitToDirectThread(studentId, 'desk:direct:message', msg)
    emitToAdmins('desk:direct:message', msg)
    return res.status(201).json({ ok: true, data: msg })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.post('/direct/read', requireStudentAuth, async (req, res, next) => {
  try {
    const studentId = String(req.studentUser!._id)
    const data = await markThreadRead(studentId, `direct:${studentId}`)
    emitToAdmins('desk:direct:read', { studentId, readAt: data.readAt })
    return res.json({ ok: true, data })
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
    const user = req.adminUser!
    const msg = await saveDeskChatMessage({
      channel: 'vip-community',
      fromUserId: String(user._id),
      fromUserName: user.name || user.email || 'Coach',
      fromRole: 'admin',
      payload: parseSendBody(req.body),
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
    const user = req.adminUser!
    const studentId = req.params.studentId
    const msg = await saveDeskChatMessage({
      channel: 'direct',
      fromUserId: String(user._id),
      fromUserName: user.name || user.email || 'Coach',
      fromRole: 'admin',
      toUserId: studentId,
      payload: parseSendBody(req.body),
    })
    emitToDirectThread(studentId, 'desk:direct:message', msg)
    emitToAdmins('desk:direct:message', msg)
    return res.status(201).json({ ok: true, data: msg })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.post('/admin/direct/:studentId/read', requireAdminAuth, async (req, res, next) => {
  try {
    const adminId = String(req.adminUser!._id)
    const studentId = req.params.studentId
    const data = await markThreadRead(adminId, `direct:${studentId}`)
    emitToDirectThread(studentId, 'desk:direct:read', { studentId, readAt: data.readAt })
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})
