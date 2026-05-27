import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'

export function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  if (!env.adminApiKey) {
    return next()
  }

  const provided = req.header('x-admin-api-key')
  if (provided !== env.adminApiKey) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  return next()
}
