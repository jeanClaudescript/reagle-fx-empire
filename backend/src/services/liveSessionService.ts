import { LiveSessionModel, type LiveSessionStatus } from '../models/LiveSession.js'
import {
  onLiveSessionCreated,
  onLiveSessionStatusChanged,
  onLiveSessionUpdated,
  onLiveSignalBatch,
} from './engagementIntegrations.js'
import { emitToAll } from '../socket/io.js'

function broadcastLiveSession(session: ReturnType<typeof serializeLiveSession> | null) {
  emitToAll('live:updated', { data: session, at: new Date().toISOString() })
}

export function serializeLiveSession(doc: {
  _id: unknown
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
  signalSide?: string
  signalEntry?: number
  signalStop?: number
  signalTarget?: number
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description,
    status: doc.status,
    streamUrl: doc.streamUrl,
    meetingUrl: doc.meetingUrl,
    pair: doc.pair,
    scheduledAt: doc.scheduledAt?.toISOString(),
    startedAt: doc.startedAt?.toISOString(),
    endedAt: doc.endedAt?.toISOString(),
    coachNote: doc.coachNote ?? '',
    signalSide: doc.signalSide ?? 'neutral',
    signalEntry: doc.signalEntry,
    signalStop: doc.signalStop,
    signalTarget: doc.signalTarget,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

export async function getActiveLiveSession() {
  const doc = await LiveSessionModel.findOne({ status: 'live' }).sort({ startedAt: -1 }).lean()
  return doc ? serializeLiveSession(doc as never) : null
}

export async function listLiveSessions(limit = 20) {
  const docs = await LiveSessionModel.find().sort({ createdAt: -1 }).limit(limit).lean()
  return docs.map((d) => serializeLiveSession(d as never))
}

export async function createLiveSession(input: {
  title: string
  description?: string
  streamUrl?: string
  meetingUrl?: string
  pair?: string
  scheduledAt?: string
}) {
  if (!input.title?.trim()) throw new Error('Title is required')
  const doc = await LiveSessionModel.create({
    title: input.title.trim(),
    description: input.description?.trim(),
    streamUrl: input.streamUrl?.trim(),
    meetingUrl: input.meetingUrl?.trim(),
    pair: input.pair?.trim() || 'EUR/USD',
    status: 'scheduled',
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    coachNote: '',
    signalSide: 'neutral',
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const serialized = serializeLiveSession(doc)
  broadcastLiveSession(serialized.status === 'live' ? serialized : await getActiveLiveSession())
  void onLiveSessionCreated(serialized).catch(console.error)
  return serialized
}

export async function updateLiveSession(
  id: string,
  input: Partial<{
    title: string
    description: string
    streamUrl: string
    meetingUrl: string
    pair: string
    coachNote: string
    signalSide: 'buy' | 'sell' | 'neutral'
    signalEntry: number
    signalStop: number
    signalTarget: number
    scheduledAt: string
  }>,
) {
  const doc = await LiveSessionModel.findById(id)
  if (!doc) throw new Error('Session not found')
  if (input.title != null) doc.title = input.title.trim()
  if (input.description != null) doc.description = input.description.trim()
  if (input.streamUrl != null) doc.streamUrl = input.streamUrl.trim()
  if (input.meetingUrl != null) doc.meetingUrl = input.meetingUrl.trim()
  if (input.pair != null) doc.pair = input.pair.trim()
  if (input.coachNote != null) doc.coachNote = input.coachNote.trim()
  if (input.signalSide != null) doc.signalSide = input.signalSide
  if (input.signalEntry != null) doc.signalEntry = input.signalEntry
  if (input.signalStop != null) doc.signalStop = input.signalStop
  if (input.signalTarget != null) doc.signalTarget = input.signalTarget
  const signalChanged = input.signalSide != null || input.signalEntry != null
  if (input.scheduledAt != null) doc.scheduledAt = new Date(input.scheduledAt)
  doc.updatedAt = new Date()
  await doc.save()
  const serialized = serializeLiveSession(doc)
  broadcastLiveSession(await getActiveLiveSession())
  void onLiveSessionUpdated(serialized).catch(console.error)
  if (signalChanged && doc.signalSide && doc.signalSide !== 'neutral') {
    void onLiveSignalBatch(serialized).catch(console.error)
  }
  return serialized
}

export async function setLiveSessionStatus(id: string, status: LiveSessionStatus) {
  const doc = await LiveSessionModel.findById(id)
  if (!doc) throw new Error('Session not found')
  const prevStatus = doc.status

  if (status === 'live') {
    await LiveSessionModel.updateMany({ status: 'live', _id: { $ne: id } }, { status: 'ended', endedAt: new Date() })
    doc.status = 'live'
    doc.startedAt = new Date()
    doc.endedAt = undefined
  } else if (status === 'ended') {
    doc.status = 'ended'
    doc.endedAt = new Date()
  } else {
    doc.status = status
  }
  doc.updatedAt = new Date()
  await doc.save()
  const serialized = serializeLiveSession(doc)
  broadcastLiveSession(await getActiveLiveSession())
  void onLiveSessionStatusChanged(serialized, prevStatus).catch(console.error)
  return serialized
}
