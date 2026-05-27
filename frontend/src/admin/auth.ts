const TOKEN_KEY = 'reagle-fx-admin-token'
const EXP_KEY = 'reagle-fx-admin-exp'

function now() {
  return Date.now()
}

export function isAdminAuthenticated() {
  const token = localStorage.getItem(TOKEN_KEY)
  const exp = Number(localStorage.getItem(EXP_KEY) ?? '0')
  if (!token) return false
  if (!exp) return false
  return exp > now()
}

export function loginAdminMock(email: string, password: string) {
  // Frontend-only placeholder. Later we will replace with real JWT auth.
  if (!email.trim()) throw new Error('Email is required')
  if (!password) throw new Error('Password is required')

  const token = `mock-${Math.random().toString(16).slice(2)}`
  const exp = now() + 1000 * 60 * 60 * 6 // 6 hours (dev only)
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EXP_KEY, String(exp))
  return token
}

export function logoutAdmin() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXP_KEY)
}

