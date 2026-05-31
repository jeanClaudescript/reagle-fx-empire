import { Router, type Request } from 'express'
import multer from 'multer'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import { requireStudentAuth } from '../middleware/requireStudentAuth.js'
import { detectFileType } from '../services/bookTextExtractor.js'
import {
  completeLesson,
  deleteEducationBook,
  generateLessonsForBook,
  getEducationSettings,
  getOrAssignTodayLesson,
  getUserProgress,
  listAdminUserProgress,
  listBookLessons,
  listEducationBooks,
  reorderEducationBooks,
  updateEducationBook,
  updateEducationSettings,
  uploadEducationBook,
} from '../services/educationService.js'
import { isGeminiConfigured } from '../services/geminiService.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
})

export const educationRoutes = Router()

educationRoutes.get('/admin/settings', requireAdminAuth, async (_req, res, next) => {
  try {
    const settings = await getEducationSettings()
    res.json({
      data: {
        ...settings,
        geminiConfigured: isGeminiConfigured(),
      },
    })
  } catch (error) {
    next(error)
  }
})

educationRoutes.put('/admin/settings', requireAdminAuth, async (req, res, next) => {
  try {
    const body = req.body as Partial<{
      aiMode: boolean
      lessonSplitMode: 'chapter' | 'words'
      wordsPerLessonMin: number
      wordsPerLessonMax: number
      lessonsPerDay: number
      enabled: boolean
    }>
    const settings = await updateEducationSettings(body)
    res.json({ data: { ...settings, geminiConfigured: isGeminiConfigured() } })
  } catch (error) {
    next(error)
  }
})

educationRoutes.post('/admin/toggle-ai', requireAdminAuth, async (req, res, next) => {
  try {
    const enabled = Boolean((req.body as { enabled?: boolean }).enabled)
    const settings = await updateEducationSettings({ aiMode: enabled })
    res.json({ data: { aiMode: settings.aiMode, geminiConfigured: isGeminiConfigured() } })
  } catch (error) {
    next(error)
  }
})

educationRoutes.get('/admin/books', requireAdminAuth, async (_req, res, next) => {
  try {
    const books = await listEducationBooks()
    res.json({ data: books })
  } catch (error) {
    next(error)
  }
})

educationRoutes.post('/admin/books/upload', requireAdminAuth, upload.single('file'), async (req, res, next) => {
  try {
    const file = (req as Request & { file?: Express.Multer.File }).file
    const body = req.body as { title?: string; description?: string }
    if (!file) return res.status(400).json({ error: 'No file uploaded. Use form field "file".' })
    if (!body.title?.trim()) return res.status(400).json({ error: 'Title is required' })

    const fileType = detectFileType(file.mimetype, file.originalname)
    if (!fileType) {
      return res.status(400).json({ error: 'Only PDF, TXT, and EPUB files are supported' })
    }

    const book = await uploadEducationBook({
      title: body.title,
      description: body.description,
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
      fileName: file.originalname,
      fileType,
    })

    res.status(201).json({ ok: true, data: book })
  } catch (error) {
    next(error)
  }
})

educationRoutes.patch('/admin/books/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const body = req.body as { title?: string; description?: string; enabled?: boolean }
    const book = await updateEducationBook(req.params.id, body)
    res.json({ data: book })
  } catch (error) {
    next(error)
  }
})

educationRoutes.delete('/admin/books/:id', requireAdminAuth, async (req, res, next) => {
  try {
    await deleteEducationBook(req.params.id)
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

educationRoutes.post('/admin/books/reorder', requireAdminAuth, async (req, res, next) => {
  try {
    const ids = (req.body as { orderedIds?: string[] }).orderedIds
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: 'orderedIds array is required' })
    }
    const books = await reorderEducationBooks(ids)
    res.json({ data: books })
  } catch (error) {
    next(error)
  }
})

educationRoutes.post('/admin/books/:id/regenerate-lessons', requireAdminAuth, async (req, res, next) => {
  try {
    const result = await generateLessonsForBook(req.params.id)
    res.json({ ok: true, data: result })
  } catch (error) {
    next(error)
  }
})

educationRoutes.get('/admin/books/:id/lessons', requireAdminAuth, async (req, res, next) => {
  try {
    const lessons = await listBookLessons(req.params.id)
    res.json({ data: lessons })
  } catch (error) {
    next(error)
  }
})

educationRoutes.get('/admin/user-progress', requireAdminAuth, async (_req, res, next) => {
  try {
    const rows = await listAdminUserProgress()
    res.json({ data: rows })
  } catch (error) {
    next(error)
  }
})

educationRoutes.get('/today-lesson', requireStudentAuth, async (req, res, next) => {
  try {
    const data = await getOrAssignTodayLesson(String(req.studentUser!._id))
    res.json({ data })
  } catch (error) {
    next(error)
  }
})

educationRoutes.post('/complete-lesson', requireStudentAuth, async (req, res, next) => {
  try {
    const lessonId = (req.body as { lessonId?: string }).lessonId
    if (!lessonId?.trim()) return res.status(400).json({ error: 'lessonId is required' })
    const result = await completeLesson(String(req.studentUser!._id), lessonId.trim())
    res.json({ ok: true, data: result })
  } catch (error) {
    next(error)
  }
})

educationRoutes.get('/progress', requireStudentAuth, async (req, res, next) => {
  try {
    const data = await getUserProgress(String(req.studentUser!._id))
    res.json({ data })
  } catch (error) {
    next(error)
  }
})

educationRoutes.get('/settings', requireStudentAuth, async (_req, res, next) => {
  try {
    const settings = await getEducationSettings()
    res.json({ data: { enabled: settings.enabled, aiMode: settings.aiMode } })
  } catch (error) {
    next(error)
  }
})
