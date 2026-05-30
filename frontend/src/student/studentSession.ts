const TOKEN_KEY = 'rfx_student_token'
const DEVICE_KEY = 'rfx_device_id'

function randomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `dev-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

export function getStudentDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = randomId()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export function getStudentAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStudentAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStudentAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getStudentDeviceLabel() {
  const ua = navigator.userAgent
  if (/iPhone|iPad/i.test(ua)) return 'iPhone / iPad'
  if (/Android/i.test(ua)) return 'Android'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Mac/i.test(ua)) return 'Mac'
  return 'Browser'
}
