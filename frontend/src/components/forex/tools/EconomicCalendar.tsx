import { CalendarDays } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { ForexToolShell } from '@/components/forex/ForexToolShell'

const EVENTS = [
  { time: '09:00', cur: 'USD', title: 'Core CPI m/m', impact: 'high' },
  { time: '11:30', cur: 'EUR', title: 'ECB President speaks', impact: 'medium' },
  { time: '14:30', cur: 'USD', title: 'Unemployment claims', impact: 'medium' },
  { time: '16:00', cur: 'USD', title: 'FOMC minutes', impact: 'high' },
  { time: '21:00', cur: 'JPY', title: 'BOJ outlook report', impact: 'high' },
] as const

export function EconomicCalendar() {
  const { t } = useLanguage()
  const day = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <ForexToolShell
      icon={CalendarDays}
      title={t.tools.calendarTitle}
      description={t.tools.calendarDesc}
      tag={t.tools.tagMarket}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-theme-muted">{day}</p>
      <ul className="space-y-2">
        {EVENTS.map((ev) => (
          <li key={ev.title} className="forex-calendar-row">
            <span className="font-mono text-xs text-theme-muted">{ev.time}</span>
            <span className="rounded-md bg-theme-elevated/80 px-1.5 py-0.5 text-[10px] font-bold">{ev.cur}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-theme-primary">{ev.title}</span>
            <span className={`forex-impact forex-impact--${ev.impact}`}>{ev.impact}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-theme-muted">{t.tools.calendarDemo}</p>
    </ForexToolShell>
  )
}
