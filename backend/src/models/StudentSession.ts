import { Schema, model } from 'mongoose'

export interface StudentSessionDocument {
  token: string
  userId: string
  deviceId: string
  deviceLabel?: string
  expiresAt: Date
  createdAt: Date
}

const studentSessionSchema = new Schema<StudentSessionDocument>(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    deviceLabel: { type: String, trim: true },
    expiresAt: { type: Date, required: true, index: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'student_sessions' },
)

export const StudentSessionModel = model<StudentSessionDocument>(
  'StudentSession',
  studentSessionSchema,
)
