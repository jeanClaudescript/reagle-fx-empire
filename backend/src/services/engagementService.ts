import { NotificationModel } from '../models/Notification.js'
import { ActivityFeedItemModel } from '../models/ActivityFeedItem.js'
import { UserInterestModel } from '../models/UserInterest.js'
import { UserNotificationPreferencesModel } from '../models/UserNotificationPreferences.js'
import { PlatformUpdateModel } from '../models/PlatformUpdate.js'
import { AppUserModel } from '../models/AppUser.js'
import type { ContentType, NotificationPriority } from '../types/engagement.js'
import {
  MAX_PUSH_PER_DAY,
  POPUP_COOLDOWN_MS,
  PRIORITY_CHANNELS,
} from '../types/engagement.js'
import {
  calculateRelevanceScore,
  listPaidStudentIds,
  priorityForContentType,
  todayKey,
  type RelevanceInput,
} from './notificationEngine.js'
import { emitToDirectThread } from '../socket/io.js'
import { hasUserViewed } from './viewTrackingService.js'

function serializeNotification(doc: {
  _id: unknown
  userId: string
  contentType: ContentType
  contentId: string
  priority: NotificationPriority
  title: string
  body: string
  actionUrl?: string
  panelId?: string
  groupKey?: string
  dedupeKey: string
  relevanceScore: number
  metadata?: Record<string, unknown>
  readAt?: Date
  dismissedAt?: Date
  popupShownAt?: Date
  createdAt: Date
}) {
  return {
    id: String(doc._id),
    userId: doc.userId,
    contentType: doc.contentType,
    contentId: doc.contentId,
    priority: doc.priority,
    title: doc.title,
    body: doc.body,
    actionUrl: doc.actionUrl,
    panelId: doc.panelId,
    groupKey: doc.groupKey,
    dedupeKey: doc.dedupeKey,
    relevanceScore: doc.relevanceScore,
    metadata: doc.metadata,
    readAt: doc.readAt?.toISOString(),
    dismissedAt: doc.dismissedAt?.toISOString(),
    popupShownAt: doc.popupShownAt?.toISOString(),
    channels: PRIORITY_CHANNELS[doc.priority],
    createdAt: doc.createdAt.toISOString(),
  }
}

function serializeFeedItem(doc: {
  _id: unknown
  contentType: ContentType
  groupKey: string
  title: string
  body: string
  itemCount: number
  contentIds: string[]
  panelId?: string
  relevanceScore: number
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: String(doc._id),
    contentType: doc.contentType,
    groupKey: doc.groupKey,
    title: doc.title,
    body: doc.body,
    itemCount: doc.itemCount,
    contentIds: doc.contentIds,
    panelId: doc.panelId,
    relevanceScore: doc.relevanceScore,
    readAt: doc.readAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

async function getOrCreatePreferences(userId: string) {
  let prefs = await UserNotificationPreferencesModel.findOne({ userId })
  if (!prefs) {
    prefs = await UserNotificationPreferencesModel.create({
      userId,
      pushEnabled: true,
      popupEnabled: true,
      emailEnabled: false,
      mutedContentTypes: [],
      pushCountToday: 0,
      updatedAt: new Date(),
    })
  }
  const today = todayKey()
  if (prefs.pushCountDate !== today) {
    prefs.pushCountToday = 0
    prefs.pushCountDate = today
    prefs.updatedAt = new Date()
    await prefs.save()
  }
  return prefs
}

async function getOrCreateInterests(userId: string) {
  let doc = await UserInterestModel.findOne({ userId })
  if (!doc) {
    const user = await AppUserModel.findById(userId).lean()
    doc = await UserInterestModel.create({
      userId,
      topics: [],
      pairs: user?.programType === 'crypto' ? ['BTC', 'ETH'] : ['EUR/USD', 'XAU/USD'],
      tradingStyles: [],
      programFocus:
        user?.programType === 'crypto' ? 'crypto' : user?.programType === 'bundle' ? 'both' : 'forex',
      updatedAt: new Date(),
    })
  }
  return doc
}

async function canShowPopup(userId: string) {
  const prefs = await getOrCreatePreferences(userId)
  if (!prefs.popupEnabled) return false
  if (!prefs.lastPopupAt) return true
  return Date.now() - prefs.lastPopupAt.getTime() >= POPUP_COOLDOWN_MS
}

async function canSendPush(userId: string) {
  const prefs = await getOrCreatePreferences(userId)
  if (!prefs.pushEnabled) return false
  return prefs.pushCountToday < MAX_PUSH_PER_DAY
}

function emitNotificationToUser(userId: string, notification: ReturnType<typeof serializeNotification>, popup: boolean) {
  emitToDirectThread(userId, 'notification:new', {
    notification,
    popup,
    at: new Date().toISOString(),
  })
}

export async function deliverNotificationToUser(
  userId: string,
  input: {
    contentType: ContentType
    contentId: string
    title: string
    body: string
    dedupeKey: string
    priority?: NotificationPriority
    actionUrl?: string
    panelId?: string
    groupKey?: string
    metadata?: Record<string, unknown>
    relevance?: RelevanceInput
    skipIfViewed?: boolean
  },
) {
  if (input.skipIfViewed !== false) {
    const viewed = await hasUserViewed(userId, input.contentType, input.contentId)
    if (viewed) return null
  }

  const prefs = await getOrCreatePreferences(userId)
  if (prefs.mutedContentTypes.includes(input.contentType)) return null

  const interests = await getOrCreateInterests(userId)
  const user = await AppUserModel.findById(userId).select('programType').lean()
  const priority = input.priority ?? priorityForContentType(input.contentType)
  const relevanceScore = calculateRelevanceScore(
    interests,
    input.relevance ?? {},
    user?.programType,
  )

  if (relevanceScore < 25 && priority >= 3) return null

  const now = new Date()
  let doc
  try {
    doc = await NotificationModel.findOneAndUpdate(
      { userId, dedupeKey: input.dedupeKey },
      {
        $set: {
          contentType: input.contentType,
          contentId: input.contentId,
          priority,
          title: input.title,
          body: input.body,
          actionUrl: input.actionUrl,
          panelId: input.panelId,
          groupKey: input.groupKey,
          relevanceScore,
          metadata: input.metadata,
          updatedAt: now,
        },
        $setOnInsert: { userId, dedupeKey: input.dedupeKey, createdAt: now },
      },
      { upsert: true, new: true },
    )
  } catch {
    doc = await NotificationModel.findOne({ userId, dedupeKey: input.dedupeKey })
    if (!doc) return null
  }

  const serialized = serializeNotification(doc)
  const channels = PRIORITY_CHANNELS[priority]
  let popup = false

  if (channels.includes('popup') && (await canShowPopup(userId))) {
    popup = true
    prefs.lastPopupAt = now
    doc.popupShownAt = now
    await doc.save()
    await prefs.save()
  }

  if (channels.includes('push') && (await canSendPush(userId))) {
    prefs.pushCountToday += 1
    doc.pushSentAt = now
    await doc.save()
    await prefs.save()
  }

  emitNotificationToUser(userId, serialized, popup)
  return serialized
}

export async function upsertActivityFeedGroup(
  userId: string,
  input: {
    contentType: ContentType
    groupKey: string
    title: string
    body: string
    contentId: string
    panelId?: string
    relevance?: RelevanceInput
  },
) {
  const interests = await getOrCreateInterests(userId)
  const user = await AppUserModel.findById(userId).select('programType').lean()
  const relevanceScore = calculateRelevanceScore(interests, input.relevance ?? {}, user?.programType)
  if (relevanceScore < 20) return null

  const now = new Date()
  const doc = await ActivityFeedItemModel.findOneAndUpdate(
    { userId, groupKey: input.groupKey },
    {
      $set: {
        contentType: input.contentType,
        title: input.title,
        body: input.body,
        panelId: input.panelId,
        relevanceScore,
        updatedAt: now,
        readAt: undefined,
      },
      $inc: { itemCount: 1 },
      $addToSet: { contentIds: input.contentId },
      $setOnInsert: { userId, groupKey: input.groupKey, createdAt: now },
    },
    { upsert: true, new: true },
  )

  return serializeFeedItem(doc)
}

export async function fanOutToPaidStudents(
  build: (user: { id: string; programType?: string }) => {
    dedupeKey: string
    contentType: ContentType
    contentId: string
    title: string
    body: string
    actionUrl?: string
    panelId?: string
    groupKey?: string
    priority?: NotificationPriority
    relevance?: RelevanceInput
    feedOnly?: boolean
  } | null,
) {
  const students = await listPaidStudentIds()
  const results = []
  for (const student of students) {
    const payload = build(student)
    if (!payload) continue
    if (payload.feedOnly || (payload.priority ?? priorityForContentType(payload.contentType)) >= 3) {
      const feed = await upsertActivityFeedGroup(student.id, {
        contentType: payload.contentType,
        groupKey: payload.groupKey ?? payload.dedupeKey,
        title: payload.title,
        body: payload.body,
        contentId: payload.contentId,
        panelId: payload.panelId,
        relevance: payload.relevance,
      })
      if (feed) results.push(feed)
    } else {
      const n = await deliverNotificationToUser(student.id, payload)
      if (n) results.push(n)
    }
  }
  return results
}

export async function listNotifications(userId: string, limit = 40) {
  const docs = await NotificationModel.find({ userId, dismissedAt: { $exists: false } })
    .sort({ readAt: 1, priority: 1, relevanceScore: -1, createdAt: -1 })
    .limit(limit)
    .lean()
  return docs.map((d) => serializeNotification(d as never))
}

export async function listActivityFeed(userId: string, limit = 30) {
  const docs = await ActivityFeedItemModel.find({ userId })
    .sort({ readAt: 1, relevanceScore: -1, updatedAt: -1 })
    .limit(limit)
    .lean()
  return docs.map((d) => serializeFeedItem(d as never))
}

export async function getUnreadCounts(userId: string) {
  const [center, feed] = await Promise.all([
    NotificationModel.countDocuments({ userId, readAt: { $exists: false }, dismissedAt: { $exists: false } }),
    ActivityFeedItemModel.countDocuments({ userId, readAt: { $exists: false } }),
  ])
  return { center, feed, total: center + feed }
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const doc = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, userId },
    { readAt: new Date(), updatedAt: new Date() },
    { new: true },
  )
  if (!doc) throw new Error('Notification not found')
  return serializeNotification(doc)
}

export async function markAllNotificationsRead(userId: string) {
  const now = new Date()
  await NotificationModel.updateMany(
    { userId, readAt: { $exists: false } },
    { readAt: now, updatedAt: now },
  )
  await ActivityFeedItemModel.updateMany({ userId, readAt: { $exists: false } }, { readAt: now, updatedAt: now })
  return { ok: true }
}

export async function dismissNotification(userId: string, notificationId: string) {
  const doc = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, userId },
    { dismissedAt: new Date(), readAt: new Date(), updatedAt: new Date() },
    { new: true },
  )
  if (!doc) throw new Error('Notification not found')
  return serializeNotification(doc)
}

export async function getPreferences(userId: string) {
  const prefs = await getOrCreatePreferences(userId)
  return {
    pushEnabled: prefs.pushEnabled,
    popupEnabled: prefs.popupEnabled,
    emailEnabled: prefs.emailEnabled,
    mutedContentTypes: prefs.mutedContentTypes,
    lastSeenUpdateAt: prefs.lastSeenUpdateAt?.toISOString() ?? null,
    lastDailySubjectAt: prefs.lastDailySubjectAt ?? null,
  }
}

export async function updatePreferences(
  userId: string,
  input: Partial<{
    pushEnabled: boolean
    popupEnabled: boolean
    emailEnabled: boolean
    mutedContentTypes: string[]
  }>,
) {
  const prefs = await getOrCreatePreferences(userId)
  if (input.pushEnabled != null) prefs.pushEnabled = input.pushEnabled
  if (input.popupEnabled != null) prefs.popupEnabled = input.popupEnabled
  if (input.emailEnabled != null) prefs.emailEnabled = input.emailEnabled
  if (input.mutedContentTypes != null) prefs.mutedContentTypes = input.mutedContentTypes
  prefs.updatedAt = new Date()
  await prefs.save()
  return getPreferences(userId)
}

export async function getInterests(userId: string) {
  const doc = await getOrCreateInterests(userId)
  return {
    topics: doc.topics,
    pairs: doc.pairs,
    tradingStyles: doc.tradingStyles,
    programFocus: doc.programFocus,
    updatedAt: doc.updatedAt.toISOString(),
  }
}

export async function updateInterests(
  userId: string,
  input: Partial<{ topics: string[]; pairs: string[]; tradingStyles: string[]; programFocus: 'forex' | 'crypto' | 'both' }>,
) {
  const doc = await getOrCreateInterests(userId)
  if (input.topics != null) doc.topics = input.topics.map((t) => t.trim()).filter(Boolean)
  if (input.pairs != null) doc.pairs = input.pairs.map((t) => t.trim()).filter(Boolean)
  if (input.tradingStyles != null) doc.tradingStyles = input.tradingStyles.map((t) => t.trim()).filter(Boolean)
  if (input.programFocus != null) doc.programFocus = input.programFocus
  doc.updatedAt = new Date()
  await doc.save()
  return getInterests(userId)
}

export async function getDashboardHighlights(userId: string) {
  const now = new Date()
  const [notifications, feed] = await Promise.all([
    NotificationModel.find({
      userId,
      readAt: { $exists: false },
      dismissedAt: { $exists: false },
      priority: { $lte: 2 },
    })
      .sort({ priority: 1, createdAt: -1 })
      .limit(8)
      .lean(),
    ActivityFeedItemModel.find({ userId, readAt: { $exists: false } })
      .sort({ relevanceScore: -1, updatedAt: -1 })
      .limit(5)
      .lean(),
  ])

  return {
    generatedAt: now.toISOString(),
    highlights: notifications.map((d) => serializeNotification(d as never)),
    feedPreview: feed.map((d) => serializeFeedItem(d as never)),
  }
}

export async function getWhatsNew(userId: string) {
  const prefs = await getOrCreatePreferences(userId)
  const latest = await PlatformUpdateModel.findOne().sort({ publishedAt: -1 }).lean()
  if (!latest) return { hasNew: false, update: null }

  const lastSeen = prefs.lastSeenUpdateAt?.getTime() ?? 0
  const hasNew = latest.publishedAt.getTime() > lastSeen

  return {
    hasNew,
    update: {
      version: latest.version,
      title: latest.title,
      summary: latest.summary,
      items: latest.items,
      publishedAt: latest.publishedAt.toISOString(),
    },
  }
}

export async function markWhatsNewSeen(userId: string) {
  const latest = await PlatformUpdateModel.findOne().sort({ publishedAt: -1 }).lean()
  const prefs = await getOrCreatePreferences(userId)
  prefs.lastSeenUpdateAt = latest?.publishedAt ?? new Date()
  prefs.updatedAt = new Date()
  await prefs.save()
  return { ok: true }
}

export async function publishPlatformUpdate(input: {
  version: string
  title: string
  summary: string
  items: { contentType: ContentType; contentId: string; title: string; summary?: string }[]
}) {
  const doc = await PlatformUpdateModel.findOneAndUpdate(
    { version: input.version },
    {
      title: input.title,
      summary: input.summary,
      items: input.items,
      publishedAt: new Date(),
      createdAt: new Date(),
    },
    { upsert: true, new: true },
  )

  await fanOutToPaidStudents(() => ({
    dedupeKey: `platform-update:${input.version}`,
    contentType: 'platform_update',
    contentId: input.version,
    title: input.title,
    body: input.summary || 'New content and features are available.',
    actionUrl: '/desk',
    panelId: 'overview',
    priority: 2,
  }))

  return doc
}

export async function recordDailySubjectShown(userId: string, subjectId: string) {
  const prefs = await getOrCreatePreferences(userId)
  prefs.lastDailySubjectAt = `${todayKey()}:${subjectId}`
  prefs.updatedAt = new Date()
  await prefs.save()
}

export async function shouldShowDailySubject(userId: string, subjectId: string) {
  const prefs = await getOrCreatePreferences(userId)
  return prefs.lastDailySubjectAt !== `${todayKey()}:${subjectId}`
}

export {
  serializeNotification,
  serializeFeedItem,
  getOrCreatePreferences,
  getOrCreateInterests,
}
