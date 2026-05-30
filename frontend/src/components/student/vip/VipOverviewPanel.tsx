import { Radio, Shield, Target, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { liveApi, type LiveSession } from '@/services/api'
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
  const [session, setSession] = useState<LiveSession | null>(null)
  const [checks, setChecks] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY)
      if (raw) setChecks(JSON.parse(raw) as Record<string, boolean>)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await liveApi.getActive()
        setSession(res.data)
      } catch {
        setSession(null)
      }
    }
    void load()
  }, [])

  const toggleCheck = (id: string) => {
    setChecks((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next))
      return next
    })
  }

  const isLive = session?.status === 'live'
  const doneCount = DEFAULT_CHECKS.filter((c) => checks[c.id]).length

  return (
    <div className="vip-overview">
      <div className="vip-overview__hero">
        <p className="text-sm text-theme-muted">{t.vip.welcome}</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-theme-primary sm:text-3xl">
          {contact?.name || t.vip.traderFallback}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-theme-muted">{t.vip.overviewSubtitle}</p>
      </div>

      <div className="vip-overview__grid">
        <button type="button" className="vip-stat-card" onClick={() => onNavigate('live')}>
          <Radio className={`h-5 w-5 ${isLive ? 'text-rose-400' : 'text-theme-accent'}`} />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-theme-muted">
            {t.vip.liveStatus}
          </p>
          <p className="mt-1 font-display text-lg font-bold text-theme-primary">
            {isLive ? t.live.liveNow : t.vip.liveOffline}
          </p>
          {isLive && session?.title ? (
            <p className="mt-1 truncate text-xs text-theme-muted">{session.title}</p>
          ) : null}
        </button>

        <button type="button" className="vip-stat-card" onClick={() => onNavigate('paper')}>
          <TrendingUp className="h-5 w-5 text-theme-accent" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-theme-muted">
            {t.tools.paperTitle}
          </p>
          <p className="mt-1 text-sm text-theme-primary">{t.vip.paperHint}</p>
        </button>

        <button type="button" className="vip-stat-card" onClick={() => onNavigate('position')}>
          <Shield className="h-5 w-5 text-theme-accent" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-theme-muted">
            {t.vip.riskDesk}
          </p>
          <p className="mt-1 text-sm text-theme-primary">{t.vip.riskHint}</p>
        </button>

        <button type="button" className="vip-stat-card" onClick={() => onNavigate('signals')}>
          <Target className="h-5 w-5 text-theme-accent" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-theme-muted">
            {t.tools.signalBoardTitle}
          </p>
          <p className="mt-1 text-sm text-theme-primary">{t.vip.signalsHint}</p>
        </button>
      </div>

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
