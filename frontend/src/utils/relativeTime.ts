export function formatRelativeTime(iso: string, nowMs = Date.now()) {
  const ts = Date.parse(iso)
  if (!Number.isFinite(ts)) return 'Now'

  const diffSec = Math.max(0, Math.floor((nowMs - ts) / 1000))
  if (diffSec < 60) return 'Now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
