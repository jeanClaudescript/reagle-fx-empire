import { Schema, model } from 'mongoose'
import type { ContentType } from '../types/engagement.js'

/** Aggregated medium/low priority feed entries (grouped analyses, news, signals). */
export interface ActivityFeedItemDocument {
  userId: string
  contentType: ContentType
  groupKey: string
  title: string
  body: string
  itemCount: number
  contentIds: string[]
  panelId?: string
  relevanceScore: number
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

const feedSchema = new Schema<ActivityFeedItemDocument>(
  {
    userId: { type: String, required: true, index: true },
    contentType: { type: String, required: true, index: true },
    groupKey: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    itemCount: { type: Number, required: true, default: 1, min: 1 },
    contentIds: { type: [String], default: [] },
    panelId: { type: String, trim: true },
    relevanceScore: { type: Number, required: true, default: 50 },
    readAt: { type: Date, index: true },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'activity_feed' },
)

feedSchema.index({ userId: 1, groupKey: 1 }, { unique: true })

export const ActivityFeedItemModel = model<ActivityFeedItemDocument>(
  'ActivityFeedItem',
  feedSchema,
)
