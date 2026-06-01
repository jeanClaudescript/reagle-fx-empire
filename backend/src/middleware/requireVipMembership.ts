import type { NextFunction, Request, Response } from 'express'
import { validateStudentSession } from '../services/studentAuthService.js'

export async function requireVipMembership(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized — sign in to the VIP desk' })
  }

  try {
    const result = await validateStudentSession(token)
    if (!result) {
      return res.status(403).json({
        error: 'VIP membership required — complete payment to unlock this feature',
        code: 'VIP_REQUIRED',
      })
    }
    req.studentUser = result.user
    return next()
  } catch (error) {
    return next(error)
  }
}
