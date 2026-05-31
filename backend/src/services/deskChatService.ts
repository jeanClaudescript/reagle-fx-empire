import { DeskChatMessageModel } from '../models/DeskChatMessage.js'
import { ChatReadStateModel } from '../models/ChatReadState.js'
import type { ChatSendPayload, SerializedDeskChatMessage } from '../types/chat.js'

function serialize(doc: {
  _id: unknown
  channel: string
  fromUserId: string
  fromUserName: string
  fromRole: string
  toUserId?: string
  message: string
  messageType?: string
  attachments?: SerializedDeskChatMessage['attachments']
  replyTo?: SerializedDeskChatMessage['replyTo']
  readAt?: Date
  createdAt: Date
}): SerializedDeskChatMessage {
  return {
    id: String(doc._id),
    channel: doc.channel as SerializedDeskChatMessage['channel'],
    fromUserId: doc.fromUserId,
    fromUserName: doc.fromUserName,
    fromRole: doc.fromRole as SerializedDeskChatMessage['fromRole'],
    toUserId: doc.toUserId,
    message: doc.message ?? '',
    messageType: (doc.messageType as SerializedDeskChatMessage['messageType']) ?? 'text',
    attachments: doc.attachments,
    replyTo: doc.replyTo,
    readAt: doc.readAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  }
}

export async function listCommunityMessages(limit = 120) {
  const rows = await DeskChatMessageModel.find({ channel: 'vip-community' })
    .sort({ createdAt: -1 })
    .limit(limit)
  return rows.reverse().map(serialize)
}

export async function listDirectThread(studentId: string, limit = 120) {
  const rows = await DeskChatMessageModel.find({
    channel: 'direct',
    $or: [{ fromUserId: studentId }, { toUserId: studentId }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
  return rows.reverse().map(serialize)
}

export async function listDirectThreadsForAdmin() {
  const rows = await DeskChatMessageModel.find({ channel: 'direct' }).sort({ createdAt: -1 }).limit(500)
  const map = new Map<
    string,
    { studentId: string; studentName: string; lastMessage: string; lastAt: string; count: number }
  >()

  for (const row of rows) {
    const studentId = row.fromRole === 'student' ? row.fromUserId : row.toUserId
    if (!studentId) continue
    const preview = row.message || (row.attachments?.length ? '📎 Media' : '')
    const existing = map.get(studentId)
    if (!existing) {
      map.set(studentId, {
        studentId,
        studentName: row.fromRole === 'student' ? row.fromUserName : 'Student',
        lastMessage: preview,
        lastAt: row.createdAt.toISOString(),
        count: 1,
      })
    } else {
      existing.count += 1
    }
  }

  return Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt))
}

function resolveMessageType(payload: ChatSendPayload): SerializedDeskChatMessage['messageType'] {
  if (payload.messageType) return payload.messageType
  const att = payload.attachments?.[0]
  if (att?.type === 'image') return 'image'
  if (att?.type === 'video') return 'video'
  if (att?.type === 'voice') return 'voice'
  if (att?.type === 'file') return 'file'
  return 'text'
}

export async function saveDeskChatMessage(input: {
  channel: 'vip-community' | 'direct'
  fromUserId: string
  fromUserName: string
  fromRole: 'admin' | 'student'
  toUserId?: string
  payload: ChatSendPayload
}) {
  const text = (input.payload.message ?? '').trim()
  const attachments = input.payload.attachments?.filter((a) => a.url) ?? []
  if (!text && attachments.length === 0) throw new Error('Message is required')

  if (input.channel === 'direct' && input.fromRole === 'admin' && !input.toUserId) {
    throw new Error('Student id is required for direct replies')
  }

  const doc = await DeskChatMessageModel.create({
    channel: input.channel,
    fromUserId: input.fromUserId,
    fromUserName: input.fromUserName,
    fromRole: input.fromRole,
    toUserId: input.toUserId,
    message: text,
    messageType: resolveMessageType(input.payload),
    attachments: attachments.length ? attachments : undefined,
    replyTo: input.payload.replyTo,
    createdAt: new Date(),
  })
  return serialize(doc)
}

export async function markThreadRead(userId: string, threadKey: string) {
  const now = new Date()
  await ChatReadStateModel.findOneAndUpdate(
    { userId, threadKey },
    { $set: { lastReadAt: now } },
    { upsert: true, new: true },
  )

  if (threadKey.startsWith('direct:')) {
    const studentId = threadKey.replace('direct:', '')
    await DeskChatMessageModel.updateMany(
      {
        channel: 'direct',
        fromRole: 'student',
        fromUserId: studentId,
        readAt: { $exists: false },
      },
      { $set: { readAt: now } },
    )
  }

  return { threadKey, readAt: now.toISOString() }
}

export async function getThreadReadState(userId: string, threadKey: string) {
  const row = await ChatReadStateModel.findOne({ userId, threadKey })
  return row ? { lastReadAt: row.lastReadAt.toISOString() } : null
}

export { serialize as serializeDeskChatMessage }
