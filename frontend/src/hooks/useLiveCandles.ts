import { useCallback, useEffect, useRef, useState } from 'react'
import { generateCandles } from '@/classroom/chart/generateCandles'
import { marketApi, type MarketCandle } from '@/services/api'
import { pairToSymbol } from '@/hooks/useLivePrice'

export interface OHLC {
  open: number
  high: number
  low: number
  close: number
}

const TICK_MS = 80
const CANDLE_MS = 60_000
const MAX_CANDLES = 48

function candleToOhlc(c: MarketCandle): OHLC {
  return { open: c.open, high: c.high, low: c.low, close: c.close }
}

function syntheticCandles(symbol: string, count: number): OHLC[] {
  return generateCandles(symbol, count, 1).map((c) => ({
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }))
}

function displayPair(symbol: string) {
  const s = symbol.replace('/', '').toUpperCase()
  if (s.length === 6) return `${s.slice(0, 3)}/${s.slice(3)}`
  return symbol
}

export function useLiveCandles(symbol = 'EURUSD') {
  const normalized = pairToSymbol(symbol)
  const pair = displayPair(normalized)

  const [candles, setCandles] = useState<OHLC[]>([])
  const [live, setLive] = useState<OHLC>({ open: 0, high: 0, low: 0, close: 0 })
  const [formProgress, setFormProgress] = useState(0)
  const [ready, setReady] = useState(false)

  const liveRef = useRef(live)
  liveRef.current = live

  const applyPrice = useCallback((mid: number) => {
    setLive((prev) => {
      if (prev.close === 0) {
        return { open: mid, close: mid, high: mid, low: mid }
      }
      const close = mid
      return {
        open: prev.open,
        close,
        high: Math.max(prev.high, close),
        low: Math.min(prev.low, close),
      }
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadCandles = async () => {
      try {
        const res = await marketApi.candles(normalized, '1', MAX_CANDLES)
        if (cancelled) return
        if (res.data.length === 0) throw new Error('empty')
        const historical = res.data.slice(0, -1).map(candleToOhlc)
        const last = res.data[res.data.length - 1]
        setCandles(historical.length ? historical : [candleToOhlc(last)])
        setLive(candleToOhlc(last))
        setReady(true)
      } catch {
        if (cancelled) return
        const fallback = syntheticCandles(normalized, MAX_CANDLES)
        const last = fallback[fallback.length - 1]
        setCandles(fallback.slice(0, -1).length ? fallback.slice(0, -1) : [last])
        setLive(last)
        setReady(true)
      }
    }

    void loadCandles()
    const candlePoll = window.setInterval(() => void loadCandles(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(candlePoll)
    }
  }, [normalized])

  useEffect(() => {
    let cancelled = false

    const pollPrice = async () => {
      try {
        const res = await marketApi.price(normalized)
        if (!cancelled) applyPrice(res.data.mid)
      } catch {
        /* ignore */
      }
    }

    void pollPrice()
    const pricePoll = window.setInterval(() => void pollPrice(), 5_000)
    return () => {
      cancelled = true
      window.clearInterval(pricePoll)
    }
  }, [normalized, applyPrice])

  useEffect(() => {
    if (!ready) return

    const tickId = window.setInterval(() => {
      setLive((prev) => {
        if (prev.close === 0) return prev
        return { ...prev }
      })
    }, TICK_MS)

    let candleStart = Date.now()
    const progressId = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - candleStart) / (CANDLE_MS * 0.9))
      setFormProgress(p)
    }, 40)

    const candleId = window.setInterval(() => {
      const finalized = { ...liveRef.current }
      if (finalized.close === 0) return

      setCandles((prev) => {
        const next = [...prev, finalized]
        return next.length > MAX_CANDLES ? next.slice(-MAX_CANDLES) : next
      })

      setLive({
        open: finalized.close,
        close: finalized.close,
        high: finalized.close,
        low: finalized.close,
      })
      candleStart = Date.now()
      setFormProgress(0)
    }, CANDLE_MS)

    return () => {
      window.clearInterval(tickId)
      window.clearInterval(progressId)
      window.clearInterval(candleId)
    }
  }, [ready])

  const lastPrice = live.close || 0
  const change = live.open ? ((live.close - live.open) / live.open) * 100 : 0
  const isBullish = live.close >= live.open

  return { candles, live, formProgress, pair, lastPrice, change, isBullish, ready }
}
