import { Schema, model } from 'mongoose'
import type { LiveReminderKind } from '../types/engagement.js'

export interface LiveSessionReminderDocument {
  userId: string
  sessionId: string
  reminderKind: LiveReminderKind
  fireAt: Date
  sentAt?: Date
  cancelledAt?: Date
  createdAt: Date
}

const reminderSchema = new Schema<LiveSessionReminderDocument>(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    reminderKind: {
      type: String,
      required: true,
      enum: ['24h', '1h', '15m', 'live_started', 'recording'],
      index: true,
    },
    fireAt: { type: Date, required: true, index: true },
    sentAt: { type: Date },
    cancelledAt: { type: Date },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'live_session_reminders' },
)

reminderSchema.index({ userId: 1, sessionId: 1, reminderKind: 1 }, { unique: true })
reminderSchema.index({ fireAt: 1, sentAt: 1, cancelledAt: 1 })

export const LiveSessionReminderModel = model<LiveSessionReminderDocument>(
  'LiveSessionReminder',
  reminderSchema,
)
