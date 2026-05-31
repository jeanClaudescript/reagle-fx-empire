import mongoose, { Schema, type Document, type Types } from 'mongoose'

export interface UserEducationStateDocument extends Document {
  userId: Types.ObjectId
  startedAt: Date
  streakCount: number
  lastCompletedDate?: string
  totalCompleted: number
  currentDayIndex: number
  lastAssignedDate?: string
  updatedAt: Date
}

const userEducationStateSchema = new Schema<UserEducationStateDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'AppUser', required: true, unique: true },
    startedAt: { type: Date, required: true, default: () => new Date() },
    streakCount: { type: Number, default: 0 },
    lastCompletedDate: { type: String },
    totalCompleted: { type: Number, default: 0 },
    currentDayIndex: { type: Number, default: 0 },
    lastAssignedDate: { type: String },
  },
  { timestamps: true, collection: 'user_education_states' },
)

export const UserEducationStateModel = mongoose.model<UserEducationStateDocument>(
  'UserEducationState',
  userEducationStateSchema,
)
