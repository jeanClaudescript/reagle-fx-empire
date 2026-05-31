import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Loader2, Radio, Target } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { educationApi } from '@/services/api'
import { useEngagement } from '@/engagement/EngagementProvider'
import { useVipActivity } from '@/vip/VipActivityProvider'
import { isSignalNew } from '@/vip/vipSignalTracking'
import type { VipPanelId } from '@/components/student/vip/VipDeskShell'

type NextItem = {
  id: string
  title: string
  body: string
  cta: string
  panel: VipPanelId
  priority: number
  live?: boolean
}

export function VipNextActions({ onNavigate }: { onNavigate: (id: VipPanelId) => void }) {
  const { t } = useLanguage()
  const { items, activeSignal } = useVipActivity()
  const { highlights, recommendations, unread } = useEngagement()
  const [lessonTitle, setLessonTitle] = useState<string | null>(null)
  const [lessonDone, setLessonDone] = useState(false)
  const [loadingLesson, setLoadingLesson] = useState(true)

  const liveOn = items.some((i) => i.kind === 'live' && i.isLive)
  const classroomOn = items.some((i) => i.kind === 'classroom' && i.isLive)
  const signalNew = Boolean(activeSignal && isSignalNew(activeSignal))

  useEffect(() => {
    educationApi
      .todayLesson()
      .then((res) => {
        setLessonTitle(res.data.lesson?.title ?? null)
        setLessonDone(res.data.completed)
      })
      .catch(() => setLessonTitle(null))
      .finally(() => setLoadingLesson(false))
  }, [])

  const actions: NextItem[] = []

  if (liveOn) {
    actions.push({
      id: 'live',
      title: t.vip.quickLive,
      body: 'Coach is live now — join the room.',
      cta: 'Join live',
      panel: 'live',
      priority: 100,
      live: true,
    })
  }

  if (classroomOn) {
    actions.push({
      id: 'classroom',
      title: t.classroom.navTitle,
      body: 'Trading classroom is active.',
      cta: 'Enter classroom',
      panel: 'classroom',
      priority: 95,
      live: true,
    })
  }

  if (signalNew && activeSignal) {
    actions.push({
      id: 'signals',
      title: t.vip.quickSignals,
      body: `New setup on ${activeSignal.pair ?? 'market'}.`,
      cta: 'View signal',
      panel: 'signals',
      priority: 90,
      live: true,
    })
  }

  if (!lessonDone && lessonTitle) {
    actions.push({
      id: 'lesson',
      title: t.dailyLessons.title,
      body: lessonTitle,
      cta: t.dailyLessons.todayTab,
      panel: 'daily-lessons',
      priority: 80,
    })
  } else if (!loadingLesson && !lessonDone) {
    actions.push({
      id: 'lesson-empty',
      title: t.dailyLessons.title,
      body: t.dailyLessons.noLesson,
      cta: t.dailyLessons.navTitle,
      panel: 'daily-lessons',
      priority: 50,
    })
  }

  const topHighlight = highlights?.highlights?.[0]
  if (topHighlight?.panelId) {
    actions.push({
      id: `hl-${topHighlight.id}`,
      title: topHighlight.title,
      body: topHighlight.body,
      cta: 'Open',
      panel: topHighlight.panelId as VipPanelId,
      priority: 70,
    })
  }

  const nextRec = recommendations?.nextModule
  if (nextRec) {
    actions.push({
      id: 'rec',
      title: nextRec.title,
      body: nextRec.reason,
      cta: 'Continue',
      panel: (nextRec.id as VipPanelId) || 'overview',
      priority: 60,
    })
  }

  if (unread.total > 0) {
    actions.push({
      id: 'notifications',
      title: 'Unread updates',
      body: `${unread.total} new notification${unread.total === 1 ? '' : 's'}`,
      cta: 'Review',
      panel: 'overview',
      priority: 55,
    })
  }

  actions.sort((a, b) => b.priority - a.priority)
  const primary = actions[0]
  const secondary = actions.slice(1, 4)

  if (loadingLesson && !primary) {
    return (
      <div className="vip-next-actions vip-next-actions--loading">
        <Loader2 className="h-5 w-5 animate-spin text-theme-muted" />
      </div>
    )
  }

  if (!primary) {
    return (
      <div className="vip-next-actions">
        <p className="text-sm text-theme-muted">You&apos;re caught up. Explore tools or review the chart.</p>
        <button type="button" className="vip-next-actions__secondary" onClick={() => onNavigate('chart')}>
          <Target className="h-4 w-4" />
          Open chart
        </button>
      </div>
    )
  }

  return (
    <section className="vip-next-actions">
      <p className="vip-next-actions__label">Recommended next step</p>
      <button type="button" className="vip-next-actions__primary" onClick={() => onNavigate(primary.panel)}>
        <span className="vip-next-actions__primary-icon">
          {primary.id === 'lesson' || primary.id === 'lesson-empty' ? (
            <BookOpen className="h-5 w-5" />
          ) : primary.live ? (
            <Radio className="h-5 w-5" />
          ) : (
            <Target className="h-5 w-5" />
          )}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="flex items-center gap-2">
            <strong className="font-display text-lg">{primary.title}</strong>
            {primary.live ? <span className="vip-activity-live-pill">{t.vip.activityLiveNow}</span> : null}
          </span>
          <span className="mt-1 block text-sm opacity-90 line-clamp-2">{primary.body}</span>
        </span>
        <span className="vip-next-actions__cta">
          {primary.cta}
          <ArrowRight className="h-4 w-4" />
        </span>
      </button>

      {secondary.length > 0 ? (
        <ul className="vip-next-actions__list">
          {secondary.map((item) => (
            <li key={item.id}>
              <button type="button" className="vip-next-actions__secondary" onClick={() => onNavigate(item.panel)}>
                <span className="font-medium text-theme-primary">{item.title}</span>
                <span className="text-xs text-theme-muted line-clamp-1">{item.body}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
