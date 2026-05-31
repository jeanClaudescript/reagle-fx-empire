import { Schema, model } from 'mongoose'

export interface UserNotificationPreferencesDocument {
  userId: string
  pushEnabled: boolean
  popupEnabled: boolean
  emailEnabled: boolean
  mutedContentTypes: string[]
  lastPopupAt?: Date
  pushCountToday: number
  pushCountDate?: string
  lastSeenUpdateAt?: Date
  lastDailySubjectAt?: string
  updatedAt: Date
}

const prefsSchema = new Schema<UserNotificationPreferencesDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    pushEnabled: { type: Boolean, default: true },
    popupEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: false },
    mutedContentTypes: { type: [String], default: [] },
    lastPopupAt: { type: Date },
    pushCountToday: { type: Number, default: 0 },
    pushCountDate: { type: String },
    lastSeenUpdateAt: { type: Date },
    lastDailySubjectAt: { type: String },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'user_notification_preferences' },
)

export const UserNotificationPreferencesModel = model<UserNotificationPreferencesDocument>(
  'UserNotificationPreferences',
  prefsSchema,
)
