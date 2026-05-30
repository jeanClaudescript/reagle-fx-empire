import { randomBytes } from 'crypto'
import { AppUserModel, type AppUserDocument } from '../models/AppUser.js'
import { StudentSessionModel } from '../models/StudentSession.js'
import { findUserByContact } from './studentService.js'

const SESSION_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

function serializeStudent(user: AppUserDocument) {
  return {
    id: String(user._id),
    name: user.name,
    phone: user.phone,
    email: user.email,
    membershipStatus: user.membershipStatus,
    referralCode: user.referralCode,
    paidAt: user.paidAt?.toISOString(),
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

export async function loginStudent(input: {
  phone?: string
  email?: string
  deviceId: string
  deviceLabel?: string
}) {
  if (!input.deviceId?.trim()) throw new Error('Device id is required')

  const user = await findUserByContact({ phone: input.phone, email: input.email })
  if (!user) throw new Error('Account not found')
  if (user.membershipStatus !== 'paid') {
    throw new Error('Payment required — complete MoMo to unlock the VIP desk')
  }

  const session = await createStudentSession(String(user._id), input.deviceId.trim(), input.deviceLabel)
  return {
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    user: serializeStudent(user),
  }
}

export async function validateStudentSession(token: string) {
  const session = await StudentSessionModel.findOne({ token, expiresAt: { $gt: new Date() } })
  if (!session) return null

  const user = await AppUserModel.findOne({
    _id: session.userId,
    role: 'student',
    membershipStatus: 'paid',
  })
  if (!user) {
    await StudentSessionModel.deleteOne({ token })
    return null
  }

  return { session, user }
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
