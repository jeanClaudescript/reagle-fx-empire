import { randomBytes } from 'crypto'
import { AppUserModel, type AppUserDocument } from '../models/AppUser.js'
import { AdminSessionModel } from '../models/AdminSession.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { normalizeEmail, isValidEmail } from '../utils/email.js'

const SESSION_MS = 1000 * 60 * 60 * 12 // 12 hours

function serializeAdmin(user: {
  _id: unknown
  email?: string
  name?: string
  isPrimaryAdmin?: boolean
  createdAt: Date
}) {
  return {
    id: String(user._id),
    email: user.email ?? '',
    name: user.name,
    isPrimary: Boolean(user.isPrimaryAdmin),
    createdAt: user.createdAt.toISOString(),
  }
}

export async function countAdmins() {
  return AppUserModel.countDocuments({ role: 'admin' })
}

export async function hasAnyAdmin() {
  return (await countAdmins()) > 0
}

async function findAdminByEmail(email: string) {
  return AppUserModel.findOne({ email, role: 'admin' }).select('+passwordHash +passwordSalt')
}

async function createSession(userId: string) {
  await AdminSessionModel.deleteMany({ userId, expiresAt: { $lt: new Date() } })
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_MS)
  await AdminSessionModel.create({ token, userId, expiresAt, createdAt: new Date() })
  return { token, expiresAt }
}

export async function loginAdmin(emailRaw: string, password: string) {
  const email = normalizeEmail(emailRaw)
  if (!email || !isValidEmail(email)) throw new Error('Valid email is required')
  if (!password) throw new Error('Password is required')

  const user = await findAdminByEmail(email)
  if (!user?.passwordHash || !user.passwordSalt) {
    throw new Error('Invalid email or password')
  }
  if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    throw new Error('Invalid email or password')
  }

  const session = await createSession(String(user._id))
  return {
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    user: serializeAdmin(user),
  }
}

export async function bootstrapFirstAdmin(input: {
  email: string
  password: string
  name?: string
}) {
  if (await hasAnyAdmin()) {
    throw new Error('An admin account already exists. Sign in instead.')
  }

  const email = normalizeEmail(input.email)
  if (!email || !isValidEmail(email)) throw new Error('Valid email is required')
  if (!input.password || input.password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  const taken = await AppUserModel.findOne({ email })
  if (taken) throw new Error('Email already in use')

  const { salt, hash } = hashPassword(input.password)
  const user = await AppUserModel.create({
    email,
    name: input.name?.trim() || undefined,
    role: 'admin',
    passwordSalt: salt,
    passwordHash: hash,
    isPrimaryAdmin: true,
    membershipStatus: 'unpaid',
    walletBalance: 0,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const session = await createSession(String(user._id))
  return {
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    user: serializeAdmin(user),
  }
}

export async function validateAdminSession(token: string) {
  const session = await AdminSessionModel.findOne({ token, expiresAt: { $gt: new Date() } })
  if (!session) return null

  const user = await AppUserModel.findOne({ _id: session.userId, role: 'admin' })
  if (!user) {
    await AdminSessionModel.deleteOne({ token })
    return null
  }

  return { session, user }
}

export async function logoutAdmin(token: string) {
  await AdminSessionModel.deleteOne({ token })
}

export async function listAdminUsers() {
  const users = await AppUserModel.find({ role: 'admin' }).sort({ createdAt: 1 }).lean()
  return users.map((u) => serializeAdmin(u as never))
}

export async function createAdminUser(input: {
  email: string
  password: string
  name?: string
}) {
  const email = normalizeEmail(input.email)
  if (!email || !isValidEmail(email)) throw new Error('Valid email is required')
  if (!input.password || input.password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  const taken = await AppUserModel.findOne({ email })
  if (taken) throw new Error('Email already in use')

  const { salt, hash } = hashPassword(input.password)
  const user = await AppUserModel.create({
    email,
    name: input.name?.trim() || undefined,
    role: 'admin',
    passwordSalt: salt,
    passwordHash: hash,
    isPrimaryAdmin: false,
    membershipStatus: 'unpaid',
    walletBalance: 0,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return serializeAdmin(user)
}

export async function removeAdminUser(adminId: string, currentAdminId: string) {
  if (adminId === currentAdminId) {
    throw new Error('You cannot remove your own account while signed in')
  }

  const admins = await AppUserModel.countDocuments({ role: 'admin' })
  if (admins <= 1) throw new Error('Cannot remove the only admin account')

  const target = await AppUserModel.findOne({ _id: adminId, role: 'admin' })
  if (!target) throw new Error('Admin not found')

  await AdminSessionModel.deleteMany({ userId: adminId })
  await AppUserModel.deleteOne({ _id: adminId })
}

export type AdminPublic = ReturnType<typeof serializeAdmin>
