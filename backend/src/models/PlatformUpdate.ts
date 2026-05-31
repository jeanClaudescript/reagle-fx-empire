import { Schema, model } from 'mongoose'
import type { ContentType } from '../types/engagement.js'

export interface PlatformUpdateItem {
  contentType: ContentType
  contentId: string
  title: string
  summary?: string
}

export interface PlatformUpdateDocument {
  version: string
  title: string
  summary: string
  items: PlatformUpdateItem[]
  publishedAt: Date
  createdAt: Date
}

const platformUpdateSchema = new Schema<PlatformUpdateDocument>(
  {
    version: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: '', trim: true },
    items: {
      type: [
        {
          contentType: { type: String, required: true },
          contentId: { type: String, required: true },
          title: { type: String, required: true },
          summary: { type: String },
        },
      ],
      default: [],
    },
    publishedAt: { type: Date, required: true, default: Date.now, index: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'platform_updates' },
)

export const PlatformUpdateModel = model<PlatformUpdateDocument>(
  'PlatformUpdate',
  platformUpdateSchema,
)
