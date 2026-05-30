import { Schema, model } from 'mongoose'

export interface AdminSessionDocument {
  token: string
  userId: string
  expiresAt: Date
  createdAt: Date
}

const adminSessionSchema = new Schema<AdminSessionDocument>(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'admin_sessions' },
)

export const AdminSessionModel = model<AdminSessionDocument>('AdminSession', adminSessionSchema)
