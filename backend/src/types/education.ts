export type BookFileType = 'pdf' | 'txt' | 'epub'
export type LessonSplitMode = 'chapter' | 'words'

export type EducationSettingsData = {
  aiMode: boolean
  lessonSplitMode: LessonSplitMode
  wordsPerLessonMin: number
  wordsPerLessonMax: number
  lessonsPerDay: number
  enabled: boolean
}

export type SerializedEducationBook = {
  id: string
  title: string
  description?: string
  fileUrl: string
  fileType: BookFileType
  fileName?: string
  sortOrder: number
  enabled: boolean
  lessonCount: number
  createdAt: string
  updatedAt: string
}

export type SerializedEducationLesson = {
  id: string
  bookId: string
  bookTitle?: string
  title: string
  subtitle?: string
  content: string
  aiContent?: string
  aiQuiz?: { question: string; options: string[]; answerIndex: number }[]
  orderIndex: number
  wordCount: number
  chapterTitle?: string
}

export type SerializedUserEducationState = {
  userId: string
  startedAt: string
  streakCount: number
  lastCompletedDate?: string
  totalCompleted: number
  currentDayIndex: number
}

export type LessonEmptyReason = 'disabled' | 'no_books' | 'no_lessons' | 'finished'

export type SerializedTodayLesson = {
  date: string
  dayIndex: number
  lesson: SerializedEducationLesson | null
  book: SerializedEducationBook | null
  completed: boolean
  aiMode: boolean
  streakCount: number
  emptyReason?: LessonEmptyReason
}

export type SerializedLessonHistoryItem = {
  dayIndex: number
  assignedDate: string
  completed: boolean
  lesson: SerializedEducationLesson
  book: SerializedEducationBook
}

export type SerializedBookProgress = {
  bookId: string
  title: string
  totalLessons: number
  completedLessons: number
  percent: number
}

export type SerializedUserProgress = {
  state: SerializedUserEducationState
  books: SerializedBookProgress[]
  recentCompletions: { lessonId: string; lessonTitle: string; bookTitle: string; dateCompleted: string }[]
}
