import type { NextFunction, Request, Response } from 'express'
import type { AppUserDocument } from '../models/AppUser.js'
import { validateRegisteredStudentSession } from '../services/studentAuthService.js'

declare module 'express-serve-static-core' {
  interface Request {
    studentUser?: AppUserDocument
  }
}

export async function requireStudentAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized — sign in to the VIP desk' })
  }

  try {
    const result = await validateRegisteredStudentSession(token)
    if (!result) {
      return res.status(401).json({
        error: 'Session expired or signed in on another device — sign in again',
        code: 'SESSION_REVOKED',
      })
    }
    req.studentUser = result.user
    return next()
  } catch (error) {
    return next(error)
  }
}
