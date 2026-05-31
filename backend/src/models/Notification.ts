import { Schema, model } from 'mongoose'
import type { ContentType, NotificationPriority } from '../types/engagement.js'

export interface NotificationDocument {
  userId: string
  contentType: ContentType
  contentId: string
  priority: NotificationPriority
  title: string
  body: string
  actionUrl?: string
  panelId?: string
  groupKey?: string
  dedupeKey: string
  relevanceScore: number
  metadata?: Record<string, unknown>
  readAt?: Date
  dismissedAt?: Date
  popupShownAt?: Date
  pushSentAt?: Date
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: String, required: true, index: true },
    contentType: { type: String, required: true, index: true },
    contentId: { type: String, required: true, index: true },
    priority: { type: Number, required: true, enum: [1, 2, 3, 4], index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    actionUrl: { type: String, trim: true },
    panelId: { type: String, trim: true, index: true },
    groupKey: { type: String, trim: true, index: true },
    dedupeKey: { type: String, required: true, trim: true },
    relevanceScore: { type: Number, required: true, default: 50, min: 0, max: 100 },
    metadata: { type: Schema.Types.Mixed },
    readAt: { type: Date, index: true },
    dismissedAt: { type: Date },
    popupShownAt: { type: Date },
    pushSentAt: { type: Date },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'notifications' },
)

notificationSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true })
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, groupKey: 1, createdAt: -1 })

export const NotificationModel = model<NotificationDocument>('Notification', notificationSchema)
