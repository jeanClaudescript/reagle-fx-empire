import { Schema, model } from 'mongoose'
import type { ChatAttachment, ChatMessageType } from '../types/chat.js'

export type DeskChatChannel = 'vip-community' | 'direct'

export interface DeskChatMessageDocument {
  channel: DeskChatChannel
  fromUserId: string
  fromUserName: string
  fromRole: 'admin' | 'student'
  toUserId?: string
  message: string
  messageType: ChatMessageType
  attachments?: ChatAttachment[]
  replyTo?: { id: string; preview: string; fromUserName: string }
  readAt?: Date
  createdAt: Date
}

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'voice', 'file'], required: true },
    mimeType: String,
    fileName: String,
    durationSec: Number,
    width: Number,
    height: Number,
  },
  { _id: false },
)

const deskChatMessageSchema = new Schema<DeskChatMessageDocument>(
  {
    channel: { type: String, enum: ['vip-community', 'direct'], required: true, index: true },
    fromUserId: { type: String, required: true, index: true },
    fromUserName: { type: String, required: true, trim: true },
    fromRole: { type: String, enum: ['admin', 'student'], required: true },
    toUserId: { type: String, trim: true, index: true },
    message: { type: String, trim: true, maxlength: 2000, default: '' },
    messageType: { type: String, enum: ['text', 'image', 'video', 'voice', 'file'], default: 'text' },
    attachments: [attachmentSchema],
    replyTo: {
      id: String,
      preview: String,
      fromUserName: String,
    },
    readAt: { type: Date },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { collection: 'desk_chat_messages' },
)

deskChatMessageSchema.index({ channel: 1, createdAt: -1 })
deskChatMessageSchema.index({ channel: 1, fromUserId: 1, createdAt: -1 })

export const DeskChatMessageModel = model<DeskChatMessageDocument>('DeskChatMessage', deskChatMessageSchema)
