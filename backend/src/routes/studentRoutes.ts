import { Router } from 'express'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import {
  loginStudent,
  loginFreeStudent,
  logoutStudent,
  validateRegisteredStudentSession,
  invalidateStudentSessions,
  serializeStudent,
  loadActiveStudent,
  registerFreeStudent,
} from '../services/studentAuthService.js'
import {
  createStudentAccount,
  getStudentStats,
  exportStudentsCsv,
  listStudents,
  getStudentById,
  markStudentPaid,
  updateStudentAccount,
  deleteStudentAccount,
} from '../services/studentService.js'
import {
  membershipMetaForUser,
  resolveAccessMode,
  getSiteFreeAccessStatus,
  revokeMembership,
} from '../services/membershipService.js'

export const studentRoutes = Router()

studentRoutes.post('/auth/register-free', async (req, res, next) => {
  try {
    const body = req.body as {
      name?: string
      phone?: string
      email?: string
      referrerCode?: string
      deviceId?: string
      deviceLabel?: string
    }
    const data = await registerFreeStudent({
      name: body.name,
      phone: body.phone,
      email: body.email,
      referrerCode: body.referrerCode,
      deviceId: body.deviceId ?? '',
      deviceLabel: body.deviceLabel,
    })
    return res.status(201).json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

studentRoutes.post('/auth/login-free', async (req, res, next) => {
  try {
    const body = req.body as {
      phone?: string
      email?: string
      password?: string
      deviceId?: string
      deviceLabel?: string
    }
    const data = await loginFreeStudent({
      phone: body.phone,
      email: body.email,
      password: body.password,
      deviceId: body.deviceId ?? '',
      deviceLabel: body.deviceLabel,
    })
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

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

    const result = await validateRegisteredStudentSession(token)
    if (!result) {
      return res.status(401).json({
        error: 'Session expired or signed in on another device',
        code: 'SESSION_REVOKED',
      })
    }

    return res.json({ data: await serializeStudent(result.user) })
  } catch (error) {
    return next(error)
  }
})

studentRoutes.post('/access/check', async (req, res, next) => {
  try {
    const body = req.body as { phone?: string; email?: string }
    const user = await loadActiveStudent({ phone: body.phone, email: body.email })
    if (!user) {
      return res.json({ data: { found: false, membershipStatus: 'unpaid' as const } })
    }
    const mode = await resolveAccessMode(user)
    const promo = await getSiteFreeAccessStatus()
    const meta = await membershipMetaForUser(user)
    const hasAccess = mode === 'paid' || mode === 'promo'
    return res.json({
      data: {
        found: true,
        accessMode: mode,
        membershipStatus: hasAccess ? ('paid' as const) : ('unpaid' as const),
        membershipExpired: mode === 'expired',
        siteFreeAccessActive: promo.active,
        siteFreeAccessUntil: promo.until,
        name: user.name,
        referralCode: user.referralCode,
        ...meta,
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
    const status = (req.query.status as 'paid' | 'unpaid' | 'regular' | 'all' | undefined) ?? 'all'
    const q = (req.query.q as string | undefined)?.trim()
    const data = await listStudents({ status, q })
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

studentRoutes.get('/admin/export', requireAdminAuth, async (req, res, next) => {
  try {
    const status = (req.query.status as 'paid' | 'unpaid' | 'regular' | 'all' | undefined) ?? 'all'
    const q = (req.query.q as string | undefined)?.trim()
    const csv = await exportStudentsCsv({ status, q })
    const label = status === 'all' ? 'all-students' : `${status}-students`
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="reagle-${label}.csv"`)
    return res.send(`\uFEFF${csv}`)
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
    const body = req.body as { days?: number }
    const days = body.days != null ? Number(body.days) : undefined
    await markStudentPaid(req.params.id, days)
    const data = await getStudentById(req.params.id)
    if (!data) return res.status(404).json({ error: 'Student not found' })
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

studentRoutes.post('/admin/:id/revoke-access', requireAdminAuth, async (req, res, next) => {
  try {
    await revokeMembership(req.params.id)
    await invalidateStudentSessions(req.params.id)
    const data = await getStudentById(req.params.id)
    if (!data) return res.status(404).json({ error: 'Student not found' })
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

studentRoutes.delete('/admin/:id', requireAdminAuth, async (req, res, next) => {
  try {
    await deleteStudentAccount(req.params.id)
    return res.json({ ok: true })
  } catch (error) {
    return next(error)
  }
})
