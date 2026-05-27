import { Router } from 'express'
import { requireAdminKey } from '../middleware/requireAdminKey.js'
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

cmsRoutes.get('/draft', requireAdminKey, async (_req, res, next) => {
  try {
    const data = await getDraftCms()
    res.json({ data })
  } catch (error) {
    next(error)
  }
})

cmsRoutes.put('/draft', requireAdminKey, async (req, res, next) => {
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

cmsRoutes.post('/publish', requireAdminKey, async (_req, res, next) => {
  try {
    const data = await publishDraftCms()
    res.json({ data })
  } catch (error) {
    next(error)
  }
})

cmsRoutes.post('/draft/reset', requireAdminKey, async (_req, res, next) => {
  try {
    const data = await resetDraftFromPublished()
    res.json({ data })
  } catch (error) {
    next(error)
  }
})
