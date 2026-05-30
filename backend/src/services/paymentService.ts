import { AppUserModel } from '../models/AppUser.js'
import { PaymentModel, type PaymentStatus } from '../models/Payment.js'
import { generateReferenceCode } from '../utils/referenceCode.js'
import { buildTelUssdHref } from '../utils/ussdTel.js'
import { formatDisplayPhone, normalizeRwPhone } from '../utils/phone.js'
import { creditReferrerOnFirstPayment, ensureUserReferralCode } from './referralService.js'
import { env } from '../config/env.js'
import { isProgramPlanId, type ProgramPlanId } from '../types/program.js'
import { getPaymentSettings, resolveProgramAmount, type PaymentSettings } from './paymentSettingsService.js'
import { findUserByContact, markStudentPaid } from './studentService.js'
import { grantMembership } from './membershipService.js'
import { isValidEmail, normalizeEmail } from '../utils/email.js'

function buildUssdFromTemplate(template: string, merchantPhone: string, amount: number) {
  const display = formatDisplayPhone(merchantPhone)
  const body = template
    .replace('{phone}', display.replace(/\D/g, ''))
    .replace('{amount}', String(amount))
  return `*${body.replace(/^\*|\*$/g, '')}#`
}

function buildUssdDial(settings: PaymentSettings, merchantPhone: string, amount: number) {
  return buildUssdFromTemplate(settings.ussdTemplate, merchantPhone, amount)
}

async function uniqueReferenceCode() {
  for (let i = 0; i < 8; i += 1) {
    const code = generateReferenceCode()
    const exists = await PaymentModel.findOne({ referenceCode: code })
    if (!exists) return code
  }
  throw new Error('Could not generate reference code')
}

async function uniqueUserReferralCode() {
  for (let i = 0; i < 8; i += 1) {
    const code = `REF-${generateReferenceCode().slice(4)}`
    const exists = await AppUserModel.findOne({ referralCode: code })
    if (!exists) return code
  }
  throw new Error('Could not generate referral code')
}

export async function findOrCreateUser(input: {
  phone?: string
  email?: string
  name?: string
  referrerCode?: string
}) {
  const phoneRaw = input.phone?.trim()
  const emailRaw = input.email?.trim()
  if (!phoneRaw && !emailRaw) throw new Error('Phone or email is required')

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

  let user = await findUserByContact({ phone, email })
  if (!user) {
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

    user = await AppUserModel.create({
      phone,
      email,
      name: input.name?.trim() || undefined,
      role: 'student',
      referralCode: await uniqueUserReferralCode(),
      referredByCode,
      referredByUserId,
      membershipStatus: 'unpaid',
      walletBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const settings = await getPaymentSettings()
    if (settings.autoTrialDays > 0) {
      await grantMembership(String(user._id), settings.autoTrialDays)
      user = (await AppUserModel.findById(user._id))!
    }
  } else {
    let changed = false
    if (input.name?.trim() && user.name !== input.name.trim()) {
      user.name = input.name.trim()
      changed = true
    }
    if (phone && !user.phone) {
      user.phone = phone
      changed = true
    }
    if (email && !user.email) {
      user.email = email
      changed = true
    }
    if (changed) {
      user.updatedAt = new Date()
      await user.save()
    }
  }

  await ensureUserReferralCode(String(user._id))
  return user
}

export async function createPaymentRequest(input: {
  phone?: string
  email?: string
  name?: string
  amount?: number
  program?: ProgramPlanId
  referrerCode?: string
  provider?: 'MTN' | 'AIRTEL'
}) {
  const settings = await getPaymentSettings()
  if (!settings.paymentsEnabled) {
    throw new Error('Payments are temporarily disabled')
  }

  const user = await findOrCreateUser(input)

  let amount: number
  let programType: ProgramPlanId | undefined

  if (settings.programsEnabled) {
    if (!input.program || !isProgramPlanId(input.program)) {
      throw new Error('Please select a program plan')
    }
    programType = input.program
    amount = resolveProgramAmount(settings, programType)
  } else {
    amount = input.amount ?? settings.defaultAmount
    if (amount < 100) throw new Error('Amount must be at least 100')
    if (!settings.allowCustomAmount && input.amount != null && input.amount !== settings.defaultAmount) {
      throw new Error('Custom amounts are not allowed')
    }
  }

  const referenceCode = await uniqueReferenceCode()
  const merchantPhone = settings.merchantPhone

  let paymentPhone = user.phone
  if (!paymentPhone && input.phone?.trim()) {
    paymentPhone = normalizeRwPhone(input.phone)
  }
  if (!paymentPhone) {
    throw new Error('A phone number is required to start Mobile Money payment')
  }

  const payment = await PaymentModel.create({
    userId: String(user._id),
    phone: paymentPhone,
    programType,
    amount,
    currency: settings.currency,
    status: 'PENDING',
    referenceCode,
    provider: input.provider,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const provider = input.provider ?? 'MTN'
  const mtnUssdDial = buildUssdDial(settings, merchantPhone, amount)
  const airtelUssdDial = buildUssdFromTemplate(
    env.paymentAirtelUssdTemplate,
    merchantPhone,
    amount,
  )
  const ussdDial = provider === 'AIRTEL' ? airtelUssdDial : mtnUssdDial
  const defaultNote = `Include reference ${referenceCode} in payment message if your wallet allows.`
  const note = settings.paymentNote
    ? `${settings.paymentNote} Reference: ${referenceCode}.`
    : defaultNote

  return {
    payment,
    user,
    instructions: {
      merchantPhone: formatDisplayPhone(merchantPhone),
      merchantPhoneE164: merchantPhone,
      amount,
      currency: settings.currency,
      referenceCode,
      provider,
      ussdDial,
      mtnUssdDial,
      airtelUssdDial,
      telMerchant: `tel:${merchantPhone}`,
      telUssd: buildTelUssdHref(ussdDial),
      telMtnUssd: buildTelUssdHref(mtnUssdDial),
      telAirtelUssd: buildTelUssdHref(airtelUssdDial),
      note,
    },
  }
}

export async function updatePendingPayment(
  paymentId: string,
  patch: { amount?: number; phone?: string },
) {
  const payment = await PaymentModel.findById(paymentId)
  if (!payment) throw new Error('Payment not found')
  if (payment.status !== 'PENDING') throw new Error('Only pending payments can be edited')

  if (patch.amount != null) {
    const amount = Math.round(patch.amount)
    if (!Number.isFinite(amount) || amount < 100) throw new Error('Amount must be at least 100')
    payment.amount = amount
  }

  if (patch.phone?.trim()) {
    const phone = normalizeRwPhone(patch.phone)
    if (phone.length < 11) throw new Error('Invalid phone number')
    payment.phone = phone
  }

  payment.updatedAt = new Date()
  await payment.save()
  return payment
}

export async function submitTransactionId(paymentId: string, transactionId: string) {
  const tx = transactionId.trim()
  if (!tx) throw new Error('Transaction ID is required')

  const payment = await PaymentModel.findById(paymentId)
  if (!payment) throw new Error('Payment not found')
  if (payment.status === 'PAID') return payment

  const duplicate = await PaymentModel.findOne({
    transactionId: tx,
    _id: { $ne: paymentId },
    status: 'PAID',
  })
  if (duplicate) throw new Error('Transaction ID already used')

  payment.transactionId = tx
  payment.updatedAt = new Date()
  await payment.save()
  return payment
}

export async function confirmPayment(
  paymentId: string,
  confirmedBy: 'admin' | 'webhook' | 'auto_match',
  extra?: { transactionId?: string; provider?: 'MTN' | 'AIRTEL' | 'MANUAL' | 'WEBHOOK' },
) {
  const payment = await PaymentModel.findById(paymentId)
  if (!payment) throw new Error('Payment not found')
  if (payment.status === 'PAID') return payment

  if (extra?.transactionId) {
    const tx = extra.transactionId.trim()
    const duplicate = await PaymentModel.findOne({
      transactionId: tx,
      _id: { $ne: paymentId },
      status: 'PAID',
    })
    if (duplicate) throw new Error('Transaction ID already used')
    payment.transactionId = tx
  }

  payment.status = 'PAID'
  payment.confirmedAt = new Date()
  payment.confirmedBy = confirmedBy
  if (extra?.provider) payment.provider = extra.provider
  payment.updatedAt = new Date()
  await payment.save()

  await creditReferrerOnFirstPayment(String(payment._id), payment.userId)
  await markStudentPaid(payment.userId, undefined, payment.programType)
  return payment
}

export async function matchWebhookPayment(input: {
  phone: string
  amount: number
  referenceCode?: string
  transactionId: string
  provider: 'MTN' | 'AIRTEL'
}) {
  const phone = normalizeRwPhone(input.phone)
  const ref = input.referenceCode?.trim().toUpperCase()

  let payment = ref
    ? await PaymentModel.findOne({ referenceCode: ref, status: 'PENDING' })
    : null

  if (!payment) {
    payment = await PaymentModel.findOne({
      phone,
      amount: input.amount,
      status: 'PENDING',
    }).sort({ createdAt: -1 })
  }

  if (!payment) return null

  return confirmPayment(String(payment._id), 'webhook', {
    transactionId: input.transactionId,
    provider: input.provider,
  })
}

export function serializePayment(doc: {
  _id: unknown
  userId: string
  phone: string
  programType?: ProgramPlanId
  amount: number
  currency: string
  status: PaymentStatus
  referenceCode: string
  transactionId?: string
  provider?: string
  payerMessage?: string
  confirmedAt?: Date
  confirmedBy?: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: String(doc._id),
    userId: doc.userId,
    phone: doc.phone,
    displayPhone: formatDisplayPhone(doc.phone),
    programType: doc.programType,
    amount: doc.amount,
    currency: doc.currency,
    status: doc.status,
    referenceCode: doc.referenceCode,
    transactionId: doc.transactionId,
    provider: doc.provider,
    payerMessage: doc.payerMessage,
    confirmedAt: doc.confirmedAt?.toISOString(),
    confirmedBy: doc.confirmedBy,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}
