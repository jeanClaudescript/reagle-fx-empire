import { Schema, model } from 'mongoose'

export type DeskChatChannel = 'vip-community' | 'direct'

export interface DeskChatMessageDocument {
  channel: DeskChatChannel
  fromUserId: string
  fromUserName: string
  fromRole: 'admin' | 'student'
  toUserId?: string
  message: string
  createdAt: Date
}

const deskChatMessageSchema = new Schema<DeskChatMessageDocument>(
  {
    channel: { type: String, enum: ['vip-community', 'direct'], required: true, index: true },
    fromUserId: { type: String, required: true, index: true },
    fromUserName: { type: String, required: true, trim: true },
    fromRole: { type: String, enum: ['admin', 'student'], required: true },
    toUserId: { type: String, trim: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { collection: 'desk_chat_messages' },
)

deskChatMessageSchema.index({ channel: 1, createdAt: -1 })
deskChatMessageSchema.index({ channel: 1, fromUserId: 1, createdAt: -1 })

export const DeskChatMessageModel = model<DeskChatMessageDocument>('DeskChatMessage', deskChatMessageSchema)
