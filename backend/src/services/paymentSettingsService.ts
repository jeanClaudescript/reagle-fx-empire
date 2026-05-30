import { env } from '../config/env.js'
import { PaymentSettingsModel } from '../models/PaymentSettings.js'
import type { ProgramPlanId } from '../types/program.js'

export type PaymentSettings = {
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
  siteFreeAccessUntil: string | null
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
}

export function resolveProgramAmount(settings: PaymentSettings, program: ProgramPlanId) {
  switch (program) {
    case 'forex':
      return settings.programForexAmount
    case 'crypto':
      return settings.programCryptoAmount
    case 'bundle':
      return settings.programBundleAmount
    default:
      return settings.defaultAmount
  }
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
    membershipDays: env.membershipDays,
    siteFreeAccessEnabled: false,
    siteFreeAccessUntil: null,
    autoTrialDays: 7,
    accessTip: '',
    payPageTip: '',
    programsEnabled: true,
    programForexAmount: 300_000,
    programCryptoAmount: 300_000,
    programBundleAmount: 500_000,
    physicalClassesEnabled: true,
    physicalClassSchedule: '',
    physicalClassLocation: 'Kigali, Remera',
    physicalClassNote: '',
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

  const membershipDays = Number(input.membershipDays ?? base.membershipDays)
  if (!Number.isFinite(membershipDays) || membershipDays < 1 || membershipDays > 365) {
    throw new Error('Membership days must be between 1 and 365')
  }

  const autoTrialDays = Number(input.autoTrialDays ?? base.autoTrialDays)
  if (!Number.isFinite(autoTrialDays) || autoTrialDays < 0 || autoTrialDays > 90) {
    throw new Error('Auto trial days must be between 0 and 90')
  }

  const programForexAmount = Number(input.programForexAmount ?? base.programForexAmount)
  const programCryptoAmount = Number(input.programCryptoAmount ?? base.programCryptoAmount)
  const programBundleAmount = Number(input.programBundleAmount ?? base.programBundleAmount)
  for (const [label, value] of [
    ['Forex program amount', programForexAmount],
    ['Crypto program amount', programCryptoAmount],
    ['Bundle program amount', programBundleAmount],
  ] as const) {
    if (!Number.isFinite(value) || value < 100) {
      throw new Error(`${label} must be at least 100`)
    }
  }

  let siteFreeAccessUntil: string | null = null
  if (input.siteFreeAccessUntil) {
    const d = new Date(input.siteFreeAccessUntil)
    if (!Number.isFinite(d.getTime())) throw new Error('Invalid free access end date')
    siteFreeAccessUntil = d.toISOString()
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
    membershipDays: Math.round(membershipDays),
    siteFreeAccessEnabled: input.siteFreeAccessEnabled ?? base.siteFreeAccessEnabled,
    siteFreeAccessUntil,
    autoTrialDays: Math.round(autoTrialDays),
    accessTip: (input.accessTip ?? base.accessTip).trim(),
    payPageTip: (input.payPageTip ?? base.payPageTip).trim(),
    programsEnabled: input.programsEnabled ?? base.programsEnabled,
    programForexAmount: Math.round(programForexAmount),
    programCryptoAmount: Math.round(programCryptoAmount),
    programBundleAmount: Math.round(programBundleAmount),
    physicalClassesEnabled: input.physicalClassesEnabled ?? base.physicalClassesEnabled,
    physicalClassSchedule: (input.physicalClassSchedule ?? base.physicalClassSchedule).trim(),
    physicalClassLocation: (input.physicalClassLocation ?? base.physicalClassLocation).trim(),
    physicalClassNote: (input.physicalClassNote ?? base.physicalClassNote).trim(),
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
    membershipDays: doc.membershipDays ?? env.membershipDays,
    siteFreeAccessEnabled: doc.siteFreeAccessEnabled ?? false,
    siteFreeAccessUntil: doc.siteFreeAccessUntil ?? null,
    autoTrialDays: doc.autoTrialDays ?? 7,
    accessTip: doc.accessTip ?? '',
    payPageTip: doc.payPageTip ?? '',
    programsEnabled: doc.programsEnabled ?? true,
    programForexAmount: doc.programForexAmount ?? 300_000,
    programCryptoAmount: doc.programCryptoAmount ?? 300_000,
    programBundleAmount: doc.programBundleAmount ?? 500_000,
    physicalClassesEnabled: doc.physicalClassesEnabled ?? true,
    physicalClassSchedule: doc.physicalClassSchedule ?? '',
    physicalClassLocation: doc.physicalClassLocation ?? 'Kigali, Remera',
    physicalClassNote: doc.physicalClassNote ?? '',
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
    membershipDays: doc.membershipDays ?? env.membershipDays,
    siteFreeAccessEnabled: doc.siteFreeAccessEnabled,
    siteFreeAccessUntil: doc.siteFreeAccessUntil?.toISOString(),
    autoTrialDays: doc.autoTrialDays,
    accessTip: doc.accessTip,
    payPageTip: doc.payPageTip,
    programsEnabled: doc.programsEnabled,
    programForexAmount: doc.programForexAmount,
    programCryptoAmount: doc.programCryptoAmount,
    programBundleAmount: doc.programBundleAmount,
    physicalClassesEnabled: doc.physicalClassesEnabled,
    physicalClassSchedule: doc.physicalClassSchedule,
    physicalClassLocation: doc.physicalClassLocation,
    physicalClassNote: doc.physicalClassNote,
  })
}

export async function updatePaymentSettings(input: Partial<PaymentSettings>) {
  const current = await getPaymentSettings()
  const next = normalizeInput({ ...current, ...input })
  const update: Record<string, unknown> = {
    key: 'singleton',
    merchantPhone: next.merchantPhone,
    defaultAmount: next.defaultAmount,
    currency: next.currency,
    ussdTemplate: next.ussdTemplate,
    referralRewardAmount: next.referralRewardAmount,
    paymentNote: next.paymentNote,
    paymentsEnabled: next.paymentsEnabled,
    allowCustomAmount: next.allowCustomAmount,
    membershipDays: next.membershipDays,
    siteFreeAccessEnabled: next.siteFreeAccessEnabled,
    autoTrialDays: next.autoTrialDays,
    accessTip: next.accessTip,
    payPageTip: next.payPageTip,
    programsEnabled: next.programsEnabled,
    programForexAmount: next.programForexAmount,
    programCryptoAmount: next.programCryptoAmount,
    programBundleAmount: next.programBundleAmount,
    physicalClassesEnabled: next.physicalClassesEnabled,
    physicalClassSchedule: next.physicalClassSchedule,
    physicalClassLocation: next.physicalClassLocation,
    physicalClassNote: next.physicalClassNote,
    updatedAt: new Date(),
  }
  if (next.siteFreeAccessUntil) {
    update.siteFreeAccessUntil = new Date(next.siteFreeAccessUntil)
  }

  const doc = await PaymentSettingsModel.findOneAndUpdate(
    { key: 'singleton' },
    next.siteFreeAccessUntil
      ? { $set: update }
      : { $set: update, $unset: { siteFreeAccessUntil: 1 } },
    { upsert: true, new: true },
  )
  if (!doc) throw new Error('Failed to save payment settings')
  return serializePaymentSettings({ ...next, updatedAt: doc.updatedAt })
}

/** Admin shortcut: open paid site to all registered students for N days. */
export async function enableSiteFreeAccess(days: number) {
  if (!Number.isFinite(days) || days < 1 || days > 90) {
    throw new Error('Free access days must be between 1 and 90')
  }
  const until = new Date()
  until.setUTCDate(until.getUTCDate() + days)
  return updatePaymentSettings({
    siteFreeAccessEnabled: true,
    siteFreeAccessUntil: until.toISOString(),
  })
}

export async function disableSiteFreeAccess() {
  return updatePaymentSettings({
    siteFreeAccessEnabled: false,
    siteFreeAccessUntil: null,
  })
}
