const STORAGE_KEY = 'rfx_referral_code'
const STORAGE_AT_KEY = 'rfx_referral_at'
const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000
export const REFERRAL_QUERY_KEY = 'ref'

export function normalizeReferralCode(raw: string | null | undefined) {
  const code = raw?.trim().toUpperCase().replace(/\s+/g, '')
  if (!code) return ''
  return code
}

export function setStoredReferralCode(code: string) {
  const normalized = normalizeReferralCode(code)
  if (!normalized) return
  localStorage.setItem(STORAGE_KEY, normalized)
  localStorage.setItem(STORAGE_AT_KEY, String(Date.now()))
}

export function clearStoredReferralCode() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_AT_KEY)
}

export function getStoredReferralCode() {
  try {
    const code = normalizeReferralCode(localStorage.getItem(STORAGE_KEY))
    if (!code) return ''
    const at = Number(localStorage.getItem(STORAGE_AT_KEY) || 0)
    if (at && Date.now() - at > REFERRAL_TTL_MS) {
      clearStoredReferralCode()
      return ''
    }
    return code
  } catch {
    return ''
  }
}

/** Read ?ref= from URL and persist (30-day cookie-like storage). */
export function captureReferralFromSearch(search = window.location.search) {
  const ref = normalizeReferralCode(new URLSearchParams(search).get(REFERRAL_QUERY_KEY))
  if (ref) setStoredReferralCode(ref)
  return ref
}

const JOIN_PATH_RE = /^\/(join|r|invite)\/([^/?#]+)\/?$/i

/** If path is /join/CODE (or /r/, /invite/), store code and return redirect path. */
export function resolveReferralPath(pathname: string): { path: string; captured?: string } {
  const match = pathname.match(JOIN_PATH_RE)
  if (!match) return { path: pathname }

  const code = normalizeReferralCode(decodeURIComponent(match[2]))
  if (!code) return { path: pathname }

  setStoredReferralCode(code)
  return { path: '/login', captured: code }
}

export function buildReferralJoinUrl(code: string, origin = window.location.origin) {
  const normalized = normalizeReferralCode(code)
  return `${origin}/join/${encodeURIComponent(normalized)}`
}

export function buildReferralPayUrl(code: string, origin = window.location.origin) {
  const normalized = normalizeReferralCode(code)
  const params = new URLSearchParams({ ref: normalized })
  return `${origin}/pay?${params.toString()}`
}
