import { AppUserModel, type MembershipStatus } from '../models/AppUser.js'
import { PaymentModel } from '../models/Payment.js'
import { generateReferenceCode } from '../utils/referenceCode.js'
import { formatDisplayPhone, normalizeRwPhone } from '../utils/phone.js'
import { isValidEmail, normalizeEmail } from '../utils/email.js'
import { getPaymentSettings } from './paymentSettingsService.js'

async function uniqueUserReferralCode() {
  for (let i = 0; i < 8; i += 1) {
    const code = `REF-${generateReferenceCode().slice(4)}`
    const exists = await AppUserModel.findOne({ referralCode: code })
    if (!exists) return code
  }
  throw new Error('Could not generate referral code')
}

function parseContact(input: { phone?: string; email?: string }) {
  const phoneRaw = input.phone?.trim()
  const emailRaw = input.email?.trim()

  let phone: string | undefined
  let email: string | undefined

  if (phoneRaw) {
    phone = normalizeRwPhone(phoneRaw)
    if (phone.length < 11) throw new Error('Invalid phone number')
  }

  if (emailRaw) {
    email = normalizeEmail(emailRaw)
    if (!isValidEmail(email)) throw new Error('Invalid email address')
  }

  if (!phone && !email) {
    throw new Error('Phone or email is required (at least one)')
  }

  return { phone, email }
}

export async function markStudentPaid(userId: string) {
  await AppUserModel.findByIdAndUpdate(userId, {
    membershipStatus: 'paid',
    paidAt: new Date(),
    updatedAt: new Date(),
  })
}

export async function createStudentAccount(input: {
  name?: string
  phone?: string
  email?: string
  referrerCode?: string
  notes?: string
  membershipStatus?: MembershipStatus
}) {
  const { phone, email } = parseContact(input)

  if (phone) {
    const phoneTaken = await AppUserModel.findOne({ phone })
    if (phoneTaken) throw new Error('Phone number already registered')
  }
  if (email) {
    const emailTaken = await AppUserModel.findOne({ email })
    if (emailTaken) throw new Error('Email already registered')
  }

  let referredByUserId: string | undefined
  let referredByCode: string | undefined
  const ref = input.referrerCode?.trim().toUpperCase()
  if (ref) {
    const referrer = await AppUserModel.findOne({ referralCode: ref })
    if (referrer) {
      referredByUserId = String(referrer._id)
      referredByCode = ref
    }
  }

  const status = input.membershipStatus ?? 'unpaid'
  const user = await AppUserModel.create({
    phone,
    email,
    name: input.name?.trim() || undefined,
    role: 'student',
    referralCode: await uniqueUserReferralCode(),
    referredByCode,
    referredByUserId,
    membershipStatus: status,
    paidAt: status === 'paid' ? new Date() : undefined,
    notes: input.notes?.trim() || '',
    walletBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return enrichStudent(user)
}

export async function updateStudentAccount(
  userId: string,
  input: {
    name?: string
    phone?: string
    email?: string
    notes?: string
    membershipStatus?: MembershipStatus
    walletBalance?: number
    clearPhone?: boolean
    clearEmail?: boolean
  },
) {
  const user = await AppUserModel.findById(userId)
  if (!user || user.role === 'admin') throw new Error('Student not found')

  const nextPhone = input.clearPhone ? undefined : input.phone != null ? normalizeRwPhone(input.phone) : user.phone
  const nextEmail = input.clearEmail
    ? undefined
    : input.email != null
      ? normalizeEmail(input.email)
      : user.email

  if (input.phone != null && !input.clearPhone) {
    if (nextPhone && nextPhone.length < 11) throw new Error('Invalid phone number')
  }
  if (input.email != null && !input.clearEmail) {
    if (nextEmail && !isValidEmail(nextEmail)) throw new Error('Invalid email address')
  }

  if (!nextPhone && !nextEmail) {
    throw new Error('Student must keep at least phone or email')
  }

  if (nextPhone && nextPhone !== user.phone) {
    const taken = await AppUserModel.findOne({ phone: nextPhone, _id: { $ne: userId } })
    if (taken) throw new Error('Phone number already in use')
  }
  if (nextEmail && nextEmail !== user.email) {
    const taken = await AppUserModel.findOne({ email: nextEmail, _id: { $ne: userId } })
    if (taken) throw new Error('Email already in use')
  }

  if (input.name !== undefined) user.name = input.name.trim() || undefined
  user.phone = nextPhone
  user.email = nextEmail
  if (input.notes !== undefined) user.notes = input.notes.trim()
  if (input.membershipStatus) {
    user.membershipStatus = input.membershipStatus
    if (input.membershipStatus === 'paid') {
      user.paidAt = user.paidAt ?? new Date()
    } else {
      user.paidAt = undefined
    }
  }
  if (input.walletBalance != null) {
    const bal = Math.round(input.walletBalance)
    if (!Number.isFinite(bal) || bal < 0) throw new Error('Wallet balance must be 0 or greater')
    user.walletBalance = bal
  }
  user.updatedAt = new Date()
  await user.save()
  return enrichStudent(user)
}

async function enrichStudent(user: {
  _id: unknown
  phone?: string
  email?: string
  name?: string
  referralCode?: string
  referredByCode?: string
  referredByUserId?: string
  membershipStatus: MembershipStatus
  paidAt?: Date
  notes?: string
  walletBalance: number
  createdAt: Date
  updatedAt: Date
}) {
  const userId = String(user._id)
  const [paidPayments, pending] = await Promise.all([
    PaymentModel.find({ userId, status: 'PAID' }).sort({ confirmedAt: -1 }).lean(),
    PaymentModel.findOne({ userId, status: 'PENDING' }).sort({ createdAt: -1 }).lean(),
  ])
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0)
  const last = paidPayments[0]

  let referrerName: string | undefined
  if (user.referredByUserId) {
    const referrer = await AppUserModel.findById(user.referredByUserId).lean()
    referrerName = referrer?.name || referrer?.referralCode
  }

  return {
    id: userId,
    name: user.name,
    phone: user.phone,
    displayPhone: user.phone ? formatDisplayPhone(user.phone) : undefined,
    email: user.email,
    referralCode: user.referralCode,
    referredByCode: user.referredByCode,
    referredByUserId: user.referredByUserId,
    referrerName,
    membershipStatus: user.membershipStatus ?? 'unpaid',
    paidAt: user.paidAt?.toISOString(),
    notes: user.notes ?? '',
    walletBalance: user.walletBalance,
    totalPaid,
    paymentCount: paidPayments.length,
    lastPaymentAt: last?.confirmedAt?.toISOString() ?? last?.updatedAt?.toISOString(),
    pendingPayment: pending
      ? {
          id: String(pending._id),
          referenceCode: pending.referenceCode,
          amount: pending.amount,
          currency: pending.currency,
          transactionId: pending.transactionId,
          createdAt: pending.createdAt.toISOString(),
        }
      : undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

function statusFilter(status: 'paid' | 'unpaid') {
  if (status === 'paid') return { membershipStatus: 'paid' }
  return { $or: [{ membershipStatus: 'unpaid' }, { membershipStatus: { $exists: false } }] }
}

export async function listStudents(query: {
  status?: 'paid' | 'unpaid' | 'all'
  q?: string
  limit?: number
}) {
  const filter: Record<string, unknown> = { role: { $ne: 'admin' } }
  if (query.status && query.status !== 'all') {
    Object.assign(filter, statusFilter(query.status))
  }

  const q = query.q?.trim()
  if (q) {
    const digits = q.replace(/\D/g, '')
    const or: Record<string, unknown>[] = [
      { name: new RegExp(q, 'i') },
      { referralCode: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
    ]
    if (digits.length >= 3) or.push({ phone: new RegExp(digits, 'i') })
    filter.$or = or
  }

  const users = await AppUserModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(query.limit ?? 200)
    .lean()

  return Promise.all(users.map((u) => enrichStudent(u as never)))
}

export async function getStudentStats() {
  const settings = await getPaymentSettings()
  const [totalStudents, paidStudents, unpaidStudents, pendingPayments, revenueAgg] = await Promise.all([
    AppUserModel.countDocuments({ role: { $ne: 'admin' } }),
    AppUserModel.countDocuments({ role: { $ne: 'admin' }, membershipStatus: 'paid' }),
    AppUserModel.countDocuments({ role: { $ne: 'admin' }, ...statusFilter('unpaid') }),
    PaymentModel.countDocuments({ status: 'PENDING' }),
    PaymentModel.aggregate<{ total: number }>([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ])

  const recentPaid = await listStudents({ status: 'paid', limit: 8 })
  const recentUnpaid = await listStudents({ status: 'unpaid', limit: 8 })

  return {
    totalStudents,
    paidStudents,
    unpaidStudents,
    pendingPayments,
    totalRevenue: revenueAgg[0]?.total ?? 0,
    currency: settings.currency,
    referralRewardAmount: settings.referralRewardAmount,
    recentPaid,
    recentUnpaid,
  }
}

export async function getStudentById(userId: string) {
  const user = await AppUserModel.findById(userId)
  if (!user) return null
  return enrichStudent(user)
}

export async function findUserByContact(input: { phone?: string; email?: string }) {
  const { phone, email } = parseContact(input)
  const studentOnly = { role: { $ne: 'admin' as const } }
  if (phone) {
    const byPhone = await AppUserModel.findOne({ phone, ...studentOnly })
    if (byPhone) return byPhone
  }
  if (email) {
    const byEmail = await AppUserModel.findOne({ email, ...studentOnly })
    if (byEmail) return byEmail
  }
  return null
}
