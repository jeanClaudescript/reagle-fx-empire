import { Schema, model } from 'mongoose'

export interface ChatReadStateDocument {
  userId: string
  threadKey: string
  lastReadAt: Date
  updatedAt: Date
}

const chatReadStateSchema = new Schema<ChatReadStateDocument>(
  {
    userId: { type: String, required: true, index: true },
    threadKey: { type: String, required: true, index: true },
    lastReadAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, collection: 'chat_read_states' },
)

chatReadStateSchema.index({ userId: 1, threadKey: 1 }, { unique: true })

export const ChatReadStateModel = model<ChatReadStateDocument>('ChatReadState', chatReadStateSchema)
