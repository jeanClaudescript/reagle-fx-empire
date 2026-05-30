import { Schema, model } from 'mongoose'

export interface ClassroomChatMessageDocument {
  roomId: string
  userId: string
  userName: string
  role: ClassroomChatRole
  message: string
  replyToId?: string
  pinned?: boolean
  createdAt: Date
}

export type ClassroomChatRole = 'teacher' | 'moderator' | 'student'

const classroomChatMessageSchema = new Schema<ClassroomChatMessageDocument>(
  {
    roomId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['teacher', 'moderator', 'student'], required: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    replyToId: { type: String, trim: true },
    pinned: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { collection: 'live_chat_messages' },
)

export const ClassroomChatMessageModel = model<ClassroomChatMessageDocument>(
  'ClassroomChatMessage',
  classroomChatMessageSchema,
)
