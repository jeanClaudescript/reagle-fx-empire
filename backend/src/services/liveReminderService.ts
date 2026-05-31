import { LiveSessionReminderModel } from '../models/LiveSessionReminder.js'
import { LiveSessionModel } from '../models/LiveSession.js'
import { ClassroomRecordingModel } from '../models/ClassroomRecording.js'
import type { LiveReminderKind } from '../types/engagement.js'
import { listPaidStudentIds } from './notificationEngine.js'
import { deliverNotificationToUser } from './engagementService.js'

const REMINDER_OFFSETS: { kind: LiveReminderKind; ms: number }[] = [
  { kind: '24h', ms: 24 * 60 * 60 * 1000 },
  { kind: '1h', ms: 60 * 60 * 1000 },
  { kind: '15m', ms: 15 * 60 * 1000 },
]

function reminderCopy(kind: LiveReminderKind, title: string) {
  switch (kind) {
    case '24h':
      return { title: '🔔 Live Session Tomorrow', body: `${title} starts in 24 hours.` }
    case '1h':
      return { title: '⏰ Starts In One Hour', body: `${title} begins in 1 hour.` }
    case '15m':
      return { title: '🚀 Starts In 15 Minutes', body: `${title} begins in 15 minutes.` }
    case 'live_started':
      return { title: '🔴 Session Is Live', body: `${title} — join now.` }
    case 'recording':
      return { title: '📼 Watch Recording', body: `Recording available for ${title}.` }
    default:
      return { title: 'Live Session', body: title }
  }
}

export async function cancelRemindersForSession(sessionId: string, userId?: string) {
  const filter: Record<string, unknown> = { sessionId, cancelledAt: { $exists: false }, sentAt: { $exists: false } }
  if (userId) filter.userId = userId
  await LiveSessionReminderModel.updateMany(filter, { cancelledAt: new Date() })
}

export async function cancelRemindersForUserSession(userId: string, sessionId: string) {
  return cancelRemindersForSession(sessionId, userId)
}

export async function scheduleLiveSessionReminders(sessionId: string, scheduledAt: Date, sessionTitle: string) {
  await cancelRemindersForSession(sessionId)
  const students = await listPaidStudentIds()
  const now = Date.now()
  const startMs = scheduledAt.getTime()
  if (startMs <= now) return

  const ops = []
  for (const student of students) {
    for (const { kind, ms } of REMINDER_OFFSETS) {
      const fireAt = new Date(startMs - ms)
      if (fireAt.getTime() <= now) continue
      ops.push({
        updateOne: {
          filter: { userId: student.id, sessionId, reminderKind: kind },
          update: {
            $set: { fireAt, cancelledAt: undefined, sentAt: undefined },
            $setOnInsert: { userId: student.id, sessionId, reminderKind: kind, createdAt: new Date() },
          },
          upsert: true,
        },
      })
    }
  }
  if (ops.length) await LiveSessionReminderModel.bulkWrite(ops, { ordered: false })

  void sessionTitle
}

export async function processDueLiveReminders() {
  const now = new Date()
  const due = await LiveSessionReminderModel.find({
    fireAt: { $lte: now },
    sentAt: { $exists: false },
    cancelledAt: { $exists: false },
  })
    .limit(100)
    .lean()

  for (const reminder of due) {
    const session = await LiveSessionModel.findById(reminder.sessionId).lean()
    if (!session) {
      await LiveSessionReminderModel.updateOne({ _id: reminder._id }, { cancelledAt: new Date() })
      continue
    }
    if (session.status === 'ended') {
      await LiveSessionReminderModel.updateOne({ _id: reminder._id }, { cancelledAt: new Date() })
      continue
    }
    if (session.status === 'live' && reminder.reminderKind !== 'live_started') {
      await LiveSessionReminderModel.updateOne({ _id: reminder._id }, { cancelledAt: new Date() })
      continue
    }

    const copy = reminderCopy(reminder.reminderKind, session.title)
    await deliverNotificationToUser(reminder.userId, {
      contentType: 'live_session',
      contentId: reminder.sessionId,
      title: copy.title,
      body: copy.body,
      dedupeKey: `live-reminder:${reminder.sessionId}:${reminder.reminderKind}`,
      priority: reminder.reminderKind === 'live_started' || reminder.reminderKind === '15m' ? 1 : 2,
      actionUrl: '/desk',
      panelId: 'live',
      metadata: { reminderKind: reminder.reminderKind },
      relevance: { pairs: [session.pair], topics: [session.title] },
    })

    await LiveSessionReminderModel.updateOne({ _id: reminder._id }, { sentAt: new Date() })
  }
}

export async function notifyLiveSessionStarted(sessionId: string, title: string, pair: string) {
  await cancelRemindersForSession(sessionId)
  const students = await listPaidStudentIds()
  for (const student of students) {
    await deliverNotificationToUser(student.id, {
      contentType: 'live_session',
      contentId: sessionId,
      title: '🔴 Session Is Live',
      body: `${title} — join now.`,
      dedupeKey: `live-started:${sessionId}`,
      priority: 1,
      actionUrl: '/desk',
      panelId: 'live',
      relevance: { pairs: [pair], topics: [title] },
    })
  }
}

export async function notifyRecordingAvailable(sessionId: string, title: string, recordingId: string) {
  const students = await listPaidStudentIds()
  for (const student of students) {
    await deliverNotificationToUser(student.id, {
      contentType: 'recording',
      contentId: recordingId,
      title: '📼 Watch Recording',
      body: `Recording available for ${title}.`,
      dedupeKey: `recording:${recordingId}`,
      priority: 2,
      actionUrl: '/desk',
      panelId: 'classroom',
      relevance: { topics: [title] },
    })
  }
  void sessionId
}

export async function onStudentJoinedLiveSession(userId: string, sessionId: string) {
  await cancelRemindersForUserSession(userId, sessionId)
}

export async function findRecordingForRoom(roomId: string) {
  return ClassroomRecordingModel.findOne({ roomId }).sort({ createdAt: -1 }).lean()
}
