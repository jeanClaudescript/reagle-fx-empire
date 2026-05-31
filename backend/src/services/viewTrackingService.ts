import { UserContentViewModel } from '../models/UserContentView.js'
import type { ContentType } from '../types/engagement.js'

export async function hasUserViewed(userId: string, contentType: ContentType, contentId: string) {
  const doc = await UserContentViewModel.findOne({ userId, contentType, contentId }).lean()
  return Boolean(doc)
}

export async function trackContentView(input: {
  userId: string
  contentType: ContentType
  contentId: string
  metadata?: Record<string, unknown>
}) {
  const now = new Date()
  await UserContentViewModel.findOneAndUpdate(
    { userId: input.userId, contentType: input.contentType, contentId: input.contentId },
    { $set: { viewedAt: now, metadata: input.metadata }, $setOnInsert: { userId: input.userId, contentType: input.contentType, contentId: input.contentId } },
    { upsert: true, new: true },
  )
  return { ok: true as const, viewedAt: now.toISOString() }
}

export async function listRecentViews(userId: string, limit = 50) {
  const docs = await UserContentViewModel.find({ userId }).sort({ viewedAt: -1 }).limit(limit).lean()
  return docs.map((d) => ({
    contentType: d.contentType,
    contentId: d.contentId,
    viewedAt: d.viewedAt.toISOString(),
  }))
}

export async function filterUnseenContentIds(
  userId: string,
  contentType: ContentType,
  contentIds: string[],
) {
  if (contentIds.length === 0) return []
  const viewed = await UserContentViewModel.find({
    userId,
    contentType,
    contentId: { $in: contentIds },
  })
    .select('contentId')
    .lean()
  const seen = new Set(viewed.map((v) => v.contentId))
  return contentIds.filter((id) => !seen.has(id))
}
