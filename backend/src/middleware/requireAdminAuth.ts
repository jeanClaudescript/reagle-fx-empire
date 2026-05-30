import type { NextFunction, Request, Response } from 'express'
import type { AppUserDocument } from '../models/AppUser.js'
import { validateAdminSession } from '../services/adminAuthService.js'

declare module 'express-serve-static-core' {
  interface Request {
    adminUser?: AppUserDocument
  }
}

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized — sign in as admin' })
  }

  try {
    const result = await validateAdminSession(token)
    if (!result) {
      return res.status(401).json({ error: 'Session expired — sign in again' })
    }
    req.adminUser = result.user
    return next()
  } catch (error) {
    return next(error)
  }
}
