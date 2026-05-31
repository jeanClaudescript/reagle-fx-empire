import type { CMSData } from '../types/cms.js'
import {
  fanOutToPaidStudents,
  publishPlatformUpdate,
  deliverNotificationToUser,
} from './engagementService.js'
import {
  notifyLiveSessionStarted,
  notifyRecordingAvailable,
  scheduleLiveSessionReminders,
  cancelRemindersForSession,
  findRecordingForRoom,
} from './liveReminderService.js'

export async function onLiveSessionCreated(session: {
  id: string
  title: string
  pair: string
  scheduledAt?: string
}) {
  if (session.scheduledAt) {
    await scheduleLiveSessionReminders(session.id, new Date(session.scheduledAt), session.title)
  }
}

export async function onLiveSessionUpdated(session: {
  id: string
  title: string
  pair: string
  scheduledAt?: string
}) {
  if (session.scheduledAt) {
    await scheduleLiveSessionReminders(session.id, new Date(session.scheduledAt), session.title)
  }
}

export async function onLiveSessionStatusChanged(
  session: { id: string; title: string; pair: string; status: string },
  prevStatus?: string,
) {
  if (session.status === 'live' && prevStatus !== 'live') {
    await notifyLiveSessionStarted(session.id, session.title, session.pair)
  }
  if (session.status === 'ended') {
    await cancelRemindersForSession(session.id)
  }
}

export async function onLiveSignalBatch(session: {
  id: string
  title: string
  pair: string
  signalSide?: string
}) {
  if (!session.signalSide || session.signalSide === 'neutral') return

  await fanOutToPaidStudents((student) => ({
    dedupeKey: `signals:${session.id}:${new Date().toISOString().slice(0, 13)}`,
    contentType: 'trading_signal',
    contentId: session.id,
    groupKey: `signals:${session.id}`,
    title: '📈 New Trading Signals Available',
    body: 'New updates from Coach — view the signal board.',
    panelId: 'signals',
    priority: 3,
    feedOnly: true,
    relevance: { pairs: [session.pair], topics: ['signal', session.title] },
  }))
}

export async function onCoachAnalysisBatch(analyses: { id: string; pair: string; title: string }[]) {
  if (!analyses.length) return
  const count = analyses.length
  await fanOutToPaidStudents(() => ({
    dedupeKey: `analysis:${analyses.map((a) => a.id).join('-')}`,
    contentType: 'coach_analysis',
    contentId: analyses[0].id,
    groupKey: `coach-analysis:${new Date().toISOString().slice(0, 10)}`,
    title: `📊 Coach Posted ${count} New Market Analyses`,
    body: analyses.map((a) => a.title).slice(0, 3).join(' · '),
    panelId: 'news',
    priority: 3,
    feedOnly: true,
    relevance: { pairs: analyses.map((a) => a.pair) },
  }))
}

export async function onCmsPublished(cms: CMSData, prev?: CMSData) {
  const items: { contentType: 'book' | 'video' | 'lesson'; contentId: string; title: string; summary?: string }[] = []

  const prevBookIds = new Set((prev?.vipBooks ?? []).map((b) => b.id))
  for (const book of cms.vipBooks ?? []) {
    if (!prevBookIds.has(book.id)) {
      items.push({ contentType: 'book', contentId: book.id, title: book.title, summary: book.description })
    }
  }

  const prevVideoIds = new Set((prev?.teachingVideos ?? []).map((v) => v.id))
  for (const video of cms.teachingVideos ?? []) {
    if (!prevVideoIds.has(video.id)) {
      items.push({ contentType: 'video', contentId: video.id, title: video.label })
    }
  }

  if (items.length === 0) return

  const version = `cms-${Date.now()}`
  await publishPlatformUpdate({
    version,
    title: "✨ What's New",
    summary: `${items.length} new item${items.length === 1 ? '' : 's'} published.`,
    items,
  })

  for (const item of items) {
    await fanOutToPaidStudents(() => ({
      dedupeKey: `${item.contentType}:${item.contentId}`,
      contentType: item.contentType,
      contentId: item.contentId,
      title: item.contentType === 'book' ? 'New VIP Book' : 'New Video Lesson',
      body: item.title,
      panelId: item.contentType === 'book' ? 'books' : 'overview',
      priority: 2,
      relevance: { topics: [item.title] },
    }))
  }
}

export async function onClassroomEnded(room: { id: string; title: string }) {
  const recording = await findRecordingForRoom(room.id)
  if (recording) {
    await notifyRecordingAvailable(room.id, room.title, String(recording._id))
  }
}

export async function onCriticalAnnouncement(input: {
  id: string
  title: string
  body: string
}) {
  await fanOutToPaidStudents(() => ({
    dedupeKey: `announcement:${input.id}`,
    contentType: 'announcement',
    contentId: input.id,
    title: input.title,
    body: input.body,
    priority: 1,
    panelId: 'overview',
  }))
}

export async function onForexNewsDigest(headlines: string[]) {
  if (!headlines.length) return
  const body = headlines.slice(0, 4).map((h) => `• ${h}`).join('\n')
  await fanOutToPaidStudents(() => ({
    dedupeKey: `forex-news:${new Date().toISOString().slice(0, 10)}`,
    contentType: 'forex_news',
    contentId: todayVersion(),
    groupKey: `forex-news:${new Date().toISOString().slice(0, 10)}`,
    title: '📰 Forex News Summary',
    body,
    panelId: 'news',
    priority: 4,
    feedOnly: true,
  }))
}

function todayVersion() {
  return new Date().toISOString().slice(0, 10)
}

export async function deliverDailySubject(userId: string, subject: { id: string; title: string; summary?: string }) {
  return deliverNotificationToUser(userId, {
    contentType: 'daily_subject',
    contentId: subject.id,
    title: '📚 Subject Of The Day',
    body: subject.summary ?? subject.title,
    dedupeKey: `daily-subject:${todayVersion()}:${subject.id}`,
    priority: 2,
    panelId: 'overview',
    relevance: { topics: [subject.title] },
  })
}
