import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../config/env.js'

export function isGeminiConfigured() {
  return Boolean(env.geminiApiKey)
}

export async function enhanceLessonWithGemini(content: string, title: string) {
  if (!env.geminiApiKey) {
    throw new Error('Gemini API key is not configured')
  }

  const genAI = new GoogleGenerativeAI(env.geminiApiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are a forex education tutor. Improve this lesson for clarity and readability.
Keep all factual content. Use short paragraphs and bullet points where helpful.
Do not invent facts not present in the source.

Title: ${title}

Source lesson:
${content.slice(0, 12000)}

Return ONLY the improved lesson text (no preamble).`

  const result = await model.generateContent(prompt)
  const text = result.response.text()?.trim()
  if (!text) throw new Error('Gemini returned empty content')
  return text
}

export async function generateQuizWithGemini(content: string, title: string) {
  if (!env.geminiApiKey) {
    throw new Error('Gemini API key is not configured')
  }

  const genAI = new GoogleGenerativeAI(env.geminiApiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `Create 3 multiple-choice quiz questions from this forex lesson.
Return valid JSON only: an array of objects with keys question, options (array of 4 strings), answerIndex (0-3).

Title: ${title}
Lesson:
${content.slice(0, 8000)}`

  const result = await model.generateContent(prompt)
  const raw = result.response.text()?.trim() ?? ''
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      question: string
      options: string[]
      answerIndex: number
    }[]
    return parsed
      .filter((q) => q.question && Array.isArray(q.options) && q.options.length >= 2)
      .slice(0, 3)
      .map((q) => ({
        question: q.question,
        options: q.options.slice(0, 4),
        answerIndex: Math.min(Math.max(0, q.answerIndex ?? 0), q.options.length - 1),
      }))
  } catch {
    return []
  }
}
