import { Router } from 'express'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import {
  createStudentAccount,
  findUserByContact,
  getStudentStats,
  listStudents,
  getStudentById,
  markStudentPaid,
  updateStudentAccount,
} from '../services/studentService.js'

export const studentRoutes = Router()

studentRoutes.post('/access/check', async (req, res, next) => {
  try {
    const body = req.body as { phone?: string; email?: string }
    const user = await findUserByContact({ phone: body.phone, email: body.email })
    if (!user) {
      return res.json({ data: { found: false, membershipStatus: 'unpaid' as const } })
    }
    return res.json({
      data: {
        found: true,
        membershipStatus: user.membershipStatus ?? 'unpaid',
        name: user.name,
        referralCode: user.referralCode,
      },
    })
  } catch (error) {
    return next(error)
  }
})

studentRoutes.get('/admin/stats', requireAdminAuth, async (_req, res, next) => {
  try {
    const data = await getStudentStats()
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

studentRoutes.get('/admin/list', requireAdminAuth, async (req, res, next) => {
  try {
    const status = (req.query.status as 'paid' | 'unpaid' | 'all' | undefined) ?? 'all'
    const q = (req.query.q as string | undefined)?.trim()
    const data = await listStudents({ status, q })
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

studentRoutes.post('/admin/create', requireAdminAuth, async (req, res, next) => {
  try {
    const body = req.body as {
      name?: string
      phone?: string
      email?: string
      referrerCode?: string
      notes?: string
      membershipStatus?: 'paid' | 'unpaid'
    }
    const data = await createStudentAccount(body)
    return res.status(201).json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

studentRoutes.patch('/admin/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const body = req.body as {
      name?: string
      phone?: string
      email?: string
      notes?: string
      membershipStatus?: 'paid' | 'unpaid'
      walletBalance?: number
      clearPhone?: boolean
      clearEmail?: boolean
    }
    const data = await updateStudentAccount(req.params.id, body)
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

studentRoutes.post('/admin/:id/grant-access', requireAdminAuth, async (req, res, next) => {
  try {
    await markStudentPaid(req.params.id)
    const data = await getStudentById(req.params.id)
    if (!data) return res.status(404).json({ error: 'Student not found' })
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

studentRoutes.post('/admin/:id/revoke-access', requireAdminAuth, async (req, res, next) => {
  try {
    const data = await updateStudentAccount(req.params.id, { membershipStatus: 'unpaid' })
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})
