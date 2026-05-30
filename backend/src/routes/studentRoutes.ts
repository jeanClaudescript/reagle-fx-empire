import { Router } from 'express'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import {
  loginStudent,
  logoutStudent,
  validateStudentSession,
  invalidateStudentSessions,
} from '../services/studentAuthService.js'
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

studentRoutes.post('/auth/login', async (req, res, next) => {
  try {
    const body = req.body as {
      phone?: string
      email?: string
      deviceId?: string
      deviceLabel?: string
    }
    const data = await loginStudent({
      phone: body.phone,
      email: body.email,
      deviceId: body.deviceId ?? '',
      deviceLabel: body.deviceLabel,
    })
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

studentRoutes.post('/auth/logout', async (req, res, next) => {
  try {
    const header = req.header('authorization')
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null
    if (token) await logoutStudent(token)
    return res.json({ ok: true })
  } catch (error) {
    return next(error)
  }
})

studentRoutes.get('/auth/me', async (req, res, next) => {
  try {
    const header = req.header('authorization')
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null
    if (!token) return res.status(401).json({ error: 'Unauthorized', code: 'SESSION_REVOKED' })

    const result = await validateStudentSession(token)
    if (!result) {
      return res.status(401).json({
        error: 'Session expired or signed in on another device',
        code: 'SESSION_REVOKED',
      })
    }

    return res.json({
      data: {
        id: String(result.user._id),
        name: result.user.name,
        phone: result.user.phone,
        email: result.user.email,
        membershipStatus: result.user.membershipStatus,
        referralCode: result.user.referralCode,
        paidAt: result.user.paidAt?.toISOString(),
      },
    })
  } catch (error) {
    return next(error)
  }
})

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
    await invalidateStudentSessions(req.params.id)
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})
