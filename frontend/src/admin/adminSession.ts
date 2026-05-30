export const TOKEN_KEY = 'reagle-fx-admin-token'
export const EXP_KEY = 'reagle-fx-admin-exp'
export const EMAIL_KEY = 'reagle-fx-admin-email'
export const REMEMBER_KEY = 'reagle-fx-admin-remember-email'

function now() {
  return Date.now()
}

export function saveAdminSession(token: string, expiresAt: string, email: string, rememberEmail: boolean) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EXP_KEY, String(Date.parse(expiresAt) || now() + 12 * 60 * 60 * 1000))
  localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase())
  if (rememberEmail) {
    localStorage.setItem(REMEMBER_KEY, email.trim().toLowerCase())
  } else {
    localStorage.removeItem(REMEMBER_KEY)
  }
}

export function getAdminAuthToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const exp = Number(localStorage.getItem(EXP_KEY) ?? '0')
  if (!token || !exp || exp <= now()) return null
  return token
}

export function isAdminAuthenticated() {
  return Boolean(getAdminAuthToken())
}

export function getCurrentAdminEmail() {
  return localStorage.getItem(EMAIL_KEY) ?? ''
}

export function getRememberedAdminEmail() {
  return localStorage.getItem(REMEMBER_KEY) ?? ''
}

export function clearAdminSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXP_KEY)
  localStorage.removeItem(EMAIL_KEY)
}
