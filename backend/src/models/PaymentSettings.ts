import { Schema, model } from 'mongoose'

export interface PaymentSettingsDocument {
  key: 'singleton'
  merchantPhone: string
  defaultAmount: number
  currency: string
  ussdTemplate: string
  referralRewardAmount: number
  paymentNote: string
  paymentsEnabled: boolean
  allowCustomAmount: boolean
  updatedAt: Date
}

const paymentSettingsSchema = new Schema<PaymentSettingsDocument>(
  {
    key: { type: String, required: true, unique: true, enum: ['singleton'] },
    merchantPhone: { type: String, required: true },
    defaultAmount: { type: Number, required: true },
    currency: { type: String, required: true },
    ussdTemplate: { type: String, required: true },
    referralRewardAmount: { type: Number, required: true },
    paymentNote: { type: String, default: '' },
    paymentsEnabled: { type: Boolean, default: true },
    allowCustomAmount: { type: Boolean, default: false },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'payment_settings' },
)

export const PaymentSettingsModel = model<PaymentSettingsDocument>(
  'PaymentSettings',
  paymentSettingsSchema,
)
