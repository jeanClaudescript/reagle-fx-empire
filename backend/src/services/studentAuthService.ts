import { randomBytes } from 'crypto'
import { AppUserModel, type AppUserDocument } from '../models/AppUser.js'
import { StudentSessionModel } from '../models/StudentSession.js'
import { createStudentAccount, findUserByContact } from './studentService.js'
import {
  canAccessVipDesk,
  ensurePaidUntilForLegacy,
  expireMembershipIfNeeded,
  getSiteFreeAccessStatus,
  isMembershipActive,
  membershipMetaForUser,
  resolveAccessMode,
} from './membershipService.js'

const SESSION_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export async function serializeStudent(user: AppUserDocument) {
  const mode = await resolveAccessMode(user)
  const promo = await getSiteFreeAccessStatus()
  const hasAccess = mode === 'paid' || mode === 'promo'
  const meta = await membershipMetaForUser(user)

  return {
    id: String(user._id),
    name: user.name,
    phone: user.phone,
    email: user.email,
    accessMode: mode,
    membershipStatus: hasAccess ? ('paid' as const) : ('unpaid' as const),
    membershipExpired: mode === 'expired',
    siteFreeAccessActive: promo.active,
    referralCode: user.referralCode,
    paidAt: user.paidAt?.toISOString(),
    ...meta,
  }
}

async function createStudentSession(userId: string, deviceId: string, deviceLabel?: string) {
  await StudentSessionModel.deleteMany({ userId })
  await StudentSessionModel.deleteMany({ expiresAt: { $lt: new Date() } })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_MS)
  await StudentSessionModel.create({
    token,
    userId,
    deviceId,
    deviceLabel: deviceLabel?.trim() || undefined,
    expiresAt,
    createdAt: new Date(),
  })
  return { token, expiresAt }
}

async function loadActiveStudent(input: { phone?: string; email?: string }) {
  const found = await findUserByContact({ phone: input.phone, email: input.email })
  if (!found) return null

  const userId = String(found._id)
  await expireMembershipIfNeeded(userId)
  await ensurePaidUntilForLegacy(userId)

  const user = await AppUserModel.findById(userId)
  if (!user) return null

  if (!isMembershipActive(user)) {
    if (user.membershipStatus === 'paid') {
      user.membershipStatus = 'unpaid'
      user.updatedAt = new Date()
      await user.save()
      if (!(await canAccessVipDesk(user))) {
        await invalidateStudentSessions(userId)
      }
    }
  }
  return user
}

export async function loginStudent(input: {
  phone?: string
  email?: string
  deviceId: string
  deviceLabel?: string
}) {
  if (!input.deviceId?.trim()) throw new Error('Device id is required')

  const user = await loadActiveStudent({ phone: input.phone, email: input.email })
  if (!user) throw new Error('Account not found')
  if (!(await canAccessVipDesk(user))) {
    throw new Error('Membership expired — renew to unlock the VIP desk')
  }

  const session = await createStudentSession(String(user._id), input.deviceId.trim(), input.deviceLabel)
  return {
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    user: await serializeStudent(user),
  }
}

export async function validateRegisteredStudentSession(token: string) {
  const session = await StudentSessionModel.findOne({ token, expiresAt: { $gt: new Date() } })
  if (!session) return null

  const userId = String(session.userId)
  await expireMembershipIfNeeded(userId)
  await ensurePaidUntilForLegacy(userId)

  const user = await AppUserModel.findOne({
    _id: session.userId,
    role: 'student',
  })
  if (!user) {
    await StudentSessionModel.deleteOne({ token })
    return null
  }

  return { session, user }
}

export async function validateStudentSession(token: string) {
  const result = await validateRegisteredStudentSession(token)
  if (!result) return null
  if (!(await canAccessVipDesk(result.user))) return null
  return result
}

export async function registerFreeStudent(input: {
  name?: string
  phone?: string
  email?: string
  referrerCode?: string
  deviceId: string
  deviceLabel?: string
}) {
  if (!input.deviceId?.trim()) throw new Error('Device id is required')

  const existing = await findUserByContact({ phone: input.phone, email: input.email })
  if (existing) throw new Error('Account already exists — sign in instead')

  await createStudentAccount({
    name: input.name,
    phone: input.phone,
    email: input.email,
    referrerCode: input.referrerCode,
    membershipStatus: 'unpaid',
  })

  const user = await loadActiveStudent({ phone: input.phone, email: input.email })
  if (!user) throw new Error('Could not create account')

  const session = await createStudentSession(String(user._id), input.deviceId.trim(), input.deviceLabel)
  return {
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    user: await serializeStudent(user),
  }
}

export async function loginFreeStudent(input: {
  phone?: string
  email?: string
  deviceId: string
  deviceLabel?: string
}) {
  if (!input.deviceId?.trim()) throw new Error('Device id is required')

  const user = await loadActiveStudent({ phone: input.phone, email: input.email })
  if (!user) throw new Error('Account not found')

  const mode = await resolveAccessMode(user)
  if (mode === 'expired') {
    throw new Error('Membership expired — renew to unlock the VIP desk')
  }

  const session = await createStudentSession(String(user._id), input.deviceId.trim(), input.deviceLabel)
  return {
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    user: await serializeStudent(user),
  }
}

export async function logoutStudent(token: string) {
  await StudentSessionModel.deleteOne({ token })
}

export async function invalidateStudentSessions(userId: string) {
  await StudentSessionModel.deleteMany({ userId })
}

export async function touchStudentSession(token: string) {
  const session = await StudentSessionModel.findOne({ token, expiresAt: { $gt: new Date() } })
  if (!session) return null
  session.expiresAt = new Date(Date.now() + SESSION_MS)
  await session.save()
  return session
}

export { loadActiveStudent, isMembershipActive }
