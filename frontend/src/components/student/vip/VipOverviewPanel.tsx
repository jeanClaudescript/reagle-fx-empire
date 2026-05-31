import { useEffect, useState } from 'react'
import { ChevronDown, GraduationCap, LineChart, Radio, Target } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { VipActivityFeed } from '@/components/student/vip/VipActivityFeed'
import { VipLearningPath } from '@/components/student/vip/VipLearningPath'
import { VipNextActions } from '@/components/student/vip/VipNextActions'
import { VipPhysicalClassCard } from '@/components/student/vip/VipPhysicalClassCard'
import { DashboardHighlights } from '@/components/engagement/DashboardHighlights'
import { RecommendationWidgets } from '@/components/engagement/RecommendationWidgets'
import { useVipActivity } from '@/vip/VipActivityProvider'
import { isSignalNew } from '@/vip/vipSignalTracking'
import type { VipPanelId } from '@/components/student/vip/VipDeskShell'

const CHECKLIST_KEY = 'rfx_vip_checklist'

const DEFAULT_CHECKS = [
  { id: 'session', key: 'checkSession' as const },
  { id: 'risk', key: 'checkRisk' as const },
  { id: 'news', key: 'checkNews' as const },
  { id: 'plan', key: 'checkPlan' as const },
]

export function VipOverviewPanel({ onNavigate }: { onNavigate: (id: VipPanelId) => void }) {
  const { t } = useLanguage()
  const { contact } = useStudentAccess()
  const { items, activeSignal, unreadByPanel } = useVipActivity()
  const [checks, setChecks] = useState<Record<string, boolean>>({})

  const liveOn = items.some((i) => i.kind === 'live' && i.isLive)
  const classroomOn = items.some((i) => i.kind === 'classroom' && i.isLive)
  const signalNew = Boolean(activeSignal && isSignalNew(activeSignal))

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY)
      if (raw) setChecks(JSON.parse(raw) as Record<string, boolean>)
    } catch {
      /* ignore */
    }
  }, [])

  const toggleCheck = (id: string) => {
    setChecks((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next))
      return next
    })
  }

  const doneCount = DEFAULT_CHECKS.filter((c) => checks[c.id]).length

  const tiles = [
    {
      id: 'live' as const,
      label: t.vip.quickLive,
      icon: Radio,
      live: liveOn,
      badge: unreadByPanel.live,
    },
    {
      id: 'signals' as const,
      label: t.vip.quickSignals,
      icon: Target,
      live: signalNew,
      badge: unreadByPanel.signals,
    },
    {
      id: 'chart' as const,
      label: t.vip.quickChart,
      icon: LineChart,
      live: false,
      badge: 0,
    },
    {
      id: 'classroom' as const,
      label: t.vip.quickClassroom,
      icon: GraduationCap,
      live: classroomOn,
      badge: unreadByPanel.classroom,
    },
  ]

  return (
    <div className="vip-overview">
      <div className="vip-overview__hero vip-overview__hero--compact">
        <p className="text-sm text-theme-muted">{t.vip.welcome}</p>
        <h2 className="mt-0.5 font-display text-xl font-bold text-theme-primary sm:text-2xl">
          {contact?.name || t.vip.traderFallback}
        </h2>
      </div>

      <VipNextActions onNavigate={onNavigate} />

      <div className="vip-overview__grid">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <button
              key={tile.id}
              type="button"
              className={`vip-stat-card ${tile.live ? 'vip-stat-card--live' : ''}`}
              onClick={() => onNavigate(tile.id)}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-theme-accent" />
                <span className="font-semibold text-theme-primary">{tile.label}</span>
                {tile.live ? <span className="vip-activity-live-pill">{t.vip.activityLiveNow}</span> : null}
                {tile.badge ? <span className="vip-activity-badge">{tile.badge}</span> : null}
              </span>
            </button>
          )
        })}
      </div>

      <VipPhysicalClassCard />

      <DashboardHighlights onNavigate={onNavigate} />
      <RecommendationWidgets onNavigate={onNavigate} />

      <details className="vip-overview__collapse">
        <summary className="vip-overview__collapse-head">
          Learning path
          <ChevronDown className="h-4 w-4" />
        </summary>
        <VipLearningPath onNavigate={onNavigate} />
      </details>

      <details className="vip-overview__collapse">
        <summary className="vip-overview__collapse-head">
          Recent activity
          <ChevronDown className="h-4 w-4" />
        </summary>
        <VipActivityFeed onNavigate={onNavigate} />
      </details>

      <details className="vip-overview__collapse">
        <summary className="vip-overview__collapse-head">
          {t.vip.checklistTitle}
          <span className="text-xs font-semibold text-theme-accent">
            {doneCount}/{DEFAULT_CHECKS.length}
          </span>
        </summary>
        <div className="vip-checklist vip-checklist--nested">
          <p className="text-sm text-theme-muted">{t.vip.checklistSubtitle}</p>
          <ul className="mt-4 space-y-2">
            {DEFAULT_CHECKS.map((item) => (
              <li key={item.id}>
                <label className="vip-checklist__item">
                  <input
                    type="checkbox"
                    checked={Boolean(checks[item.id])}
                    onChange={() => toggleCheck(item.id)}
                  />
                  <span>{t.vip[item.key]}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  )
}
