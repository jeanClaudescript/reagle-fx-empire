import mongoose, { Schema, type Document } from 'mongoose'
import type { LessonSplitMode } from '../types/education.js'

export interface EducationSettingsDocument extends Document {
  key: 'singleton'
  aiMode: boolean
  lessonSplitMode: LessonSplitMode
  wordsPerLessonMin: number
  wordsPerLessonMax: number
  lessonsPerDay: number
  enabled: boolean
  updatedAt: Date
}

const educationSettingsSchema = new Schema<EducationSettingsDocument>(
  {
    key: { type: String, required: true, unique: true, default: 'singleton' },
    aiMode: { type: Boolean, default: false },
    lessonSplitMode: { type: String, enum: ['chapter', 'words'], default: 'words' },
    wordsPerLessonMin: { type: Number, default: 800 },
    wordsPerLessonMax: { type: Number, default: 1200 },
    lessonsPerDay: { type: Number, default: 1, min: 1, max: 3 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'education_settings' },
)

export const EducationSettingsModel = mongoose.model<EducationSettingsDocument>(
  'EducationSettings',
  educationSettingsSchema,
)
