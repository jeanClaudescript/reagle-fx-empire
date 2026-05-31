export type ContentType =
  | 'lesson'
  | 'course'
  | 'video'
  | 'quiz'
  | 'exam'
  | 'live_session'
  | 'trading_signal'
  | 'coach_analysis'
  | 'forex_news'
  | 'announcement'
  | 'daily_subject'
  | 'recording'
  | 'achievement'
  | 'recommendation'
  | 'platform_update'
  | 'classroom'
  | 'book'
  | 'community'
  | 'coach_message'

export type NotificationPriority = 1 | 2 | 3 | 4

export type DeliveryChannel = 'popup' | 'push' | 'center' | 'feed' | 'highlight' | 'banner'

export type LiveReminderKind = '24h' | '1h' | '15m' | 'live_started' | 'recording'

export const PRIORITY_CHANNELS: Record<NotificationPriority, DeliveryChannel[]> = {
  1: ['popup', 'push', 'center', 'highlight'],
  2: ['center', 'highlight'],
  3: ['feed'],
  4: ['feed'],
}

export const POPUP_COOLDOWN_MS = 4 * 60 * 60 * 1000
export const MAX_PUSH_PER_DAY = 3
