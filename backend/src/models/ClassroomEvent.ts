import { Schema, model } from 'mongoose'

export interface ClassroomEventDocument {
  roomId: string
  eventType: string
  payload: Record<string, unknown>
  userId?: string
  createdAt: Date
}

const classroomEventSchema = new Schema<ClassroomEventDocument>(
  {
    roomId: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true, default: {} },
    userId: { type: String, trim: true },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { collection: 'live_room_events' },
)

export const ClassroomEventModel = model<ClassroomEventDocument>('ClassroomEvent', classroomEventSchema)
