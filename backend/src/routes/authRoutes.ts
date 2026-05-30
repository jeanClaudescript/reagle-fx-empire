import { Router } from 'express'
import { rateLimit } from '../middleware/rateLimit.js'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import {
  bootstrapFirstAdmin,
  createAdminUser,
  hasAnyAdmin,
  listAdminUsers,
  loginAdmin,
  logoutAdmin,
  removeAdminUser,
} from '../services/adminAuthService.js'

export const authRoutes = Router()

authRoutes.get('/admin/setup', async (_req, res, next) => {
  try {
    return res.json({ data: { hasAdmin: await hasAnyAdmin() } })
  } catch (error) {
    return next(error)
  }
})

authRoutes.post('/admin/bootstrap', rateLimit(8, 60_000), async (req, res, next) => {
  try {
    const body = req.body as { email?: string; password?: string; name?: string }
    const result = await bootstrapFirstAdmin({
      email: body.email ?? '',
      password: body.password ?? '',
      name: body.name,
    })
    return res.json({ ok: true, data: result })
  } catch (error) {
    return next(error)
  }
})

authRoutes.post('/admin/login', rateLimit(12, 60_000), async (req, res, next) => {
  try {
    const body = req.body as { email?: string; password?: string }
    const result = await loginAdmin(body.email ?? '', body.password ?? '')
    return res.json({ ok: true, data: result })
  } catch (error) {
    return next(error)
  }
})

authRoutes.post('/admin/logout', requireAdminAuth, async (req, res, next) => {
  try {
    const header = req.header('authorization')
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : ''
    if (token) await logoutAdmin(token)
    return res.json({ ok: true })
  } catch (error) {
    return next(error)
  }
})

authRoutes.get('/admin/me', requireAdminAuth, async (req, res) => {
  const user = req.adminUser!
  return res.json({
    data: {
      id: String(user._id),
      email: user.email ?? '',
      name: user.name,
      isPrimary: Boolean(user.isPrimaryAdmin),
      role: user.role,
    },
  })
})

authRoutes.get('/admin/users', requireAdminAuth, async (_req, res, next) => {
  try {
    return res.json({ data: await listAdminUsers() })
  } catch (error) {
    return next(error)
  }
})

authRoutes.post('/admin/users', requireAdminAuth, async (req, res, next) => {
  try {
    const body = req.body as { email?: string; password?: string; name?: string }
    const user = await createAdminUser({
      email: body.email ?? '',
      password: body.password ?? '',
      name: body.name,
    })
    return res.json({ ok: true, data: user })
  } catch (error) {
    return next(error)
  }
})

authRoutes.delete('/admin/users/:id', requireAdminAuth, async (req, res, next) => {
  try {
    await removeAdminUser(req.params.id, String(req.adminUser!._id))
    return res.json({ ok: true })
  } catch (error) {
    return next(error)
  }
})
