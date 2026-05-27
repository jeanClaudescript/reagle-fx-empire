import { Schema, model } from 'mongoose'
import type { CMSData } from '../types/cms.js'

export interface CmsStateDocument {
  key: 'singleton'
  draft: CMSData
  published: CMSData
  updatedAt: Date
}

const cmsStateSchema = new Schema<CmsStateDocument>(
  {
    key: { type: String, required: true, unique: true, enum: ['singleton'] },
    draft: { type: Schema.Types.Mixed, required: true },
    published: { type: Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'cms_states' },
)

export const CmsStateModel = model<CmsStateDocument>('CmsState', cmsStateSchema)
