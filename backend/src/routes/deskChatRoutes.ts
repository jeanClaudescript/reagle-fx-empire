import { Router, type Request } from 'express'
import multer from 'multer'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import { requireStudentAuth } from '../middleware/requireStudentAuth.js'
import { requireVipMembership } from '../middleware/requireVipMembership.js'
import {
  listCommunityMessages,
  listDirectThread,
  listDirectThreadsForAdmin,
  listRegularCommunityMessages,
  markThreadRead,
  saveDeskChatMessage,
} from '../services/deskChatService.js'
import { isCloudinaryConfigured, uploadToCloudinary } from '../services/cloudinaryService.js'
import { emitToDirectThread, emitToAdmins, emitToRegular, emitToVip } from '../socket/io.js'
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

function detectUploadKind(file: Express.Multer.File) {
  const mime = (file.mimetype || '').toLowerCase()
  const name = (file.originalname || '').toLowerCase()
  const voiceName = /^voice-/.test(name)

  if (mime.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic|heif|bmp|svg)$/i.test(name)) {
    return { resourceType: 'image' as const, attachmentType: 'image' as const, mimeType: mime || 'image/jpeg' }
  }

  if (mime.startsWith('audio/') || voiceName || /\.(mp3|m4a|aac|ogg|wav|opus)$/i.test(name)) {
    return { resourceType: 'video' as const, attachmentType: 'voice' as const, mimeType: mime || 'audio/webm' }
  }

  if (mime.startsWith('video/') || /\.(mp4|mov|mkv|m4v|avi)$/i.test(name)) {
    return { resourceType: 'video' as const, attachmentType: 'video' as const, mimeType: mime || 'video/mp4' }
  }

  if (/\.webm$/i.test(name)) {
    return voiceName
      ? { resourceType: 'video' as const, attachmentType: 'voice' as const, mimeType: mime || 'audio/webm' }
      : { resourceType: 'video' as const, attachmentType: 'video' as const, mimeType: mime || 'video/webm' }
  }

  return { resourceType: 'raw' as const, attachmentType: 'file' as const, mimeType: mime || 'application/octet-stream' }
}

async function handleUpload(req: Request & { file?: Express.Multer.File }) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Media upload is not configured on the server')
  }
  const file = req.file
  if (!file) throw new Error('No file uploaded')

  const { resourceType, attachmentType, mimeType } = detectUploadKind(file)
  const result = await uploadToCloudinary(file.buffer, mimeType, resourceType)
  return {
    url: result.url,
    type: attachmentType,
    mimeType,
    fileName: file.originalname,
  }
}

export const deskChatRoutes = Router()

deskChatRoutes.post('/upload', requireVipMembership, upload.single('file'), async (req, res, next) => {
  try {
    const attachment = await handleUpload(req as Request & { file?: Express.Multer.File })
    return res.status(201).json({ ok: true, data: attachment })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.post('/regular/upload', requireStudentAuth, upload.single('file'), async (req, res, next) => {
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

deskChatRoutes.get('/regular-community', requireStudentAuth, async (_req, res, next) => {
  try {
    const data = await listRegularCommunityMessages()
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.post('/regular-community', requireStudentAuth, async (req, res, next) => {
  try {
    const user = req.studentUser!
    const msg = await saveDeskChatMessage({
      channel: 'regular-community',
      fromUserId: String(user._id),
      fromUserName: user.name || user.phone || user.email || 'Student',
      fromRole: 'student',
      payload: parseSendBody(req.body),
    })
    emitToRegular('desk:regular-community:message', msg)
    emitToAdmins('desk:regular-community:message', msg)
    return res.status(201).json({ ok: true, data: msg })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.get('/community', requireVipMembership, async (_req, res, next) => {
  try {
    const data = await listCommunityMessages()
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.post('/community', requireVipMembership, async (req, res, next) => {
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

deskChatRoutes.get('/direct', requireVipMembership, async (req, res, next) => {
  try {
    const studentId = String(req.studentUser!._id)
    const data = await listDirectThread(studentId)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.post('/direct', requireVipMembership, async (req, res, next) => {
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

deskChatRoutes.post('/direct/read', requireVipMembership, async (req, res, next) => {
  try {
    const studentId = String(req.studentUser!._id)
    const data = await markThreadRead(studentId, `direct:${studentId}`)
    emitToAdmins('desk:direct:read', { studentId, readAt: data.readAt })
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.get('/admin/regular-community', requireAdminAuth, async (_req, res, next) => {
  try {
    const data = await listRegularCommunityMessages()
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

deskChatRoutes.post('/admin/regular-community', requireAdminAuth, async (req, res, next) => {
  try {
    const user = req.adminUser!
    const msg = await saveDeskChatMessage({
      channel: 'regular-community',
      fromUserId: String(user._id),
      fromUserName: user.name || user.email || 'Coach',
      fromRole: 'admin',
      payload: parseSendBody(req.body),
    })
    emitToRegular('desk:regular-community:message', msg)
    emitToAdmins('desk:regular-community:message', msg)
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
