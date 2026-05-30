import type { LiveSession } from '@/services/api'

const SEEN_SIGNAL_FP_KEY = 'rfx_vip_signal_fp_v1'

export function hasActiveSignal(session: LiveSession | null) {
  return Boolean(
    session &&
      session.status === 'live' &&
      session.signalSide !== 'neutral' &&
      session.signalEntry != null,
  )
}

export function signalFingerprint(session: LiveSession) {
  return [
    session.id,
    session.updatedAt,
    session.signalSide,
    session.signalEntry,
    session.signalStop,
    session.signalTarget,
    session.coachNote,
  ].join('|')
}

export function getSeenSignalFingerprint() {
  try {
    return localStorage.getItem(SEEN_SIGNAL_FP_KEY) ?? ''
  } catch {
    return ''
  }
}

export function isSignalNew(session: LiveSession | null) {
  if (!hasActiveSignal(session) || !session) return false
  return getSeenSignalFingerprint() !== signalFingerprint(session)
}

export function markSignalSeen(session: LiveSession | null) {
  if (!hasActiveSignal(session) || !session) return
  try {
    localStorage.setItem(SEEN_SIGNAL_FP_KEY, signalFingerprint(session))
  } catch {
    /* ignore */
  }
}
