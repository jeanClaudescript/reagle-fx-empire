import { motion } from 'framer-motion'
import {
  BookOpen,
  GraduationCap,
  MessageCircle,
  Radio,
  Target,
  ChevronRight,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useVipActivity } from '@/vip/VipActivityProvider'
import type { VipActivityItem, VipActivityKind } from '@/vip/useVipActivityFeed'
import type { VipPanelId } from '@/components/student/vip/VipDeskShell'
import { VipSignalCard } from '@/components/student/vip/VipSignalCard'

function relativeTime(at: number, t: ReturnType<typeof useLanguage>['t']) {
  const diff = Date.now() - at
  if (diff < 60_000) return t.vip.timeJustNow
  if (diff < 3_600_000) return t.vip.timeMinutesAgo.replace('{n}', String(Math.floor(diff / 60_000)))
  if (diff < 86_400_000) return t.vip.timeHoursAgo.replace('{n}', String(Math.floor(diff / 3_600_000)))
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function iconFor(kind: VipActivityKind) {
  switch (kind) {
    case 'live':
      return Radio
    case 'classroom':
      return GraduationCap
    case 'community':
    case 'coach':
      return MessageCircle
    case 'book':
      return BookOpen
    case 'signal':
      return Target
    default:
      return Radio
  }
}

function labelFor(item: VipActivityItem, t: ReturnType<typeof useLanguage>['t']) {
  switch (item.kind) {
    case 'live':
      return t.vip.activityLive
    case 'classroom':
      return t.vip.activityClassroom
    case 'community':
      return t.vip.activityCommunity
    case 'coach':
      return t.vip.activityCoach
    case 'book':
      return t.vip.activityBook
    case 'signal':
      return t.vip.activitySignal
    default:
      return t.vip.activityUpdate
  }
}

function ActivityRow({
  item,
  onNavigate,
  t,
}: {
  item: VipActivityItem
  onNavigate: (id: VipPanelId) => void
  t: ReturnType<typeof useLanguage>['t']
}) {
  const Icon = iconFor(item.kind)

  if (item.kind === 'signal' && item.session) {
    return (
      <li>
        <div className="vip-activity-signal-wrap">
          <VipSignalCard session={item.session} compact showShare={false} />
          <button type="button" className="vip-activity-open-btn" onClick={() => onNavigate(item.panelId)}>
            {t.vip.viewSignal}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </li>
    )
  }

  return (
    <li>
      <motion.button
        type="button"
        layout
        className={`vip-activity-row ${item.isLive ? 'vip-activity-row--live' : ''} ${item.isNew ? 'vip-activity-row--new' : ''}`}
        onClick={() => onNavigate(item.panelId)}
      >
        <span className={`vip-activity-row__icon vip-activity-row__icon--${item.kind}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-theme-primary">{labelFor(item, t)}</span>
            {item.fromName ? (
              <span className="text-[10px] font-medium text-theme-muted">· {item.fromName}</span>
            ) : null}
            {item.isLive ? (
              <span className="vip-activity-live-pill">{t.vip.activityLiveNow}</span>
            ) : item.isNew ? (
              <span className="vip-activity-new-pill">{t.vip.activityNew}</span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-xs text-theme-muted">{item.preview}</span>
        </span>
        <span className="shrink-0 text-[10px] font-medium text-theme-muted">{relativeTime(item.at, t)}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-theme-muted" />
      </motion.button>
    </li>
  )
}

export function VipActivityFeed({ onNavigate }: { onNavigate: (id: VipPanelId) => void }) {
  const { t } = useLanguage()
  const { items, totalUnread, activeSignal } = useVipActivity()

  const feed = items.filter((i) => i.isNew || i.isLive)

  return (
    <div className="vip-activity-feed">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-theme-primary">{t.vip.activityTitle}</h3>
        {totalUnread > 0 ? <span className="vip-activity-badge">{totalUnread}</span> : null}
      </div>
      <p className="mt-1 text-sm text-theme-muted">{t.vip.activitySubtitle}</p>

      {activeSignal ? (
        <div className="mt-4">
          <VipSignalCard session={activeSignal} />
          <button type="button" className="vip-activity-open-btn mt-2" onClick={() => onNavigate('signals')}>
            {t.vip.openSignalBoard}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {feed.length === 0 && !activeSignal ? (
        <div className="vip-activity-empty mt-4">
          <p className="text-sm font-semibold text-theme-primary">{t.vip.activityAllCaughtUp}</p>
          <p className="mt-1 text-xs text-theme-muted">{t.vip.activityAllCaughtUpHint}</p>
        </div>
      ) : feed.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {feed
            .filter((item) => !(item.kind === 'signal' && activeSignal))
            .map((item) => (
              <ActivityRow key={item.id} item={item} onNavigate={onNavigate} t={t} />
            ))}
        </ul>
      ) : null}
    </div>
  )
}
