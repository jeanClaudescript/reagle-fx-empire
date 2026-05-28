import { AppUserModel } from '../models/AppUser.js'
import { PaymentModel } from '../models/Payment.js'
import { ReferralRewardModel } from '../models/ReferralReward.js'
import { generateReferenceCode } from '../utils/referenceCode.js'
import { getPaymentSettings } from './paymentSettingsService.js'

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

export async function creditReferrerOnFirstPayment(paymentId: string, referredUserId: string) {
  const referred = await AppUserModel.findById(referredUserId)
  if (!referred?.referredByUserId) return null

  const paidBefore = await PaymentModel.countDocuments({
    userId: referredUserId,
    status: 'PAID',
    _id: { $ne: paymentId },
  })
  if (paidBefore > 0) return null

  const existing = await ReferralRewardModel.findOne({ paymentId })
  if (existing) return existing

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
