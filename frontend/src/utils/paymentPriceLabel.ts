import type { PaymentConfig } from '@/services/api'

/** Public price string for CTAs — respects program tiers when enabled. */
export function paymentPriceLabel(config: PaymentConfig | null): string | null {
  if (!config?.paymentsEnabled) return null
  const { currency } = config
  if (config.programsEnabled) {
    const min = Math.min(config.programForexAmount, config.programCryptoAmount)
    const max = config.programBundleAmount
    if (min === max) return `${max.toLocaleString()} ${currency}`
    return `${min.toLocaleString()} – ${max.toLocaleString()} ${currency}`
  }
  return `${config.defaultAmount.toLocaleString()} ${currency}`
}

export function programPlanLabel(type?: string | null) {
  if (type === 'forex') return 'Forex'
  if (type === 'crypto') return 'Crypto'
  if (type === 'bundle') return 'Forex + Crypto'
  return null
}
