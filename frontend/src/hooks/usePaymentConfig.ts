import { useEffect, useState } from 'react'
import { paymentApi, type PaymentConfig } from '@/services/api'
import { paymentPriceLabel } from '@/utils/paymentPriceLabel'

export function usePaymentConfig() {
  const [config, setConfig] = useState<PaymentConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    paymentApi
      .getConfig()
      .then((res) => {
        if (!cancelled) {
          setConfig(res.data)
          setError(false)
        }
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const priceLabel = paymentPriceLabel(config)

  return { config, loading, error, priceLabel, paymentsEnabled: config?.paymentsEnabled ?? true }
}
