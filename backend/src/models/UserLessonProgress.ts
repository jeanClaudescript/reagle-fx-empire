import mongoose, { Schema, type Document, type Types } from 'mongoose'

export interface UserLessonProgressDocument extends Document {
  userId: Types.ObjectId
  lessonId: Types.ObjectId
  bookId: Types.ObjectId
  dayIndex: number
  assignedDate: string
  completed: boolean
  dateCompleted?: Date
  createdAt: Date
}

const userLessonProgressSchema = new Schema<UserLessonProgressDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'AppUser', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'EducationLesson', required: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'EducationBook', required: true },
    dayIndex: { type: Number, required: true },
    assignedDate: { type: String, required: true },
    completed: { type: Boolean, default: false },
    dateCompleted: { type: Date },
  },
  { timestamps: true, collection: 'user_lesson_progress' },
)

userLessonProgressSchema.index({ userId: 1, dayIndex: 1 }, { unique: true })
userLessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true })

export const UserLessonProgressModel = mongoose.model<UserLessonProgressDocument>(
  'UserLessonProgress',
  userLessonProgressSchema,
)
