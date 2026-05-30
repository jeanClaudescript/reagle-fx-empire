import { Router } from 'express'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { PaymentModel } from '../models/Payment.js'
import { ReferralRewardModel } from '../models/ReferralReward.js'
import { AppUserModel } from '../models/AppUser.js'
import {
  confirmPayment,
  createPaymentRequest,
  matchWebhookPayment,
  serializePayment,
  submitTransactionId,
  updatePendingPayment,
} from '../services/paymentService.js'
import { env } from '../config/env.js'
import { formatDisplayPhone } from '../utils/phone.js'
import {
  getPaymentSettings,
  serializePaymentSettings,
  updatePaymentSettings,
  enableSiteFreeAccess,
  disableSiteFreeAccess,
} from '../services/paymentSettingsService.js'

export const paymentRoutes = Router()

paymentRoutes.post('/create', rateLimit(12, 60_000), async (req, res, next) => {
  try {
    const body = req.body as {
      phone?: string
      email?: string
      name?: string
      amount?: number
      program?: string
      referrerCode?: string
      provider?: 'MTN' | 'AIRTEL'
    }
    if (!body.phone?.trim() && !body.email?.trim()) {
      return res.status(400).json({ error: 'Phone or email is required' })
    }

    const { payment, user, instructions } = await createPaymentRequest({
      phone: body.phone,
      email: body.email,
      name: body.name,
      amount: body.amount,
      program: body.program as 'forex' | 'crypto' | 'bundle' | undefined,
      referrerCode: body.referrerCode,
      provider: body.provider,
    })

    return res.status(201).json({
      ok: true,
      data: {
        payment: serializePayment(payment),
        referralCode: user.referralCode,
        instructions,
      },
    })
  } catch (error) {
    return next(error)
  }
})

paymentRoutes.get('/config', async (_req, res, next) => {
  try {
    const settings = await getPaymentSettings()
    res.json({
      data: {
        ...serializePaymentSettings(settings),
        displayMerchantPhone: formatDisplayPhone(settings.merchantPhone),
      },
    })
  } catch (error) {
    next(error)
  }
})

paymentRoutes.get('/admin/settings', requireAdminAuth, async (_req, res, next) => {
  try {
    const settings = await getPaymentSettings()
    return res.json({ data: serializePaymentSettings(settings) })
  } catch (error) {
    return next(error)
  }
})

paymentRoutes.put('/admin/settings', requireAdminAuth, async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>
    const data = await updatePaymentSettings({
      merchantPhone: typeof body.merchantPhone === 'string' ? body.merchantPhone : undefined,
      defaultAmount:
        body.defaultAmount != null ? Number(body.defaultAmount) : undefined,
      currency: typeof body.currency === 'string' ? body.currency : undefined,
      ussdTemplate: typeof body.ussdTemplate === 'string' ? body.ussdTemplate : undefined,
      referralRewardAmount:
        body.referralRewardAmount != null ? Number(body.referralRewardAmount) : undefined,
      paymentNote: typeof body.paymentNote === 'string' ? body.paymentNote : undefined,
      paymentsEnabled:
        typeof body.paymentsEnabled === 'boolean' ? body.paymentsEnabled : undefined,
      allowCustomAmount:
        typeof body.allowCustomAmount === 'boolean' ? body.allowCustomAmount : undefined,
      membershipDays: body.membershipDays != null ? Number(body.membershipDays) : undefined,
      siteFreeAccessEnabled:
        typeof body.siteFreeAccessEnabled === 'boolean' ? body.siteFreeAccessEnabled : undefined,
      siteFreeAccessUntil:
        typeof body.siteFreeAccessUntil === 'string' ? body.siteFreeAccessUntil : body.siteFreeAccessUntil === null ? null : undefined,
      autoTrialDays: body.autoTrialDays != null ? Number(body.autoTrialDays) : undefined,
      accessTip: typeof body.accessTip === 'string' ? body.accessTip : undefined,
      payPageTip: typeof body.payPageTip === 'string' ? body.payPageTip : undefined,
      programsEnabled:
        typeof body.programsEnabled === 'boolean' ? body.programsEnabled : undefined,
      programForexAmount:
        body.programForexAmount != null ? Number(body.programForexAmount) : undefined,
      programCryptoAmount:
        body.programCryptoAmount != null ? Number(body.programCryptoAmount) : undefined,
      programBundleAmount:
        body.programBundleAmount != null ? Number(body.programBundleAmount) : undefined,
      physicalClassesEnabled:
        typeof body.physicalClassesEnabled === 'boolean' ? body.physicalClassesEnabled : undefined,
      physicalClassSchedule:
        typeof body.physicalClassSchedule === 'string' ? body.physicalClassSchedule : undefined,
      physicalClassLocation:
        typeof body.physicalClassLocation === 'string' ? body.physicalClassLocation : undefined,
      physicalClassNote:
        typeof body.physicalClassNote === 'string' ? body.physicalClassNote : undefined,
    })
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

paymentRoutes.post('/admin/site-free-access', requireAdminAuth, async (req, res, next) => {
  try {
    const days = Number((req.body as { days?: number }).days)
    const data = await enableSiteFreeAccess(days)
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

paymentRoutes.post('/admin/site-free-access/disable', requireAdminAuth, async (_req, res, next) => {
  try {
    const data = await disableSiteFreeAccess()
    return res.json({ ok: true, data })
  } catch (error) {
    return next(error)
  }
})

paymentRoutes.get('/status/:referenceCode', async (req, res, next) => {
  try {
    const code = req.params.referenceCode.trim().toUpperCase()
    const payment = await PaymentModel.findOne({ referenceCode: code })
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    return res.json({ data: serializePayment(payment) })
  } catch (error) {
    return next(error)
  }
})

/** Stub for MTN/Airtel webhook — verify signature in production. */
paymentRoutes.post('/webhook/momo', async (req, res, next) => {
  try {
    if (env.momoWebhookSecret) {
      const sig = req.header('x-webhook-signature')
      if (sig !== env.momoWebhookSecret) {
        return res.status(401).json({ error: 'Invalid webhook signature' })
      }
    }

    const body = req.body as {
      phone?: string
      amount?: number
      referenceCode?: string
      transactionId?: string
      provider?: 'MTN' | 'AIRTEL'
    }

    if (!body.phone || !body.amount || !body.transactionId) {
      return res.status(400).json({ error: 'phone, amount, and transactionId required' })
    }

    const payment = await matchWebhookPayment({
      phone: body.phone,
      amount: body.amount,
      referenceCode: body.referenceCode,
      transactionId: body.transactionId,
      provider: body.provider ?? 'MTN',
    })

    if (!payment) {
      return res.status(404).json({ error: 'No matching pending payment' })
    }

    return res.json({ ok: true, data: serializePayment(payment) })
  } catch (error) {
    return next(error)
  }
})

paymentRoutes.get('/admin/list', requireAdminAuth, async (req, res, next) => {
  try {
    const status = (req.query.status as string | undefined)?.toUpperCase()
    const q = (req.query.q as string | undefined)?.trim()
    const filter: Record<string, unknown> = {}
    if (status && status !== 'ALL') filter.status = status
    if (q) {
      filter.$or = [
        { phone: new RegExp(q.replace(/\D/g, ''), 'i') },
        { referenceCode: new RegExp(q, 'i') },
        { transactionId: new RegExp(q, 'i') },
      ]
    }

    const docs = await PaymentModel.find(filter).sort({ createdAt: -1 }).limit(200).lean()
    return res.json({ data: docs.map((d) => serializePayment(d as never)) })
  } catch (error) {
    return next(error)
  }
})

paymentRoutes.post('/admin/:id/approve', requireAdminAuth, async (req, res, next) => {
  try {
    const payment = await confirmPayment(req.params.id, 'admin', {
      transactionId: (req.body as { transactionId?: string }).transactionId,
      provider: 'MANUAL',
    })
    return res.json({ ok: true, data: serializePayment(payment) })
  } catch (error) {
    return next(error)
  }
})

paymentRoutes.patch('/admin/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const body = req.body as { amount?: number; phone?: string }
    const payment = await updatePendingPayment(req.params.id, {
      amount: body.amount != null ? Number(body.amount) : undefined,
      phone: body.phone,
    })
    return res.json({ ok: true, data: serializePayment(payment) })
  } catch (error) {
    return next(error)
  }
})

paymentRoutes.post('/admin/:id/reject', requireAdminAuth, async (req, res, next) => {
  try {
    const payment = await PaymentModel.findByIdAndUpdate(
      req.params.id,
      { status: 'FAILED', updatedAt: new Date() },
      { new: true },
    )
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    return res.json({ ok: true, data: serializePayment(payment) })
  } catch (error) {
    return next(error)
  }
})

paymentRoutes.get('/admin/referrals', requireAdminAuth, async (_req, res, next) => {
  try {
    const rewards = await ReferralRewardModel.find().sort({ createdAt: -1 }).limit(100).lean()
    const userIds = [
      ...new Set(
        rewards.flatMap((r) => [r.referrerId, r.referredUserId].filter(Boolean)),
      ),
    ]
    const users = userIds.length
      ? await AppUserModel.find({ _id: { $in: userIds } })
          .select('name phone email')
          .lean()
      : []
    const nameById = new Map(
      users.map((u) => [
        String(u._id),
        (u.name || u.phone || u.email || String(u._id)).trim(),
      ]),
    )

    return res.json({
      data: rewards.map((r) => ({
        id: String(r._id),
        referrerId: r.referrerId,
        referredUserId: r.referredUserId,
        referrerName: nameById.get(r.referrerId),
        referredName: nameById.get(r.referredUserId),
        paymentId: r.paymentId,
        rewardAmount: r.rewardAmount,
        currency: r.currency,
        status: r.status,
        createdAt: r.createdAt,
        creditedAt: r.creditedAt,
      })),
    })
  } catch (error) {
    return next(error)
  }
})

paymentRoutes.post('/:id/submit-transaction', rateLimit(20, 60_000), async (req, res, next) => {
  try {
    const tx = (req.body as { transactionId?: string }).transactionId
    if (!tx?.trim()) return res.status(400).json({ error: 'transactionId is required' })
    const payment = await submitTransactionId(req.params.id, tx)
    return res.json({ ok: true, data: serializePayment(payment) })
  } catch (error) {
    return next(error)
  }
})
