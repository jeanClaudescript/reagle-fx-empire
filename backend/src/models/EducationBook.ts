import mongoose, { Schema, type Document } from 'mongoose'
import type { BookFileType } from '../types/education.js'

export interface EducationBookDocument extends Document {
  title: string
  description?: string
  fileUrl: string
  fileType: BookFileType
  fileName?: string
  sortOrder: number
  enabled: boolean
  lessonCount: number
  createdAt: Date
  updatedAt: Date
}

const educationBookSchema = new Schema<EducationBookDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'txt', 'epub'], required: true },
    fileName: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    lessonCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'education_books' },
)

educationBookSchema.index({ sortOrder: 1, enabled: 1 })

export const EducationBookModel = mongoose.model<EducationBookDocument>(
  'EducationBook',
  educationBookSchema,
)
