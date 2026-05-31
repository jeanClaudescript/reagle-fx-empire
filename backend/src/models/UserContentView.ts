import { Schema, model } from 'mongoose'
import type { ContentType } from '../types/engagement.js'

export interface UserContentViewDocument {
  userId: string
  contentType: ContentType
  contentId: string
  viewedAt: Date
  metadata?: Record<string, unknown>
}

const userContentViewSchema = new Schema<UserContentViewDocument>(
  {
    userId: { type: String, required: true, index: true },
    contentType: { type: String, required: true, index: true },
    contentId: { type: String, required: true, index: true },
    viewedAt: { type: Date, required: true, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { collection: 'user_content_views' },
)

userContentViewSchema.index({ userId: 1, contentType: 1, contentId: 1 }, { unique: true })

export const UserContentViewModel = model<UserContentViewDocument>(
  'UserContentView',
  userContentViewSchema,
)
