import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import type { VipPanelId } from '@/components/student/vip/VipDeskShell'

const PROGRESS_KEY = 'rfx_vip_program_weeks_v1'

type WeekDef = {
  id: number
  titleKey: string
  descKey: string
  panels: VipPanelId[]
}

const WEEKS: WeekDef[] = [
  { id: 1, titleKey: 'week1Title', descKey: 'week1Desc', panels: ['overview', 'position', 'rr'] },
  { id: 2, titleKey: 'week2Title', descKey: 'week2Desc', panels: ['chart', 'session', 'watch'] },
  { id: 3, titleKey: 'week3Title', descKey: 'week3Desc', panels: ['calendar', 'news', 'pip'] },
  { id: 4, titleKey: 'week4Title', descKey: 'week4Desc', panels: ['live', 'signals', 'coach-chat'] },
  { id: 5, titleKey: 'week5Title', descKey: 'week5Desc', panels: ['classroom', 'chart', 'community-chat'] },
  { id: 6, titleKey: 'week6Title', descKey: 'week6Desc', panels: ['paper', 'journal', 'margin'] },
  { id: 7, titleKey: 'week7Title', descKey: 'week7Desc', panels: ['pivot', 'fib', 'breakeven'] },
  { id: 8, titleKey: 'week8Title', descKey: 'week8Desc', panels: ['books', 'account', 'overview'] },
]

function readDone(): Set<number> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as number[])
  } catch {
    return new Set()
  }
}

function writeDone(set: Set<number>) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...set]))
}

export function VipLearningPath({ onNavigate }: { onNavigate: (id: VipPanelId) => void }) {
  const { t } = useLanguage()
  const [done, setDone] = useState<Set<number>>(() => readDone())

  useEffect(() => {
    writeDone(done)
  }, [done])

  const completed = done.size
  const progress = Math.round((completed / WEEKS.length) * 100)

  const nextWeek = useMemo(() => WEEKS.find((w) => !done.has(w.id)) ?? WEEKS[WEEKS.length - 1], [done])

  const toggleWeek = (id: number) => {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="vip-program">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-theme-primary">{t.program.title}</h3>
          <p className="mt-1 text-sm text-theme-muted">{t.program.subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-theme-accent">{progress}%</p>
          <p className="text-xs text-theme-muted">{t.program.progress.replace('{n}', String(completed))}</p>
        </div>
      </div>

      <div className="vip-program__bar mt-4" aria-hidden>
        <span className="vip-program__bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {nextWeek && !done.has(nextWeek.id) ? (
        <button
          type="button"
          className="vip-program__next mt-4"
          onClick={() => onNavigate(nextWeek.panels[0])}
        >
          <span>
            <strong>{t.program.continueWeek.replace('{n}', String(nextWeek.id))}</strong>
            <span className="mt-0.5 block text-xs font-normal opacity-90">
              {t.program[nextWeek.titleKey as keyof typeof t.program]}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0" />
        </button>
      ) : completed === WEEKS.length ? (
        <p className="vip-program__done mt-4 text-sm font-semibold text-emerald-400">{t.program.complete}</p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {WEEKS.map((week) => {
          const isDone = done.has(week.id)
          const Icon = isDone ? CheckCircle2 : Circle
          return (
            <li key={week.id} className={`vip-program__week ${isDone ? 'vip-program__week--done' : ''}`}>
              <button type="button" className="vip-program__week-check" onClick={() => toggleWeek(week.id)} aria-label="Mark week complete">
                <Icon className={`h-5 w-5 ${isDone ? 'text-emerald-400' : 'text-theme-muted'}`} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-theme-primary">
                  {t.program.weekLabel.replace('{n}', String(week.id))}:{' '}
                  {t.program[week.titleKey as keyof typeof t.program]}
                </p>
                <p className="mt-0.5 text-xs text-theme-muted">
                  {t.program[week.descKey as keyof typeof t.program]}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {week.panels.map((panel) => (
                    <button
                      key={panel}
                      type="button"
                      className="vip-program__chip"
                      onClick={() => onNavigate(panel)}
                    >
                      {t.program.openTool}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
