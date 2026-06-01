import { ReferralRewardModel } from '../models/ReferralReward.js'

/** Fix legacy paymentId_1 index that blocked multiple POINTS rewards (null duplicates). */
export async function ensureReferralRewardIndexes() {
  const collection = ReferralRewardModel.collection

  try {
    await collection.dropIndex('paymentId_1')
  } catch {
    /* index may not exist */
  }

  await collection.updateMany(
    { rewardType: 'POINTS', $or: [{ paymentId: null }, { paymentId: '' }] },
    { $unset: { paymentId: '' } },
  )

  await ReferralRewardModel.syncIndexes()
}
