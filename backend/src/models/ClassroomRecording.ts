import { Schema, model } from 'mongoose'

export interface ClassroomRecordingDocument {
  roomId: string
  title: string
  filePath?: string
  eventCount: number
  metadata: Record<string, unknown>
  startedAt?: Date
  endedAt?: Date
  createdAt: Date
}

const classroomRecordingSchema = new Schema<ClassroomRecordingDocument>(
  {
    roomId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    filePath: { type: String, trim: true },
    eventCount: { type: Number, required: true, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    startedAt: { type: Date },
    endedAt: { type: Date },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'live_recordings' },
)

export const ClassroomRecordingModel = model<ClassroomRecordingDocument>(
  'ClassroomRecording',
  classroomRecordingSchema,
)
