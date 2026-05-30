import { DeskChatMessageModel } from '../models/DeskChatMessage.js'

function serialize(doc: {
  _id: unknown
  channel: string
  fromUserId: string
  fromUserName: string
  fromRole: string
  toUserId?: string
  message: string
  createdAt: Date
}) {
  return {
    id: String(doc._id),
    channel: doc.channel,
    fromUserId: doc.fromUserId,
    fromUserName: doc.fromUserName,
    fromRole: doc.fromRole,
    toUserId: doc.toUserId,
    message: doc.message,
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
    const existing = map.get(studentId)
    if (!existing) {
      map.set(studentId, {
        studentId,
        studentName: row.fromRole === 'student' ? row.fromUserName : 'Student',
        lastMessage: row.message,
        lastAt: row.createdAt.toISOString(),
        count: 1,
      })
    } else {
      existing.count += 1
    }
  }

  return Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt))
}

export async function saveDeskChatMessage(input: {
  channel: 'vip-community' | 'direct'
  fromUserId: string
  fromUserName: string
  fromRole: 'admin' | 'student'
  toUserId?: string
  message: string
}) {
  const text = input.message.trim()
  if (!text) throw new Error('Message is required')
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
    createdAt: new Date(),
  })
  return serialize(doc)
}
