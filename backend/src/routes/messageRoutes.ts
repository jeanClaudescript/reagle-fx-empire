import { Router } from 'express'
import { MessageModel } from '../models/Message.js'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'

export const messageRoutes = Router()

messageRoutes.post('/', async (req, res, next) => {
  try {
    const body = req.body as {
      name?: string
      email?: string
      phone?: string
      channel?: string
      message?: string
    }

    const name = (body.name ?? '').trim()
    const message = (body.message ?? '').trim()
    if (!name || !message) {
      return res.status(400).json({ error: 'Name and message are required' })
    }

    const created = await MessageModel.create({
      name,
      email: body.email?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
      channel: body.channel?.trim() || undefined,
      message,
      source: 'public-site',
      status: 'new',
    })

    return res.status(201).json({
      ok: true,
      data: {
        id: String(created._id),
        createdAt: created.createdAt.toISOString(),
      },
    })
  } catch (error) {
    return next(error)
  }
})

messageRoutes.get('/', requireAdminAuth, async (_req, res, next) => {
  try {
    const docs = await MessageModel.find().sort({ createdAt: -1 }).limit(200).lean()
    const data = docs.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      channel: doc.channel,
      message: doc.message,
      source: doc.source,
      status: doc.status,
      createdAt: doc.createdAt,
    }))
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

messageRoutes.post('/:id/read', requireAdminAuth, async (req, res, next) => {
  try {
    const updated = await MessageModel.findByIdAndUpdate(
      req.params.id,
      { status: 'read' },
      { new: true },
    ).lean()
    if (!updated) return res.status(404).json({ error: 'Message not found' })
    return res.json({ ok: true })
  } catch (error) {
    return next(error)
  }
})
