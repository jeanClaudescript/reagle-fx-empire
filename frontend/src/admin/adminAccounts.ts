import { authApi } from '@/services/api'
import {
  clearAdminSession,
  getCurrentAdminEmail,
  getRememberedAdminEmail,
  isAdminAuthenticated,
  saveAdminSession,
} from '@/admin/adminSession'

export type AdminAccount = {
  id: string
  email: string
  name?: string
  isPrimary: boolean
  createdAt: string
}

export {
  isAdminAuthenticated,
  getCurrentAdminEmail,
  getRememberedAdminEmail,
}

export async function hasAdminAccounts() {
  try {
    const res = await authApi.setupStatus()
    return res.data.hasAdmin
  } catch {
    return false
  }
}

export async function listAdminAccounts(): Promise<AdminAccount[]> {
  const res = await authApi.listAdmins()
  return res.data
}

export async function loginAdmin(email: string, password: string, rememberEmail = false) {
  if (!email.trim()) throw new Error('Email is required')
  if (!password) throw new Error('Password is required')

  try {
    const res = await authApi.login(email, password)
    saveAdminSession(res.data.token, res.data.expiresAt, res.data.user.email, rememberEmail)
    return res.data.token
  } catch (loginErr) {
    const setup = await authApi.setupStatus().catch(() => ({ data: { hasAdmin: true } }))
    if (!setup.data.hasAdmin) {
      const boot = await authApi.bootstrap({ email, password })
      saveAdminSession(boot.data.token, boot.data.expiresAt, boot.data.user.email, rememberEmail)
      return boot.data.token
    }
    throw loginErr
  }
}

export async function logoutAdmin() {
  const token = localStorage.getItem('reagle-fx-admin-token')
  try {
    if (token) await authApi.logout()
  } catch {
    /* clear local session anyway */
  }
  clearAdminSession()
}

export async function addAdminAccount(input: {
  email: string
  password: string
  name?: string
}) {
  if (!isAdminAuthenticated()) {
    throw new Error('You must be signed in as admin')
  }
  await authApi.createAdmin(input)
}

export async function removeAdminAccount(id: string) {
  if (!isAdminAuthenticated()) {
    throw new Error('You must be signed in as admin')
  }
  await authApi.removeAdmin(id)
}

/** @deprecated use loginAdmin */
export function loginAdminMock(email: string, password: string) {
  return loginAdmin(email, password, false)
}

/** @deprecated first admin is created via bootstrap on login */
export async function bootstrapAdmin(_input: {
  email: string
  password: string
  name?: string
}) {
  throw new Error('Use loginAdmin — first sign-in creates the main admin in the database.')
}
