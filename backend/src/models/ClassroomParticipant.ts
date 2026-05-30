import { Schema, model } from 'mongoose'

export type ClassroomParticipantRole = 'teacher' | 'moderator' | 'student'

export interface ClassroomParticipantDocument {
  roomId: string
  userId: string
  userName: string
  role: ClassroomParticipantRole
  joinedAt: Date
  leftAt?: Date
  durationSeconds?: number
  socketId?: string
  canSpeak?: boolean
  createdAt: Date
  updatedAt: Date
}

const classroomParticipantSchema = new Schema<ClassroomParticipantDocument>(
  {
    roomId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['teacher', 'moderator', 'student'], required: true },
    joinedAt: { type: Date, required: true, default: Date.now },
    leftAt: { type: Date },
    durationSeconds: { type: Number, min: 0 },
    socketId: { type: String, trim: true },
    canSpeak: { type: Boolean, default: false },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'live_room_participants' },
)

classroomParticipantSchema.index({ roomId: 1, userId: 1, leftAt: 1 })

export const ClassroomParticipantModel = model<ClassroomParticipantDocument>(
  'ClassroomParticipant',
  classroomParticipantSchema,
)
