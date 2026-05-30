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
  membershipDays: number
  siteFreeAccessEnabled: boolean
  siteFreeAccessUntil?: Date
  autoTrialDays: number
  accessTip: string
  payPageTip: string
  programsEnabled: boolean
  programForexAmount: number
  programCryptoAmount: number
  programBundleAmount: number
  physicalClassesEnabled: boolean
  physicalClassSchedule: string
  physicalClassLocation: string
  physicalClassNote: string
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
    membershipDays: { type: Number, default: 60 },
    siteFreeAccessEnabled: { type: Boolean, default: false },
    siteFreeAccessUntil: { type: Date },
    autoTrialDays: { type: Number, default: 7 },
    accessTip: { type: String, default: '' },
    payPageTip: { type: String, default: '' },
    programsEnabled: { type: Boolean, default: true },
    programForexAmount: { type: Number, default: 300_000 },
    programCryptoAmount: { type: Number, default: 300_000 },
    programBundleAmount: { type: Number, default: 500_000 },
    physicalClassesEnabled: { type: Boolean, default: true },
    physicalClassSchedule: { type: String, default: '' },
    physicalClassLocation: { type: String, default: 'Kigali, Remera' },
    physicalClassNote: { type: String, default: '' },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'payment_settings' },
)

export const PaymentSettingsModel = model<PaymentSettingsDocument>(
  'PaymentSettings',
  paymentSettingsSchema,
)
