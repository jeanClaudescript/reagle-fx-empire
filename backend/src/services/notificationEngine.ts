import { AppUserModel } from '../models/AppUser.js'
import type { ContentType, NotificationPriority } from '../types/engagement.js'

export type RelevanceInput = {
  pairs?: string[]
  topics?: string[]
  program?: 'forex' | 'crypto' | 'bundle'
  tags?: string[]
}

const PAIR_ALIASES: Record<string, string[]> = {
  gold: ['xau', 'gold', 'xauusd'],
  eurusd: ['eur', 'eurusd', 'eur/usd'],
  gbpusd: ['gbp', 'gbpusd', 'gbp/usd'],
  btc: ['btc', 'bitcoin', 'crypto'],
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function tokenMatchesInterest(token: string, interests: string[]) {
  const t = normalizeToken(token)
  for (const raw of interests) {
    const key = normalizeToken(raw)
    if (!key) continue
    if (t.includes(key) || key.includes(t)) return true
    const aliases = PAIR_ALIASES[key]
    if (aliases?.some((a) => t.includes(a) || a.includes(t))) return true
  }
  return false
}

export function calculateRelevanceScore(
  interests: { topics: string[]; pairs: string[]; tradingStyles: string[]; programFocus?: string },
  content: RelevanceInput,
  userProgram?: string,
): number {
  let score = 50
  const pool = [...interests.pairs, ...interests.topics, ...interests.tradingStyles]
  const contentTokens = [
    ...(content.pairs ?? []),
    ...(content.topics ?? []),
    ...(content.tags ?? []),
    content.program ?? '',
  ].filter(Boolean)

  for (const token of contentTokens) {
    if (tokenMatchesInterest(token, pool)) score += 12
  }

  if (userProgram && content.program) {
    const cp = content.program as string
    if (userProgram === 'bundle' || cp === 'both') score += 5
    else if (userProgram === cp) score += 15
    else score -= 20
  }

  if (interests.programFocus === 'crypto' && content.program === 'forex') score -= 15
  if (interests.programFocus === 'forex' && content.program === 'crypto') score -= 15

  return Math.max(0, Math.min(100, score))
}

export async function listPaidStudentIds(limit = 500) {
  const users = await AppUserModel.find({ role: 'student', membershipStatus: 'paid' })
    .select('_id programType')
    .limit(limit)
    .lean()
  return users.map((u) => ({
    id: String(u._id),
    programType: u.programType as 'forex' | 'crypto' | 'bundle' | undefined,
  }))
}

export function priorityForContentType(type: ContentType): NotificationPriority {
  switch (type) {
    case 'live_session':
    case 'announcement':
      return 1
    case 'lesson':
    case 'course':
    case 'video':
    case 'quiz':
    case 'exam':
    case 'recording':
    case 'book':
      return 2
    case 'coach_analysis':
    case 'trading_signal':
    case 'classroom':
    case 'coach_message':
    case 'community':
      return 3
    case 'forex_news':
    case 'daily_subject':
    case 'platform_update':
    case 'achievement':
    case 'recommendation':
    default:
      return 4
  }
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}
