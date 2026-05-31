import type { LessonSplitMode } from '../types/education.js'

export type GeneratedLessonChunk = {
  title: string
  content: string
  chapterTitle?: string
  wordCount: number
}

const CHAPTER_PATTERNS = [
  /^chapter\s+[\dIVXLC]+[\s:.\-–—]/i,
  /^CHAPTER\s+[\dIVXLC]+[\s:.\-–—]/,
  /^part\s+[\dIVXLC]+[\s:.\-–—]/i,
  /^lesson\s+[\dIVXLC]+[\s:.\-–—]/i,
  /^unit\s+[\dIVXLC]+[\s:.\-–—]/i,
  /^\d+\.\s+[A-Z][A-Za-z\s]{2,40}$/,
]

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length
}

function splitByChapters(text: string): GeneratedLessonChunk[] {
  const lines = text.split(/\n/)
  const sections: { title: string; lines: string[] }[] = []
  let currentTitle = 'Introduction'
  let currentLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    const isChapter = trimmed.length > 0 && CHAPTER_PATTERNS.some((p) => p.test(trimmed))
    if (isChapter && currentLines.length > 0) {
      sections.push({ title: currentTitle, lines: currentLines })
      currentTitle = trimmed
      currentLines = []
      continue
    }
    if (trimmed) currentLines.push(trimmed)
  }
  if (currentLines.length) sections.push({ title: currentTitle, lines: currentLines })

  if (sections.length <= 1) {
    return splitByWords(text, 800, 1200)
  }

  return sections
    .map((s, idx) => {
      const content = s.lines.join('\n\n').trim()
      return {
        title: `Lesson ${idx + 1}: ${s.title.slice(0, 80)}`,
        content,
        chapterTitle: s.title,
        wordCount: countWords(content),
      }
    })
    .filter((l) => l.wordCount >= 30)
}

function splitByWords(text: string, minWords: number, maxWords: number): GeneratedLessonChunk[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (!words.length) return []

  const target = Math.min(maxWords, Math.max(minWords, Math.round((minWords + maxWords) / 2)))
  const chunks: GeneratedLessonChunk[] = []
  let i = 0
  let lessonNum = 1

  while (i < words.length) {
    const slice = words.slice(i, i + target)
    const content = slice.join(' ')
    chunks.push({
      title: `Lesson ${lessonNum}`,
      content,
      wordCount: slice.length,
    })
    i += target
    lessonNum += 1
  }

  return chunks
}

export function generateLessonsFromText(
  text: string,
  mode: LessonSplitMode,
  minWords = 800,
  maxWords = 1200,
): GeneratedLessonChunk[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  if (!normalized) return []

  const lessons =
    mode === 'chapter' ? splitByChapters(normalized) : splitByWords(normalized, minWords, maxWords)

  return lessons.map((l, idx) => ({
    ...l,
    title: l.title.startsWith('Lesson') ? l.title : `Lesson ${idx + 1}`,
  }))
}
