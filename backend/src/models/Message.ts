import { Schema, model } from 'mongoose'

export interface MessageDocument {
  name: string
  email?: string
  phone?: string
  channel?: string
  message: string
  source: 'public-site'
  status: 'new' | 'read'
  createdAt: Date
}

const messageSchema = new Schema<MessageDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: undefined },
    phone: { type: String, trim: true, default: undefined },
    channel: { type: String, trim: true, default: undefined },
    message: { type: String, required: true, trim: true },
    source: { type: String, required: true, enum: ['public-site'], default: 'public-site' },
    status: { type: String, required: true, enum: ['new', 'read'], default: 'new' },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'messages' },
)

export const MessageModel = model<MessageDocument>('Message', messageSchema)
