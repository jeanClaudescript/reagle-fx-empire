import type { NextFunction, Request, Response } from 'express'

const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`
    const now = Date.now()
    const bucket = buckets.get(key)
    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }
    if (bucket.count >= max) {
      return res.status(429).json({ error: 'Too many requests. Try again shortly.' })
    }
    bucket.count += 1
    return next()
  }
}
