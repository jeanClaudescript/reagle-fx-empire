import type { Types } from 'mongoose'
import { EducationBookModel, type EducationBookDocument } from '../models/EducationBook.js'
import { EducationLessonModel, type EducationLessonDocument } from '../models/EducationLesson.js'
import { EducationSettingsModel } from '../models/EducationSettings.js'
import { UserEducationStateModel } from '../models/UserEducationState.js'
import { UserLessonProgressModel } from '../models/UserLessonProgress.js'
import { AppUserModel } from '../models/AppUser.js'
import type {
  BookFileType,
  EducationSettingsData,
  SerializedEducationBook,
  SerializedEducationLesson,
  SerializedTodayLesson,
  SerializedUserProgress,
} from '../types/education.js'
import { extractBookText, fetchBookBuffer } from './bookTextExtractor.js'
import { generateLessonsFromText } from './lessonGeneratorService.js'
import { enhanceLessonWithGemini, generateQuizWithGemini, isGeminiConfigured } from './geminiService.js'
import { uploadToCloudinary } from './cloudinaryService.js'

const DEFAULT_SETTINGS: EducationSettingsData = {
  aiMode: false,
  lessonSplitMode: 'words',
  wordsPerLessonMin: 800,
  wordsPerLessonMax: 1200,
  lessonsPerDay: 1,
  enabled: true,
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function daysBetween(start: string, end: string) {
  const a = new Date(`${start}T00:00:00.000Z`).getTime()
  const b = new Date(`${end}T00:00:00.000Z`).getTime()
  return Math.max(0, Math.floor((b - a) / 86_400_000))
}

export function serializeBook(doc: EducationBookDocument): SerializedEducationBook {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description,
    fileUrl: doc.fileUrl,
    fileType: doc.fileType,
    fileName: doc.fileName,
    sortOrder: doc.sortOrder,
    enabled: doc.enabled,
    lessonCount: doc.lessonCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

export function serializeLesson(
  doc: EducationLessonDocument,
  bookTitle?: string,
  aiMode = false,
): SerializedEducationLesson {
  return {
    id: String(doc._id),
    bookId: String(doc.bookId),
    bookTitle,
    title: doc.title,
    content: aiMode && doc.aiContent ? doc.aiContent : doc.content,
    aiContent: doc.aiContent,
    aiQuiz: aiMode ? doc.aiQuiz : undefined,
    orderIndex: doc.orderIndex,
    wordCount: doc.wordCount,
    chapterTitle: doc.chapterTitle,
  }
}

export async function getEducationSettings(): Promise<EducationSettingsData> {
  const doc = await EducationSettingsModel.findOne({ key: 'singleton' })
  if (!doc) return { ...DEFAULT_SETTINGS }
  return {
    aiMode: doc.aiMode,
    lessonSplitMode: doc.lessonSplitMode,
    wordsPerLessonMin: doc.wordsPerLessonMin,
    wordsPerLessonMax: doc.wordsPerLessonMax,
    lessonsPerDay: doc.lessonsPerDay,
    enabled: doc.enabled,
  }
}

export async function updateEducationSettings(patch: Partial<EducationSettingsData>) {
  const doc = await EducationSettingsModel.findOneAndUpdate(
    { key: 'singleton' },
    {
      $set: {
        ...(patch.aiMode !== undefined ? { aiMode: patch.aiMode } : {}),
        ...(patch.lessonSplitMode !== undefined ? { lessonSplitMode: patch.lessonSplitMode } : {}),
        ...(patch.wordsPerLessonMin !== undefined ? { wordsPerLessonMin: patch.wordsPerLessonMin } : {}),
        ...(patch.wordsPerLessonMax !== undefined ? { wordsPerLessonMax: patch.wordsPerLessonMax } : {}),
        ...(patch.lessonsPerDay !== undefined ? { lessonsPerDay: patch.lessonsPerDay } : {}),
        ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
      },
      $setOnInsert: { key: 'singleton', ...DEFAULT_SETTINGS },
    },
    { upsert: true, new: true },
  )
  return {
    aiMode: doc.aiMode,
    lessonSplitMode: doc.lessonSplitMode,
    wordsPerLessonMin: doc.wordsPerLessonMin,
    wordsPerLessonMax: doc.wordsPerLessonMax,
    lessonsPerDay: doc.lessonsPerDay,
    enabled: doc.enabled,
  }
}

export async function listEducationBooks() {
  const books = await EducationBookModel.find().sort({ sortOrder: 1, createdAt: 1 })
  return books.map(serializeBook)
}

export async function uploadEducationBook(input: {
  title: string
  description?: string
  fileBuffer: Buffer
  mimeType: string
  fileName: string
  fileType: BookFileType
}) {
  const settings = await getEducationSettings()
  const count = await EducationBookModel.countDocuments()
  const resourceType = input.fileType === 'pdf' ? 'raw' : 'raw'
  const uploaded = await uploadToCloudinary(input.fileBuffer, input.mimeType, resourceType)

  const book = await EducationBookModel.create({
    title: input.title.trim(),
    description: input.description?.trim(),
    fileUrl: uploaded.url,
    fileType: input.fileType,
    fileName: input.fileName,
    sortOrder: count + 1,
    enabled: true,
    lessonCount: 0,
  })

  await generateLessonsForBook(String(book._id), settings)
  const refreshed = await EducationBookModel.findById(book._id)
  if (!refreshed) throw new Error('Book not found after creation')
  return serializeBook(refreshed)
}

export async function updateEducationBook(
  bookId: string,
  patch: { title?: string; description?: string; enabled?: boolean },
) {
  const book = await EducationBookModel.findByIdAndUpdate(
    bookId,
    {
      $set: {
        ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
        ...(patch.description !== undefined ? { description: patch.description.trim() } : {}),
        ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
      },
    },
    { new: true },
  )
  if (!book) throw new Error('Book not found')
  return serializeBook(book)
}

export async function deleteEducationBook(bookId: string) {
  const book = await EducationBookModel.findByIdAndDelete(bookId)
  if (!book) throw new Error('Book not found')
  await EducationLessonModel.deleteMany({ bookId: book._id })
  await UserLessonProgressModel.deleteMany({ bookId: book._id })
  return { ok: true }
}

export async function reorderEducationBooks(orderedIds: string[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    await EducationBookModel.findByIdAndUpdate(orderedIds[i], { sortOrder: i + 1 })
  }
  return listEducationBooks()
}

export async function generateLessonsForBook(bookId: string, settingsOverride?: EducationSettingsData) {
  const book = await EducationBookModel.findById(bookId)
  if (!book) throw new Error('Book not found')

  const settings = settingsOverride ?? (await getEducationSettings())
  const buffer = await fetchBookBuffer(book.fileUrl)
  const text = await extractBookText(buffer, book.fileType)
  const chunks = generateLessonsFromText(
    text,
    settings.lessonSplitMode,
    settings.wordsPerLessonMin,
    settings.wordsPerLessonMax,
  )

  if (!chunks.length) throw new Error('No lessons could be generated from this book')

  await EducationLessonModel.deleteMany({ bookId: book._id })

  const useAi = settings.aiMode && isGeminiConfigured()
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    let aiContent: string | undefined
    let aiQuiz: { question: string; options: string[]; answerIndex: number }[] | undefined

    if (useAi) {
      try {
        aiContent = await enhanceLessonWithGemini(chunk.content, chunk.title)
        aiQuiz = await generateQuizWithGemini(chunk.content, chunk.title)
      } catch (error) {
        console.error('[education] AI enhancement failed for lesson', i + 1, error)
      }
    }

    await EducationLessonModel.create({
      bookId: book._id,
      title: chunk.title,
      content: chunk.content,
      aiContent,
      aiQuiz,
      orderIndex: i + 1,
      wordCount: chunk.wordCount,
      chapterTitle: chunk.chapterTitle,
    })
  }

  book.lessonCount = chunks.length
  await book.save()
  return { lessonCount: chunks.length }
}

async function getActiveBooksWithLessons() {
  const books = await EducationBookModel.find({ enabled: true }).sort({ sortOrder: 1, createdAt: 1 })
  const lessons = await EducationLessonModel.find({
    bookId: { $in: books.map((b) => b._id) },
  }).sort({ orderIndex: 1 })

  const byBook = new Map<string, EducationLessonDocument[]>()
  for (const lesson of lessons) {
    const key = String(lesson.bookId)
    const list = byBook.get(key) ?? []
    list.push(lesson)
    byBook.set(key, list)
  }
  return { books, byBook }
}

export function resolveLessonForDayIndex(
  dayIndex: number,
  books: EducationBookDocument[],
  byBook: Map<string, EducationLessonDocument[]>,
) {
  if (!books.length) return null

  const numBooks = books.length
  const bookIdx = dayIndex % numBooks
  const lessonIdx = Math.floor(dayIndex / numBooks) + 1

  for (let offset = 0; offset < numBooks; offset++) {
    const book = books[(bookIdx + offset) % numBooks]
    const lessons = byBook.get(String(book._id)) ?? []
    const lesson = lessons.find((l) => l.orderIndex === lessonIdx)
    if (lesson) return { book, lesson }
  }

  return null
}

async function ensureUserState(userId: string | Types.ObjectId) {
  let state = await UserEducationStateModel.findOne({ userId })
  if (!state) {
    state = await UserEducationStateModel.create({
      userId,
      startedAt: new Date(),
      streakCount: 0,
      totalCompleted: 0,
      currentDayIndex: 0,
    })
  }
  return state
}

export async function getOrAssignTodayLesson(userId: string) {
  const settings = await getEducationSettings()
  if (!settings.enabled) {
    return {
      date: formatDate(new Date()),
      dayIndex: 0,
      lesson: null,
      book: null,
      completed: false,
      aiMode: settings.aiMode,
      streakCount: 0,
    } satisfies SerializedTodayLesson
  }

  const state = await ensureUserState(userId)
  const today = formatDate(new Date())
  const startDate = formatDate(state.startedAt)
  const dayIndex = daysBetween(startDate, today)

  const { books, byBook } = await getActiveBooksWithLessons()
  const resolved = resolveLessonForDayIndex(dayIndex, books, byBook)

  if (!resolved) {
    return {
      date: today,
      dayIndex,
      lesson: null,
      book: null,
      completed: false,
      aiMode: settings.aiMode,
      streakCount: state.streakCount,
    } satisfies SerializedTodayLesson
  }

  let progress = await UserLessonProgressModel.findOne({ userId, dayIndex })
  if (!progress) {
    progress = await UserLessonProgressModel.create({
      userId,
      lessonId: resolved.lesson._id,
      bookId: resolved.book._id,
      dayIndex,
      assignedDate: today,
      completed: false,
    })
    state.currentDayIndex = dayIndex
    state.lastAssignedDate = today
    await state.save()
  }

  const completed = progress.completed

  return {
    date: today,
    dayIndex,
    lesson: serializeLesson(resolved.lesson, resolved.book.title, settings.aiMode),
    book: serializeBook(resolved.book),
    completed,
    aiMode: settings.aiMode,
    streakCount: state.streakCount,
  } satisfies SerializedTodayLesson
}

export async function completeLesson(userId: string, lessonId: string) {
  const progress = await UserLessonProgressModel.findOne({ userId, lessonId, completed: false })
  if (!progress) throw new Error('Lesson not found or already completed')

  const today = formatDate(new Date())
  progress.completed = true
  progress.dateCompleted = new Date()
  await progress.save()

  const state = await ensureUserState(userId)
  state.totalCompleted += 1

  if (state.lastCompletedDate) {
    const yesterday = formatDate(new Date(Date.now() - 86_400_000))
    if (state.lastCompletedDate === yesterday) {
      state.streakCount += 1
    } else if (state.lastCompletedDate !== today) {
      state.streakCount = 1
    }
  } else {
    state.streakCount = 1
  }
  state.lastCompletedDate = today
  await state.save()

  return { ok: true, streakCount: state.streakCount, totalCompleted: state.totalCompleted }
}

export async function getUserProgress(userId: string): Promise<SerializedUserProgress> {
  const state = await ensureUserState(userId)
  const books = await EducationBookModel.find({ enabled: true }).sort({ sortOrder: 1 })
  const completedRows = await UserLessonProgressModel.find({ userId, completed: true })
    .sort({ dateCompleted: -1 })
    .limit(20)
    .populate('lessonId')
    .populate('bookId')

  const allCompleted = await UserLessonProgressModel.find({ userId, completed: true })
  const counts = new Map<string, number>()
  for (const row of allCompleted) {
    const key = String(row.bookId)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const bookProgress = await Promise.all(
    books.map(async (book) => {
      const total = book.lessonCount || (await EducationLessonModel.countDocuments({ bookId: book._id }))
      const completed = counts.get(String(book._id)) ?? 0
      return {
        bookId: String(book._id),
        title: book.title,
        totalLessons: total,
        completedLessons: completed,
        percent: total ? Math.round((completed / total) * 100) : 0,
      }
    }),
  )

  const recentCompletions = completedRows.slice(0, 10).map((row) => {
    const lesson = row.lessonId as unknown as EducationLessonDocument | null
    const book = row.bookId as unknown as EducationBookDocument | null
    return {
      lessonId: String(row.lessonId),
      lessonTitle: lesson?.title ?? 'Lesson',
      bookTitle: book?.title ?? 'Book',
      dateCompleted: row.dateCompleted?.toISOString() ?? row.assignedDate,
    }
  })

  return {
    state: {
      userId: String(state.userId),
      startedAt: state.startedAt.toISOString(),
      streakCount: state.streakCount,
      lastCompletedDate: state.lastCompletedDate,
      totalCompleted: state.totalCompleted,
      currentDayIndex: state.currentDayIndex,
    },
    books: bookProgress,
    recentCompletions,
  }
}

export async function listAdminUserProgress(limit = 50) {
  const states = await UserEducationStateModel.find()
    .sort({ totalCompleted: -1 })
    .limit(limit)
    .populate('userId')

  return states.map((s) => {
    const user = s.userId as unknown as { _id: Types.ObjectId; name?: string; phone?: string; email?: string }
    return {
      userId: String(user?._id ?? s.userId),
      name: user?.name,
      phone: user?.phone,
      email: user?.email,
      streakCount: s.streakCount,
      totalCompleted: s.totalCompleted,
      startedAt: s.startedAt.toISOString(),
      lastCompletedDate: s.lastCompletedDate,
    }
  })
}

/** Daily cron: ensure every active student has today's assignment row */
export async function assignDailyLessonsForAllUsers() {
  const settings = await getEducationSettings()
  if (!settings.enabled) return { assigned: 0 }

  const students = await AppUserModel.find({ role: 'student' }).select('_id')
  let assigned = 0
  for (const student of students) {
    const before = await UserLessonProgressModel.countDocuments({ userId: student._id })
    await getOrAssignTodayLesson(String(student._id))
    const after = await UserLessonProgressModel.countDocuments({ userId: student._id })
    if (after > before) assigned += 1
  }
  return { assigned }
}

export async function listBookLessons(bookId: string) {
  const book = await EducationBookModel.findById(bookId)
  if (!book) throw new Error('Book not found')
  const lessons = await EducationLessonModel.find({ bookId }).sort({ orderIndex: 1 })
  const settings = await getEducationSettings()
  return lessons.map((l) => serializeLesson(l, book.title, settings.aiMode))
}
