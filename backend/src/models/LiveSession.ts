import { Schema, model } from 'mongoose'

export type LiveSessionStatus = 'scheduled' | 'live' | 'ended'

export interface LiveSessionDocument {
  title: string
  description?: string
  status: LiveSessionStatus
  streamUrl?: string
  meetingUrl?: string
  pair: string
  scheduledAt?: Date
  startedAt?: Date
  endedAt?: Date
  coachNote?: string
  signalSide?: 'buy' | 'sell' | 'neutral'
  signalEntry?: number
  signalStop?: number
  signalTarget?: number
  createdAt: Date
  updatedAt: Date
}

const liveSessionSchema = new Schema<LiveSessionDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled', index: true },
    streamUrl: { type: String, trim: true },
    meetingUrl: { type: String, trim: true },
    pair: { type: String, default: 'EUR/USD', trim: true },
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    endedAt: { type: Date },
    coachNote: { type: String, trim: true, default: '' },
    signalSide: { type: String, enum: ['buy', 'sell', 'neutral'], default: 'neutral' },
    signalEntry: { type: Number },
    signalStop: { type: Number },
    signalTarget: { type: Number },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'live_sessions' },
)

export const LiveSessionModel = model<LiveSessionDocument>('LiveSession', liveSessionSchema)
