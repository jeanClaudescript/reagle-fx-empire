import { useEffect, useState } from 'react'
import { GraduationCap, LineChart, Radio, Target } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { VipActivityFeed } from '@/components/student/vip/VipActivityFeed'
import { VipLearningPath } from '@/components/student/vip/VipLearningPath'
import { VipMembershipBanner } from '@/components/student/vip/VipMembershipBanner'
import { VipPhysicalClassCard } from '@/components/student/vip/VipPhysicalClassCard'
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
      <div className="vip-overview__hero">
        <p className="text-sm text-theme-muted">{t.vip.welcome}</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-theme-primary sm:text-3xl">
          {contact?.name || t.vip.traderFallback}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-theme-muted">{t.vip.overviewSubtitle}</p>
      </div>

      <VipMembershipBanner />

      <VipPhysicalClassCard />

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

      <div className="mt-6">
        <VipLearningPath onNavigate={onNavigate} />
      </div>

      <VipActivityFeed onNavigate={onNavigate} />

      <div className="vip-checklist">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-theme-primary">{t.vip.checklistTitle}</h3>
          <span className="text-xs font-semibold text-theme-accent">
            {doneCount}/{DEFAULT_CHECKS.length}
          </span>
        </div>
        <p className="mt-1 text-sm text-theme-muted">{t.vip.checklistSubtitle}</p>
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
    </div>
  )
}
