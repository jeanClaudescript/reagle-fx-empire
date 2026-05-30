import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { ClassroomChatMessageModel } from '../models/ClassroomChatMessage.js'
import { ClassroomEventModel } from '../models/ClassroomEvent.js'
import { ClassroomParticipantModel } from '../models/ClassroomParticipant.js'
import { ClassroomRecordingModel } from '../models/ClassroomRecording.js'
import {
  ClassroomRoomModel,
  type ClassroomRoomDocument,
  type ClassroomRoomStatus,
} from '../models/ClassroomRoom.js'
import { emitToAll } from '../socket/io.js'

const TEACHER_LEAVE_GRACE_MS = 12_000
const teacherLeaveTimers = new Map<string, ReturnType<typeof setTimeout>>()

function clearTeacherLeaveTimer(roomId: string) {
  const timer = teacherLeaveTimers.get(roomId)
  if (timer) clearTimeout(timer)
  teacherLeaveTimers.delete(roomId)
}

/** When coach closes the teacher tab without clicking End, stop showing live to students. */
export function scheduleClassroomEndIfNoTeacher(
  roomId: string,
  hasTeacherConnected: () => Promise<boolean>,
  delayMs = TEACHER_LEAVE_GRACE_MS,
) {
  clearTeacherLeaveTimer(roomId)
  teacherLeaveTimers.set(
    roomId,
    setTimeout(() => {
      teacherLeaveTimers.delete(roomId)
      void endClassroomIfNoTeacher(roomId, hasTeacherConnected)
    }, delayMs),
  )
}

export async function endClassroomIfNoTeacher(
  roomId: string,
  hasTeacherConnected: () => Promise<boolean>,
) {
  try {
    if (await hasTeacherConnected()) return
    const doc = await ClassroomRoomModel.findById(roomId)
    if (!doc || doc.status !== 'live') return
    await setClassroomRoomStatus(roomId, 'ended')
  } catch {
    /* ignore */
  }
}

export function cancelClassroomEndIfNoTeacher(roomId: string) {
  clearTeacherLeaveTimer(roomId)
}

function broadcastClassroomUpdate() {
  void getActiveClassroomRoom().then((data) => {
    emitToAll('classroom:updated', { data, at: new Date().toISOString() })
  })
}

function serializeRoom(doc: ClassroomRoomDocument & { _id: unknown }) {
  return {
    id: String(doc._id),
    teacherId: doc.teacherId,
    title: doc.title,
    description: doc.description ?? '',
    status: doc.status,
    symbol: doc.symbol,
    timeframe: doc.timeframe,
    enableLiveTeaching: Boolean(doc.enableLiveTeaching),
    jitsiRoomName: doc.jitsiRoomName ?? '',
    teachingSessionTitle: doc.teachingSessionTitle ?? '',
    teachingScheduledAt: doc.teachingScheduledAt?.toISOString(),
    jitsiMode: doc.jitsiMode ?? 'webcam',
    startedAt: doc.startedAt?.toISOString(),
    endedAt: doc.endedAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

export async function listClassroomRooms(teacherId?: string) {
  const filter = teacherId ? { teacherId } : {}
  const rows = await ClassroomRoomModel.find(filter).sort({ createdAt: -1 }).limit(100)
  return rows.map(serializeRoom)
}

export async function getActiveClassroomRoom() {
  const doc = await ClassroomRoomModel.findOne({ status: 'live' }).sort({ startedAt: -1 })
  return doc ? serializeRoom(doc) : null
}

export async function getClassroomRoom(id: string) {
  const doc = await ClassroomRoomModel.findById(id)
  if (!doc) throw new Error('Classroom room not found')
  return serializeRoom(doc)
}

function sanitizeJitsiRoomName(raw: string) {
  return raw
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .slice(0, 80)
}

export async function createClassroomRoom(input: {
  teacherId: string
  title: string
  description?: string
  symbol?: string
  timeframe?: string
  enableLiveTeaching?: boolean
  jitsiRoomName?: string
  teachingSessionTitle?: string
  teachingScheduledAt?: string
  jitsiMode?: 'webcam' | 'screenshare'
}) {
  if (!input.title.trim()) throw new Error('Title is required')
  const now = new Date()
  const jitsiRoomName = input.jitsiRoomName
    ? sanitizeJitsiRoomName(input.jitsiRoomName)
    : sanitizeJitsiRoomName(`reagle-${Date.now()}`)
  const doc = await ClassroomRoomModel.create({
    teacherId: input.teacherId,
    title: input.title.trim(),
    description: input.description?.trim() ?? '',
    status: 'draft',
    symbol: input.symbol?.trim() || 'EURUSD',
    timeframe: input.timeframe?.trim() || '15',
    enableLiveTeaching: Boolean(input.enableLiveTeaching),
    jitsiRoomName,
    teachingSessionTitle: input.teachingSessionTitle?.trim() ?? input.title.trim(),
    teachingScheduledAt: input.teachingScheduledAt ? new Date(input.teachingScheduledAt) : undefined,
    jitsiMode: input.jitsiMode === 'screenshare' ? 'screenshare' : 'webcam',
    createdAt: now,
    updatedAt: now,
  })
  return serializeRoom(doc)
}

export async function updateClassroomRoom(
  id: string,
  input: Partial<{
    title: string
    description: string
    symbol: string
    timeframe: string
    enableLiveTeaching: boolean
    jitsiRoomName: string
    teachingSessionTitle: string
    teachingScheduledAt: string
    jitsiMode: 'webcam' | 'screenshare'
  }>,
) {
  const doc = await ClassroomRoomModel.findById(id)
  if (!doc) throw new Error('Classroom room not found')
  if (doc.status === 'ended') throw new Error('Cannot edit an ended room')

  if (input.title !== undefined) doc.title = input.title.trim()
  if (input.description !== undefined) doc.description = input.description.trim()
  if (input.symbol !== undefined) doc.symbol = input.symbol.trim()
  if (input.timeframe !== undefined) doc.timeframe = input.timeframe.trim()
  if (input.enableLiveTeaching !== undefined) doc.enableLiveTeaching = input.enableLiveTeaching
  if (input.jitsiRoomName !== undefined) doc.jitsiRoomName = sanitizeJitsiRoomName(input.jitsiRoomName)
  if (input.teachingSessionTitle !== undefined) {
    doc.teachingSessionTitle = input.teachingSessionTitle.trim()
  }
  if (input.teachingScheduledAt !== undefined) {
    doc.teachingScheduledAt = input.teachingScheduledAt
      ? new Date(input.teachingScheduledAt)
      : undefined
  }
  if (input.jitsiMode !== undefined) {
    doc.jitsiMode = input.jitsiMode === 'screenshare' ? 'screenshare' : 'webcam'
  }
  doc.updatedAt = new Date()
  await doc.save()
  const room = serializeRoom(doc)
  if (doc.status === 'live') broadcastClassroomUpdate()
  return room
}

export async function setClassroomRoomStatus(id: string, status: ClassroomRoomStatus) {
  const doc = await ClassroomRoomModel.findById(id)
  if (!doc) throw new Error('Classroom room not found')

  const now = new Date()
  if (status === 'live') {
    const existing = await ClassroomRoomModel.findOne({ status: 'live', _id: { $ne: id } })
    if (existing) throw new Error('Another classroom is already live — end it first')
    doc.status = 'live'
    doc.startedAt = doc.startedAt ?? now
    doc.endedAt = undefined
  } else if (status === 'ended') {
    doc.status = 'ended'
    doc.endedAt = now
    await finalizeRecording(id, doc.title, doc.startedAt, now)
    await closeActiveParticipants(id, now)
  } else {
    doc.status = 'draft'
  }
  doc.updatedAt = now
  await doc.save()
  const room = serializeRoom(doc)
  broadcastClassroomUpdate()
  return room
}

async function closeActiveParticipants(roomId: string, leftAt: Date) {
  const active = await ClassroomParticipantModel.find({ roomId, leftAt: { $exists: false } })
  await Promise.all(
    active.map(async (p) => {
      p.leftAt = leftAt
      p.durationSeconds = Math.max(0, Math.floor((leftAt.getTime() - p.joinedAt.getTime()) / 1000))
      p.updatedAt = leftAt
      await p.save()
    }),
  )
}

export async function recordClassroomEvent(input: {
  roomId: string
  eventType: string
  payload: Record<string, unknown>
  userId?: string
}) {
  await ClassroomEventModel.create({
    roomId: input.roomId,
    eventType: input.eventType,
    payload: input.payload,
    userId: input.userId,
    createdAt: new Date(),
  })
}

export async function joinClassroomParticipant(input: {
  roomId: string
  userId: string
  userName: string
  role: 'teacher' | 'moderator' | 'student'
  socketId?: string
}) {
  const room = await ClassroomRoomModel.findById(input.roomId)
  if (!room) throw new Error('Classroom room not found')
  if (room.status !== 'live' && input.role === 'student') {
    throw new Error('Classroom is not live yet')
  }

  const existing = await ClassroomParticipantModel.findOne({
    roomId: input.roomId,
    userId: input.userId,
    leftAt: { $exists: false },
  })
  if (existing) {
    existing.socketId = input.socketId
    existing.userName = input.userName
    existing.updatedAt = new Date()
    await existing.save()
    return existing
  }

  return ClassroomParticipantModel.create({
    roomId: input.roomId,
    userId: input.userId,
    userName: input.userName,
    role: input.role,
    joinedAt: new Date(),
    socketId: input.socketId,
    canSpeak: input.role === 'teacher',
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

export async function leaveClassroomParticipant(roomId: string, userId: string) {
  const participant = await ClassroomParticipantModel.findOne({
    roomId,
    userId,
    leftAt: { $exists: false },
  })
  if (!participant) return null
  const leftAt = new Date()
  participant.leftAt = leftAt
  participant.durationSeconds = Math.max(
    0,
    Math.floor((leftAt.getTime() - participant.joinedAt.getTime()) / 1000),
  )
  participant.updatedAt = leftAt
  await participant.save()
  return participant
}

export async function listActiveParticipants(roomId: string) {
  const rows = await ClassroomParticipantModel.find({ roomId, leftAt: { $exists: false } }).sort({
    joinedAt: 1,
  })
  return rows.map((p) => ({
    id: String(p._id),
    roomId: p.roomId,
    userId: p.userId,
    userName: p.userName,
    role: p.role,
    joinedAt: p.joinedAt.toISOString(),
    canSpeak: Boolean(p.canSpeak),
  }))
}

export async function listRoomAttendance(roomId: string) {
  const rows = await ClassroomParticipantModel.find({ roomId }).sort({ joinedAt: -1 })
  return rows.map((p) => ({
    id: String(p._id),
    userId: p.userId,
    userName: p.userName,
    role: p.role,
    joinedAt: p.joinedAt.toISOString(),
    leftAt: p.leftAt?.toISOString(),
    durationSeconds: p.durationSeconds ?? 0,
  }))
}

export async function setParticipantCanSpeak(roomId: string, userId: string, canSpeak: boolean) {
  const participant = await ClassroomParticipantModel.findOne({
    roomId,
    userId,
    leftAt: { $exists: false },
  })
  if (!participant) throw new Error('Participant not found')
  participant.canSpeak = canSpeak
  participant.updatedAt = new Date()
  await participant.save()
  return {
    userId: participant.userId,
    canSpeak: Boolean(participant.canSpeak),
  }
}

export async function saveChatMessage(input: {
  roomId: string
  userId: string
  userName: string
  role: 'teacher' | 'moderator' | 'student'
  message: string
  replyToId?: string
}) {
  const text = input.message.trim()
  if (!text) throw new Error('Message is required')
  const doc = await ClassroomChatMessageModel.create({
    roomId: input.roomId,
    userId: input.userId,
    userName: input.userName,
    role: input.role,
    message: text,
    replyToId: input.replyToId,
    pinned: false,
    createdAt: new Date(),
  })
  return {
    id: String(doc._id),
    roomId: doc.roomId,
    userId: doc.userId,
    userName: doc.userName,
    role: doc.role,
    message: doc.message,
    replyToId: doc.replyToId,
    pinned: Boolean(doc.pinned),
    createdAt: doc.createdAt.toISOString(),
  }
}

export async function pinChatMessage(roomId: string, messageId: string, pinned: boolean) {
  await ClassroomChatMessageModel.updateMany({ roomId }, { pinned: false })
  const doc = await ClassroomChatMessageModel.findOneAndUpdate(
    { _id: messageId, roomId },
    { pinned },
    { new: true },
  )
  if (!doc) throw new Error('Message not found')
  return {
    id: String(doc._id),
    pinned: Boolean(doc.pinned),
  }
}

export async function listRecentChatMessages(roomId: string, limit = 80) {
  const rows = await ClassroomChatMessageModel.find({ roomId })
    .sort({ createdAt: -1 })
    .limit(limit)
  return rows.reverse().map((doc) => ({
    id: String(doc._id),
    roomId: doc.roomId,
    userId: doc.userId,
    userName: doc.userName,
    role: doc.role,
    message: doc.message,
    replyToId: doc.replyToId,
    pinned: Boolean(doc.pinned),
    createdAt: doc.createdAt.toISOString(),
  }))
}

async function finalizeRecording(
  roomId: string,
  title: string,
  startedAt?: Date,
  endedAt?: Date,
) {
  const events = await ClassroomEventModel.find({ roomId }).sort({ createdAt: 1 })
  const dir = path.join(process.cwd(), 'recordings')
  await mkdir(dir, { recursive: true })
  const fileName = `room-${roomId}-${Date.now()}.json`
  const filePath = path.join(dir, fileName)
  const payload = {
    roomId,
    title,
    startedAt: startedAt?.toISOString(),
    endedAt: endedAt?.toISOString(),
    events: events.map((e) => ({
      eventType: e.eventType,
      payload: e.payload,
      userId: e.userId,
      createdAt: e.createdAt.toISOString(),
    })),
  }
  await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8')

  await ClassroomRecordingModel.create({
    roomId,
    title,
    filePath: fileName,
    eventCount: events.length,
    metadata: { symbol: payload.events.find((e) => e.eventType === 'chart:symbol')?.payload },
    startedAt,
    endedAt,
    createdAt: new Date(),
  })
}

export async function listRoomRecordings(roomId: string) {
  const rows = await ClassroomRecordingModel.find({ roomId }).sort({ createdAt: -1 })
  return rows.map((r) => ({
    id: String(r._id),
    roomId: r.roomId,
    title: r.title,
    filePath: r.filePath,
    eventCount: r.eventCount,
    startedAt: r.startedAt?.toISOString(),
    endedAt: r.endedAt?.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function getRecordingEvents(recordingId: string) {
  const recording = await ClassroomRecordingModel.findById(recordingId)
  if (!recording?.filePath) throw new Error('Recording not found')
  const fullPath = path.join(process.cwd(), 'recordings', recording.filePath)
  const { readFile } = await import('fs/promises')
  const raw = await readFile(fullPath, 'utf8')
  return JSON.parse(raw) as {
    roomId: string
    title: string
    startedAt?: string
    endedAt?: string
    events: Array<{
      eventType: string
      payload: Record<string, unknown>
      userId?: string
      createdAt: string
    }>
  }
}

export async function getRoomChartState(roomId: string) {
  const types = [
    'chart:symbol',
    'chart:timeframe',
    'chart:range',
    'chart:crosshair',
    'drawing:add',
    'drawing:update',
    'drawing:delete',
  ]
  const events = await ClassroomEventModel.find({ roomId, eventType: { $in: types } }).sort({
    createdAt: 1,
  })

  let symbol = 'EURUSD'
  let timeframe = '15'
  let range: Record<string, unknown> | null = null
  let crosshair: Record<string, unknown> | null = null
  const drawings = new Map<string, Record<string, unknown>>()

  for (const event of events) {
    if (event.eventType === 'chart:symbol' && typeof event.payload.symbol === 'string') {
      symbol = event.payload.symbol
    } else if (event.eventType === 'chart:timeframe' && typeof event.payload.timeframe === 'string') {
      timeframe = event.payload.timeframe
    } else if (event.eventType === 'chart:range') {
      range = event.payload
    } else if (event.eventType === 'chart:crosshair') {
      crosshair = event.payload
    } else if (event.eventType === 'drawing:add' || event.eventType === 'drawing:update') {
      const id = String(event.payload.id ?? '')
      if (id) drawings.set(id, event.payload)
    } else if (event.eventType === 'drawing:delete') {
      const id = String(event.payload.id ?? '')
      if (id) drawings.delete(id)
    }
  }

  return {
    symbol,
    timeframe,
    range,
    crosshair,
    drawings: Array.from(drawings.values()),
  }
}
