import { Schema, model } from 'mongoose'

export type ReferralRewardStatus = 'PENDING' | 'CREDITED' | 'CANCELLED'
export type ReferralRewardType = 'CASH' | 'POINTS'

export interface ReferralRewardDocument {
  referrerId: string
  referredUserId: string
  rewardType: ReferralRewardType
  paymentId?: string
  rewardAmount: number
  currency: string
  status: ReferralRewardStatus
  createdAt: Date
  creditedAt?: Date
}

const referralRewardSchema = new Schema<ReferralRewardDocument>(
  {
    referrerId: { type: String, required: true, index: true },
    referredUserId: { type: String, required: true, index: true },
    rewardType: { type: String, enum: ['CASH', 'POINTS'], required: true, default: 'CASH', index: true },
    paymentId: { type: String, sparse: true, unique: true },
    rewardAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'RWF' },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'CREDITED', 'CANCELLED'],
      default: 'CREDITED',
    },
    createdAt: { type: Date, required: true, default: Date.now },
    creditedAt: { type: Date },
  },
  { collection: 'referral_rewards' },
)

referralRewardSchema.index({ referredUserId: 1, status: 1 })
referralRewardSchema.index(
  { referredUserId: 1, rewardType: 1 },
  { unique: true, partialFilterExpression: { rewardType: 'POINTS' } },
)

export const ReferralRewardModel = model<ReferralRewardDocument>('ReferralReward', referralRewardSchema)
