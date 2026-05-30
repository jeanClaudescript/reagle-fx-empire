import { useEffect, useState } from 'react'
import { marketApi } from '@/services/api'

export function pairToSymbol(pair: string) {
  return pair.replace('/', '').toUpperCase()
}

export function useLivePrice(pair = 'EUR/USD', refreshMs = 5_000) {
  const symbol = pairToSymbol(pair)
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await marketApi.price(symbol)
        if (!cancelled) setPrice(res.data.mid)
      } catch {
        /* keep last price */
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
  }, [symbol, refreshMs])

  return { price, loading, symbol }
}
