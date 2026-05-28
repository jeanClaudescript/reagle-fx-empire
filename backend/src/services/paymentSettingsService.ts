import { env } from '../config/env.js'
import { PaymentSettingsModel } from '../models/PaymentSettings.js'

export type PaymentSettings = {
  merchantPhone: string
  defaultAmount: number
  currency: string
  ussdTemplate: string
  referralRewardAmount: number
  paymentNote: string
  paymentsEnabled: boolean
  allowCustomAmount: boolean
}

function defaultsFromEnv(): PaymentSettings {
  return {
    merchantPhone: env.paymentMerchantPhone,
    defaultAmount: env.paymentDefaultAmount,
    currency: env.paymentCurrency,
    ussdTemplate: env.paymentUssdTemplate,
    referralRewardAmount: env.referralRewardAmount,
    paymentNote: '',
    paymentsEnabled: true,
    allowCustomAmount: false,
  }
}

function normalizePhone(raw: string) {
  return raw.replace(/\D/g, '')
}

function normalizeInput(input: Partial<PaymentSettings>): PaymentSettings {
  const base = defaultsFromEnv()
  const merchantPhone = normalizePhone(input.merchantPhone ?? base.merchantPhone)
  if (merchantPhone.length < 10) {
    throw new Error('Merchant phone must be at least 10 digits')
  }

  const defaultAmount = Number(input.defaultAmount ?? base.defaultAmount)
  if (!Number.isFinite(defaultAmount) || defaultAmount < 100) {
    throw new Error('Default amount must be at least 100')
  }

  const referralRewardAmount = Number(input.referralRewardAmount ?? base.referralRewardAmount)
  if (!Number.isFinite(referralRewardAmount) || referralRewardAmount < 0) {
    throw new Error('Referral reward must be 0 or greater')
  }

  const currency = (input.currency ?? base.currency).trim().toUpperCase() || 'RWF'
  const ussdTemplate = (input.ussdTemplate ?? base.ussdTemplate).trim()
  if (!ussdTemplate.includes('{phone}') || !ussdTemplate.includes('{amount}')) {
    throw new Error('USSD template must include {phone} and {amount}')
  }

  return {
    merchantPhone,
    defaultAmount: Math.round(defaultAmount),
    currency,
    ussdTemplate,
    referralRewardAmount: Math.round(referralRewardAmount),
    paymentNote: (input.paymentNote ?? base.paymentNote).trim(),
    paymentsEnabled: input.paymentsEnabled ?? base.paymentsEnabled,
    allowCustomAmount: input.allowCustomAmount ?? base.allowCustomAmount,
  }
}

function toIsoUpdatedAt(value: Date | string | undefined): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') return value
  return value.toISOString()
}

export function serializePaymentSettings(
  doc: PaymentSettings & { updatedAt?: Date | string },
) {
  return {
    merchantPhone: doc.merchantPhone,
    defaultAmount: doc.defaultAmount,
    currency: doc.currency,
    ussdTemplate: doc.ussdTemplate,
    referralRewardAmount: doc.referralRewardAmount,
    paymentNote: doc.paymentNote,
    paymentsEnabled: doc.paymentsEnabled,
    allowCustomAmount: doc.allowCustomAmount,
    updatedAt: toIsoUpdatedAt(doc.updatedAt),
  }
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const doc = await PaymentSettingsModel.findOne({ key: 'singleton' }).lean()
  if (!doc) return defaultsFromEnv()
  return normalizeInput({
    merchantPhone: doc.merchantPhone,
    defaultAmount: doc.defaultAmount,
    currency: doc.currency,
    ussdTemplate: doc.ussdTemplate,
    referralRewardAmount: doc.referralRewardAmount,
    paymentNote: doc.paymentNote,
    paymentsEnabled: doc.paymentsEnabled,
    allowCustomAmount: doc.allowCustomAmount,
  })
}

export async function updatePaymentSettings(input: Partial<PaymentSettings>) {
  const current = await getPaymentSettings()
  const next = normalizeInput({ ...current, ...input })
  const doc = await PaymentSettingsModel.findOneAndUpdate(
    { key: 'singleton' },
    { key: 'singleton', ...next, updatedAt: new Date() },
    { upsert: true, new: true },
  )
  if (!doc) throw new Error('Failed to save payment settings')
  return serializePaymentSettings({ ...next, updatedAt: doc.updatedAt })
}
