import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { formatEventDate, getCountdownParts } from '@/utils/eventDate'

interface BannerCountdownProps {
  dateText: string
  targetMs: number
  nowMs: number
}

function CountdownUnit({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  const display = String(value).padStart(2, '0')

  return (
    <div className={`banner-countdown-unit ${accent ? 'banner-countdown-unit--accent' : ''}`}>
      <div className="banner-countdown-digit-wrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={display}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="banner-countdown-digit"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="banner-countdown-label">{label}</span>
    </div>
  )
}

function Separator() {
  return (
    <span className="banner-countdown-sep" aria-hidden>
      :
    </span>
  )
}

export function BannerCountdown({ dateText, targetMs, nowMs }: BannerCountdownProps) {
  const countdown = useMemo(() => getCountdownParts(targetMs, nowMs), [targetMs, nowMs])
  const formattedDate = useMemo(() => formatEventDate(dateText, targetMs), [dateText, targetMs])

  if (!countdown) {
    return (
      <div className="banner-countdown-live">
        <span className="banner-countdown-live-dot" />
        <span className="text-sm font-semibold text-emerald-300">Event is live — join now</span>
      </div>
    )
  }

  const urgent = countdown.totalMs < 3_600_000
  const units = [
    { label: 'Days', value: countdown.days, show: countdown.days > 0 },
    { label: 'Hours', value: countdown.hours, show: true },
    { label: 'Min', value: countdown.minutes, show: true },
    { label: 'Sec', value: countdown.seconds, show: true, accent: true },
  ].filter((u) => u.show)

  return (
    <div className={`banner-countdown ${urgent ? 'banner-countdown--urgent' : ''}`}>
      <div className="banner-countdown-header">
        <Clock className="h-3.5 w-3.5 text-empire-purple-glow" />
        <span className="banner-countdown-heading">Starts in</span>
        <span className="banner-countdown-date">{formattedDate}</span>
      </div>

      <div className="banner-countdown-grid" role="timer" aria-live="polite">
        {units.map((unit, idx) => (
          <div key={unit.label} className="flex items-center gap-1 sm:gap-1.5">
            {idx > 0 ? <Separator /> : null}
            <CountdownUnit label={unit.label} value={unit.value} accent={unit.accent} />
          </div>
        ))}
      </div>
    </div>
  )
}
