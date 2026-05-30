import { CalendarDays } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { ForexToolShell } from '@/components/forex/ForexToolShell'
import { marketApi, type EconomicEvent } from '@/services/api'

export function EconomicCalendar() {
  const { t } = useLanguage()
  const [events, setEvents] = useState<EconomicEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const day = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
  const todayKey = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await marketApi.calendar()
        if (!cancelled) {
          setEvents(res.data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const id = window.setInterval(() => void load(), 300_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const todayEvents = useMemo(
    () => events.filter((ev) => ev.date.startsWith(todayKey)).slice(0, 12),
    [events, todayKey],
  )

  const display = todayEvents.length > 0 ? todayEvents : events.slice(0, 12)

  return (
    <ForexToolShell
      icon={CalendarDays}
      title={t.tools.calendarTitle}
      description={t.tools.calendarDesc}
      tag={t.tools.tagMarket}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-theme-muted">{day}</p>
      {loading ? <p className="text-sm text-theme-muted">{t.tools.calendarLoading}</p> : null}
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <ul className="space-y-2">
        {display.map((ev) => (
          <li key={ev.id} className="forex-calendar-row">
            <span className="font-mono text-xs text-theme-muted">{ev.time}</span>
            <span className="rounded-md bg-theme-elevated/80 px-1.5 py-0.5 text-[10px] font-bold">{ev.currency}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-theme-primary">{ev.title}</span>
            <span className={`forex-impact forex-impact--${ev.impact}`}>{ev.impact}</span>
          </li>
        ))}
        {!loading && display.length === 0 ? (
          <li className="text-sm text-theme-muted">{t.tools.calendarEmpty}</li>
        ) : null}
      </ul>
      <p className="mt-3 text-[10px] text-theme-muted">{t.tools.liveFeed}</p>
    </ForexToolShell>
  )
}
