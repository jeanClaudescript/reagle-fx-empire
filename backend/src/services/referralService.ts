import { AppUserModel } from '../models/AppUser.js'
import { PaymentModel } from '../models/Payment.js'
import { ReferralRewardModel } from '../models/ReferralReward.js'
import { generateReferenceCode } from '../utils/referenceCode.js'
import { normalizeEmail } from '../utils/email.js'
import { getPaymentSettings } from './paymentSettingsService.js'

export type ReferrerRejectReason =
  | 'invalid_code'
  | 'self_referral'
  | 'same_contact'
  | 'already_referred'
  | 'already_paid'

export type ReferrerApplyResult =
  | { ok: true; referrerId: string; referrerCode: string }
  | { ok: false; reason: ReferrerRejectReason }

export async function ensureUserReferralCode(userId: string) {
  const user = await AppUserModel.findById(userId)
  if (!user) return null
  if (user.referralCode) return user.referralCode
  let code = generateReferenceCode().replace('RFX-', 'REF-')
  for (let i = 0; i < 5; i += 1) {
    const exists = await AppUserModel.findOne({ referralCode: code })
    if (!exists) break
    code = `REF-${generateReferenceCode().slice(4)}`
  }
  user.referralCode = code
  user.updatedAt = new Date()
  await user.save()
  return code
}

export async function applyReferrerIfEligible(
  userId: string,
  referrerCodeRaw: string,
  contact?: { phone?: string; email?: string },
): Promise<ReferrerApplyResult> {
  const referrerCode = referrerCodeRaw.trim().toUpperCase()
  if (!referrerCode) return { ok: false, reason: 'invalid_code' }

  const user = await AppUserModel.findById(userId)
  if (!user) return { ok: false, reason: 'invalid_code' }

  if (user.referredByUserId) return { ok: false, reason: 'already_referred' }

  const paidCount = await PaymentModel.countDocuments({ userId, status: 'PAID' })
  if (paidCount > 0) return { ok: false, reason: 'already_paid' }

  const referrer = await AppUserModel.findOne({ referralCode: referrerCode })
  if (!referrer) return { ok: false, reason: 'invalid_code' }

  const referrerId = String(referrer._id)
  if (referrerId === userId) return { ok: false, reason: 'self_referral' }

  const userPhone = contact?.phone?.trim() || user.phone
  const userEmail = contact?.email?.trim() || user.email
  if (userPhone && referrer.phone && userPhone === referrer.phone) {
    return { ok: false, reason: 'same_contact' }
  }
  if (userEmail && referrer.email && normalizeEmail(userEmail) === normalizeEmail(referrer.email)) {
    return { ok: false, reason: 'same_contact' }
  }

  user.referredByUserId = referrerId
  user.referredByCode = referrerCode
  user.updatedAt = new Date()
  await user.save()

  return { ok: true, referrerId, referrerCode }
}

export function referralApplyErrorMessage(reason: ReferrerRejectReason): string | null {
  if (reason === 'self_referral') return 'You cannot use your own referral code'
  if (reason === 'same_contact') return 'This referral code cannot be used with your phone or email'
  return null
}

export async function creditReferrerOnFirstPayment(paymentId: string, referredUserId: string) {
  const referred = await AppUserModel.findById(referredUserId)
  if (!referred?.referredByUserId) return null

  if (referred.referredByUserId === referredUserId) return null

  const paidBefore = await PaymentModel.countDocuments({
    userId: referredUserId,
    status: 'PAID',
    _id: { $ne: paymentId },
  })
  if (paidBefore > 0) return null

  const priorReward = await ReferralRewardModel.findOne({
    referredUserId,
    status: 'CREDITED',
  })
  if (priorReward) return priorReward

  const existing = await ReferralRewardModel.findOne({ paymentId })
  if (existing) return existing

  const referrer = await AppUserModel.findById(referred.referredByUserId)
  if (!referrer) return null

  const settings = await getPaymentSettings()
  const rewardAmount = settings.referralRewardAmount
  const reward = await ReferralRewardModel.create({
    referrerId: referred.referredByUserId,
    referredUserId,
    paymentId,
    rewardAmount,
    currency: settings.currency,
    status: 'CREDITED',
    creditedAt: new Date(),
  })

  await AppUserModel.findByIdAndUpdate(referred.referredByUserId, {
    $inc: { walletBalance: rewardAmount },
    updatedAt: new Date(),
  })

  return reward
}

export async function listReferralRelationships(limit = 200) {
  const referredUsers = await AppUserModel.find({ referredByUserId: { $exists: true, $ne: '' } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  if (referredUsers.length === 0) return []

  const referrerIds = [...new Set(referredUsers.map((u) => u.referredByUserId!).filter(Boolean))]
  const referredIds = referredUsers.map((u) => String(u._id))

  const [referrers, paidPayments, rewards] = await Promise.all([
    AppUserModel.find({ _id: { $in: referrerIds } })
      .select('name phone email referralCode walletBalance')
      .lean(),
    PaymentModel.find({ userId: { $in: referredIds }, status: 'PAID' })
      .sort({ confirmedAt: -1 })
      .lean(),
    ReferralRewardModel.find({ referredUserId: { $in: referredIds } }).lean(),
  ])

  const referrerById = new Map(referrers.map((r) => [String(r._id), r]))
  const firstPaidByUser = new Map<string, (typeof paidPayments)[0]>()
  for (const p of paidPayments) {
    if (!firstPaidByUser.has(p.userId)) firstPaidByUser.set(p.userId, p)
  }
  const rewardByReferred = new Map(rewards.map((r) => [r.referredUserId, r]))

  return referredUsers.map((u) => {
    const id = String(u._id)
    const referrer = u.referredByUserId ? referrerById.get(u.referredByUserId) : undefined
    const paid = firstPaidByUser.get(id)
    const reward = rewardByReferred.get(id)
    const suspicious = u.referredByUserId === id

    return {
      id,
      referredName: u.name || u.phone || u.email || id,
      referredPhone: u.phone,
      referredEmail: u.email,
      referredByCode: u.referredByCode,
      membershipStatus: u.membershipStatus,
      referrerId: u.referredByUserId,
      referrerName: referrer?.name || referrer?.phone || referrer?.email,
      referrerPhone: referrer?.phone,
      referrerCode: referrer?.referralCode,
      hasPaidPayment: Boolean(paid),
      firstPaidAt: paid?.confirmedAt?.toISOString(),
      paymentReference: paid?.referenceCode,
      reward: reward
        ? {
            id: String(reward._id),
            amount: reward.rewardAmount,
            currency: reward.currency,
            status: reward.status,
            creditedAt: reward.creditedAt?.toISOString(),
            paymentId: reward.paymentId,
          }
        : null,
      suspicious,
      createdAt: u.createdAt.toISOString(),
    }
  })
}
