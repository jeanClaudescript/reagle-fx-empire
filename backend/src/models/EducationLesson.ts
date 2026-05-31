import mongoose, { Schema, type Document, type Types } from 'mongoose'

export interface EducationLessonDocument extends Document {
  bookId: Types.ObjectId
  title: string
  content: string
  aiContent?: string
  aiQuiz?: { question: string; options: string[]; answerIndex: number }[]
  orderIndex: number
  wordCount: number
  chapterTitle?: string
  createdAt: Date
  updatedAt: Date
}

const educationLessonSchema = new Schema<EducationLessonDocument>(
  {
    bookId: { type: Schema.Types.ObjectId, ref: 'EducationBook', required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    aiContent: { type: String },
    aiQuiz: [
      {
        question: String,
        options: [String],
        answerIndex: Number,
      },
    ],
    orderIndex: { type: Number, required: true },
    wordCount: { type: Number, default: 0 },
    chapterTitle: { type: String, trim: true },
  },
  { timestamps: true, collection: 'education_lessons' },
)

educationLessonSchema.index({ bookId: 1, orderIndex: 1 }, { unique: true })

export const EducationLessonModel = mongoose.model<EducationLessonDocument>(
  'EducationLesson',
  educationLessonSchema,
)
