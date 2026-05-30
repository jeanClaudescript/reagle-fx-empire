import { Router } from 'express'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import {
  getDraftCms,
  getPublishedCms,
  publishDraftCms,
  resetDraftFromPublished,
  saveDraftCms,
} from '../services/cmsService.js'
import type { CMSData } from '../types/cms.js'

export const cmsRoutes = Router()

cmsRoutes.get('/published', async (_req, res, next) => {
  try {
    const data = await getPublishedCms()
    res.json({ data })
  } catch (error) {
    next(error)
  }
})

cmsRoutes.get('/draft', requireAdminAuth, async (_req, res, next) => {
  try {
    const data = await getDraftCms()
    res.json({ data })
  } catch (error) {
    next(error)
  }
})

cmsRoutes.put('/draft', requireAdminAuth, async (req, res, next) => {
  try {
    const body = req.body as { data?: CMSData }
    if (!body?.data || typeof body.data !== 'object') {
      return res.status(400).json({ error: 'Request body must include { data: CMSData }' })
    }
    const data = await saveDraftCms(body.data)
    return res.json({ data })
  } catch (error) {
    return next(error)
  }
})

cmsRoutes.post('/publish', requireAdminAuth, async (_req, res, next) => {
  try {
    const data = await publishDraftCms()
    res.json({ data })
  } catch (error) {
    next(error)
  }
})

cmsRoutes.post('/draft/reset', requireAdminAuth, async (_req, res, next) => {
  try {
    const data = await resetDraftFromPublished()
    res.json({ data })
  } catch (error) {
    next(error)
  }
})
