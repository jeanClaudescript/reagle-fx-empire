import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

const SESSIONS = [
  { id: 'tokyo', start: 0, end: 9 },
  { id: 'london', start: 7, end: 16 },
  { id: 'newyork', start: 12, end: 21 },
] as const

function isOpenUtc(hour: number, start: number, end: number) {
  if (start < end) return hour >= start && hour < end
  return hour >= start || hour < end
}

export function SessionClock() {
  const { t } = useLanguage()
  const [utcHour, setUtcHour] = useState(() => new Date().getUTCHours())

  useEffect(() => {
    const id = window.setInterval(() => setUtcHour(new Date().getUTCHours()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const labels: Record<string, string> = {
    tokyo: t.tools.sessionTokyo,
    london: t.tools.sessionLondon,
    newyork: t.tools.sessionNy,
  }

  return (
    <div className="forex-tool-card h-full">
      <h3 className="forex-tool-card__title">{t.tools.sessionTitle}</h3>
      <p className="forex-tool-card__desc">{t.tools.sessionDesc}</p>
      <p className="mt-2 font-mono text-xs text-theme-muted">UTC {utcHour.toString().padStart(2, '0')}:00</p>
      <ul className="mt-4 flex flex-col gap-2">
        {SESSIONS.map((s) => {
          const open = isOpenUtc(utcHour, s.start, s.end)
          return (
            <li
              key={s.id}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                open ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-theme bg-theme-surface/40'
              }`}
            >
              <span className="text-sm font-semibold text-theme-primary">{labels[s.id]}</span>
              <span
                className={`text-xs font-bold uppercase ${open ? 'text-emerald-400' : 'text-theme-muted'}`}
              >
                {open ? t.tools.sessionOpen : t.tools.sessionClosed}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
