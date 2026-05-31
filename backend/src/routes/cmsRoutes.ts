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
import { emitToAll } from '../socket/io.js'

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
    const prev = await getPublishedCms().catch(() => undefined)
    const data = await publishDraftCms()
    emitToAll('cms:published', { data, at: new Date().toISOString() })
    const { onCmsPublished } = await import('../services/engagementIntegrations.js')
    void onCmsPublished(data, prev).catch(console.error)
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
