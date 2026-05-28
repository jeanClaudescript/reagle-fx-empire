import { Router, type Request } from 'express'
import multer from 'multer'
import { requireAdminKey } from '../middleware/requireAdminKey.js'
import { isCloudinaryConfigured, uploadToCloudinary } from '../services/cloudinaryService.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
})

export const mediaRoutes = Router()

mediaRoutes.post('/upload', requireAdminKey, upload.single('file'), async (req, res, next) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        error: 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the backend.',
      })
    }

    const file = (req as Request & { file?: Express.Multer.File }).file
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded. Use form field "file".' })
    }

    const isVideo = file.mimetype.startsWith('video/')
    const isImage = file.mimetype.startsWith('image/')
    if (!isVideo && !isImage) {
      return res.status(400).json({ error: 'Only image and video files are supported' })
    }

    const result = await uploadToCloudinary(file.buffer, file.mimetype, isVideo ? 'video' : 'image')
    return res.status(201).json({
      ok: true,
      url: result.url,
      publicId: result.publicId,
      resourceType: result.resourceType,
    })
  } catch (error) {
    return next(error)
  }
})
