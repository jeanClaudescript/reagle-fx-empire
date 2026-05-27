/** Parse admin date text or ISO/datetime-local into epoch ms. */
export function parseEventDate(text: string, nowMs = Date.now()): number | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const direct = Date.parse(trimmed)
  if (Number.isFinite(direct)) return direct

  const ymd = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(trimmed)
  if (ymd) {
    const [, y, m, d, hh = '0', mm = '0', ss = '0'] = ymd
    const ms = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss)).getTime()
    if (Number.isFinite(ms)) return ms
  }

  const now = new Date(nowMs)
  const withYear = Date.parse(`${trimmed} ${now.getFullYear()}`)
  if (Number.isFinite(withYear)) {
    return withYear < nowMs ? Date.parse(`${trimmed} ${now.getFullYear() + 1}`) : withYear
  }

  return null
}

export function formatEventDate(text: string, targetMs: number) {
  const trimmed = text.trim()
  if (trimmed && !Number.isFinite(Date.parse(trimmed))) return trimmed
  return new Date(targetMs).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getCountdownParts(targetMs: number, nowMs: number) {
  const diff = targetMs - nowMs
  if (diff <= 0) return null

  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs: diff,
  }
}
