import { Schema, model } from 'mongoose'

export type ClassroomRoomStatus = 'draft' | 'live' | 'ended'
export type JitsiTeachingMode = 'webcam' | 'screenshare'

export interface ClassroomRoomDocument {
  teacherId: string
  title: string
  description?: string
  status: ClassroomRoomStatus
  symbol: string
  timeframe: string
  /** Optional Jitsi live teaching layer — does not replace WebRTC chart/voice module */
  enableLiveTeaching: boolean
  jitsiRoomName?: string
  teachingSessionTitle?: string
  teachingScheduledAt?: Date
  jitsiMode: JitsiTeachingMode
  startedAt?: Date
  endedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const classroomRoomSchema = new Schema<ClassroomRoomDocument>(
  {
    teacherId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['draft', 'live', 'ended'], default: 'draft', index: true },
    symbol: { type: String, default: 'EURUSD', trim: true },
    timeframe: { type: String, default: '15', trim: true },
    enableLiveTeaching: { type: Boolean, default: false, index: true },
    jitsiRoomName: { type: String, trim: true, default: '' },
    teachingSessionTitle: { type: String, trim: true, default: '' },
    teachingScheduledAt: { type: Date },
    jitsiMode: { type: String, enum: ['webcam', 'screenshare'], default: 'webcam' },
    startedAt: { type: Date },
    endedAt: { type: Date },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'live_rooms' },
)

export const ClassroomRoomModel = model<ClassroomRoomDocument>('ClassroomRoom', classroomRoomSchema)
