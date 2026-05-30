import { AppUserModel } from '../models/AppUser.js'
import { getPaymentSettings } from './paymentSettingsService.js'

export type AccessMode = 'paid' | 'promo' | 'unpaid' | 'expired'

export function computePaidUntil(from: Date, days: number) {
  const end = new Date(from)
  end.setUTCDate(end.getUTCDate() + days)
  return end
}

export async function getMembershipDays() {
  const settings = await getPaymentSettings()
  return settings.membershipDays
}

export function daysRemaining(paidUntil?: Date | null) {
  if (!paidUntil) return null
  return Math.max(0, Math.ceil((paidUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

export async function getSiteFreeAccessStatus() {
  const settings = await getPaymentSettings()
  if (!settings.siteFreeAccessEnabled || !settings.siteFreeAccessUntil) {
    return { active: false, until: null as string | null, daysRemaining: null as number | null }
  }
  const untilMs = new Date(settings.siteFreeAccessUntil).getTime()
  if (untilMs <= Date.now()) {
    return { active: false, until: settings.siteFreeAccessUntil, daysRemaining: 0 }
  }
  return {
    active: true,
    until: settings.siteFreeAccessUntil,
    daysRemaining: Math.max(0, Math.ceil((untilMs - Date.now()) / 86400000)),
  }
}

export async function isSiteFreeAccessActive() {
  const status = await getSiteFreeAccessStatus()
  return status.active
}

export function isMembershipActive(user: { membershipStatus: string; paidUntil?: Date | null }) {
  if (user.membershipStatus !== 'paid') return false
  if (!user.paidUntil) return true
  return user.paidUntil.getTime() > Date.now()
}

export async function canAccessVipDesk(user: { membershipStatus: string; paidUntil?: Date | null }) {
  if (isMembershipActive(user)) return true
  return isSiteFreeAccessActive()
}

export async function resolveAccessMode(user: {
  membershipStatus: string
  paidUntil?: Date | null
  paidAt?: Date | null
}): Promise<AccessMode> {
  if (isMembershipActive(user)) return 'paid'
  if (await isSiteFreeAccessActive()) return 'promo'
  if (user.membershipStatus === 'paid' || user.paidAt || user.paidUntil) return 'expired'
  return 'unpaid'
}

export async function ensurePaidUntilForLegacy(userId: string) {
  const user = await AppUserModel.findById(userId)
  if (!user || user.membershipStatus !== 'paid' || user.paidUntil) return
  const days = await getMembershipDays()
  user.paidUntil = computePaidUntil(new Date(), days)
  user.updatedAt = new Date()
  await user.save()
}

export async function expireMembershipIfNeeded(userId: string) {
  const user = await AppUserModel.findById(userId)
  if (!user || user.membershipStatus !== 'paid' || !user.paidUntil) return user
  if (user.paidUntil.getTime() > Date.now()) return user
  user.membershipStatus = 'unpaid'
  user.updatedAt = new Date()
  await user.save()
  return user
}

/** Grant or extend VIP access. Optional custom days (admin free grant or payment). */
export async function grantMembership(userId: string, days?: number) {
  const duration = days ?? (await getMembershipDays())
  if (!Number.isFinite(duration) || duration < 1 || duration > 365) {
    throw new Error('Access days must be between 1 and 365')
  }

  const user = await AppUserModel.findById(userId)
  if (!user) throw new Error('User not found')

  const extendFrom =
    user.paidUntil && user.paidUntil.getTime() > Date.now() ? user.paidUntil : new Date()
  const paidUntil = computePaidUntil(extendFrom, duration)

  user.membershipStatus = 'paid'
  user.paidAt = user.paidAt ?? new Date()
  user.paidUntil = paidUntil
  user.updatedAt = new Date()
  await user.save()
  return user
}

export async function revokeMembership(userId: string) {
  const user = await AppUserModel.findById(userId)
  if (!user) throw new Error('User not found')
  user.membershipStatus = 'unpaid'
  user.paidUntil = undefined
  user.updatedAt = new Date()
  await user.save()
  return user
}

export function membershipMeta(user: { paidUntil?: Date | null }) {
  const until = user.paidUntil?.toISOString()
  const remaining = daysRemaining(user.paidUntil ?? null)
  return {
    paidUntil: until,
    daysRemaining: remaining,
    isExpiringSoon: remaining != null && remaining > 0 && remaining <= 7,
  }
}

export async function membershipMetaForUser(user: {
  membershipStatus: string
  paidUntil?: Date | null
}) {
  const mode = await resolveAccessMode(user)
  if (mode === 'promo') {
    const promo = await getSiteFreeAccessStatus()
    const remaining = promo.daysRemaining
    return {
      paidUntil: promo.until,
      daysRemaining: remaining,
      isExpiringSoon: remaining != null && remaining > 0 && remaining <= 7,
    }
  }
  return membershipMeta(user)
}
