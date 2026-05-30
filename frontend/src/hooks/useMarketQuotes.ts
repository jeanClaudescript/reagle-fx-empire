import { useEffect, useState } from 'react'
import { marketApi, type MarketQuote } from '@/services/api'

export function useMarketQuotes(refreshMs = 15_000) {
  const [quotes, setQuotes] = useState<MarketQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await marketApi.quotes()
        if (cancelled) return
        setQuotes(res.data)
        setUpdatedAt(res.at)
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load quotes')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const id = window.setInterval(() => void load(), refreshMs)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [refreshMs])

  return { quotes, loading, error, updatedAt }
}
