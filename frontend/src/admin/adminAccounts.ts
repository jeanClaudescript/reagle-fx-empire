export type AdminAccount = {
  id: string
  email: string
  name?: string
  passwordSalt: string
  passwordHash: string
  isPrimary: boolean
  createdAt: string
}

const USERS_KEY = 'reagle-fx-admin-users'
const TOKEN_KEY = 'reagle-fx-admin-token'
const EXP_KEY = 'reagle-fx-admin-exp'
const EMAIL_KEY = 'reagle-fx-admin-email'
const REMEMBER_KEY = 'reagle-fx-admin-remember-email'

const SESSION_MS = 1000 * 60 * 60 * 12 // 12 hours

function now() {
  return Date.now()
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function randomSalt() {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function loadUsers(): AdminAccount[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AdminAccount[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveUsers(users: AdminAccount[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function createSession(email: string, rememberEmail: boolean) {
  const token = `adm-${crypto.randomUUID()}`
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EXP_KEY, String(now() + SESSION_MS))
  localStorage.setItem(EMAIL_KEY, normalizeEmail(email))
  if (rememberEmail) {
    localStorage.setItem(REMEMBER_KEY, normalizeEmail(email))
  } else {
    localStorage.removeItem(REMEMBER_KEY)
  }
  return token
}

export function isAdminAuthenticated() {
  const token = localStorage.getItem(TOKEN_KEY)
  const exp = Number(localStorage.getItem(EXP_KEY) ?? '0')
  if (!token || !exp) return false
  return exp > now()
}

export function getCurrentAdminEmail() {
  return localStorage.getItem(EMAIL_KEY) ?? ''
}

export function getRememberedAdminEmail() {
  return localStorage.getItem(REMEMBER_KEY) ?? ''
}

export function hasAdminAccounts() {
  return loadUsers().length > 0
}

export function listAdminAccounts() {
  return loadUsers().map(({ id, email, name, isPrimary, createdAt }) => ({
    id,
    email,
    name,
    isPrimary,
    createdAt,
  }))
}

export async function bootstrapAdmin(input: {
  email: string
  password: string
  name?: string
}) {
  const email = normalizeEmail(input.email)
  if (!email) throw new Error('Email is required')
  if (!input.password || input.password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  const users = loadUsers()
  if (users.length > 0) {
    throw new Error('An admin account already exists. Sign in or ask the main admin to add you.')
  }

  const salt = randomSalt()
  const passwordHash = await hashPassword(input.password, salt)
  const account: AdminAccount = {
    id: crypto.randomUUID(),
    email,
    name: input.name?.trim() || undefined,
    passwordSalt: salt,
    passwordHash,
    isPrimary: true,
    createdAt: new Date().toISOString(),
  }
  saveUsers([account])
  return account
}

async function verifyCredentials(email: string, password: string) {
  const normalized = normalizeEmail(email)
  const user = loadUsers().find((u) => u.email === normalized)
  if (!user) return null
  const hash = await hashPassword(password, user.passwordSalt)
  if (hash !== user.passwordHash) return null
  return user
}

export async function loginAdmin(email: string, password: string, rememberEmail = false) {
  if (!email.trim()) throw new Error('Email is required')
  if (!password) throw new Error('Password is required')

  let user = await verifyCredentials(email, password)

  if (!user && loadUsers().length === 0) {
    user = await bootstrapAdmin({ email, password })
  }

  if (!user) {
    throw new Error('Invalid email or password')
  }

  return createSession(user.email, rememberEmail)
}

export async function addAdminAccount(input: {
  email: string
  password: string
  name?: string
}) {
  if (!isAdminAuthenticated()) {
    throw new Error('You must be signed in as admin')
  }

  const email = normalizeEmail(input.email)
  if (!email) throw new Error('Email is required')
  if (!input.password || input.password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  const users = loadUsers()
  if (users.some((u) => u.email === email)) {
    throw new Error('This email is already an admin')
  }

  const salt = randomSalt()
  const passwordHash = await hashPassword(input.password, salt)
  const account: AdminAccount = {
    id: crypto.randomUUID(),
    email,
    name: input.name?.trim() || undefined,
    passwordSalt: salt,
    passwordHash,
    isPrimary: false,
    createdAt: new Date().toISOString(),
  }
  saveUsers([...users, account])
  return account
}

export function removeAdminAccount(id: string) {
  if (!isAdminAuthenticated()) {
    throw new Error('You must be signed in as admin')
  }

  const users = loadUsers()
  if (users.length <= 1) {
    throw new Error('Cannot remove the only admin account')
  }

  const target = users.find((u) => u.id === id)
  if (!target) throw new Error('Admin not found')

  const currentEmail = getCurrentAdminEmail()
  if (target.email === currentEmail) {
    throw new Error('You cannot remove your own account while signed in')
  }

  saveUsers(users.filter((u) => u.id !== id))
}

export function logoutAdmin() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXP_KEY)
  localStorage.removeItem(EMAIL_KEY)
}

/** @deprecated use loginAdmin */
export function loginAdminMock(email: string, password: string) {
  return loginAdmin(email, password, false)
}
