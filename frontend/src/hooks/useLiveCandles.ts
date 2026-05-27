import { useCallback, useEffect, useRef, useState } from 'react'

export interface OHLC {
  open: number
  high: number
  low: number
  close: number
}

const BASE_PRICE = 1.0842
const VOLATILITY = 0.00042
const TICK_MS = 80
const CANDLE_MS = 2800
const MAX_CANDLES = 48

function createCandle(open: number): OHLC {
  const bias = (Math.random() - 0.46) * VOLATILITY * 2
  const close = open + bias
  const high = Math.max(open, close) + Math.random() * VOLATILITY * 0.6
  const low = Math.min(open, close) - Math.random() * VOLATILITY * 0.6
  return { open, high, low, close }
}

export function useLiveCandles() {
  const [candles, setCandles] = useState<OHLC[]>(() => {
    const initial: OHLC[] = []
    let price = BASE_PRICE
    for (let i = 0; i < 24; i++) {
      const c = createCandle(price)
      initial.push(c)
      price = c.close
    }
    return initial
  })

  const [live, setLive] = useState<OHLC>(() => {
    const last = candles[candles.length - 1]
    return createCandle(last?.close ?? BASE_PRICE)
  })

  const [formProgress, setFormProgress] = useState(0)
  const liveRef = useRef(live)
  liveRef.current = live

  const tick = useCallback(() => {
    setLive((prev) => {
      const delta = (Math.random() - 0.5) * VOLATILITY * 0.22
      const close = prev.close + delta
      return {
        open: prev.open,
        close,
        high: Math.max(prev.high, close),
        low: Math.min(prev.low, close),
      }
    })
  }, [])

  useEffect(() => {
    const tickId = window.setInterval(tick, TICK_MS)
    return () => clearInterval(tickId)
  }, [tick])

  useEffect(() => {
    let candleStart = Date.now()

    const progressId = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - candleStart) / (CANDLE_MS * 0.9))
      setFormProgress(p)
    }, 40)

    const candleId = window.setInterval(() => {
      const finalized = { ...liveRef.current }

      setCandles((prev) => {
        const next = [...prev, finalized]
        return next.length > MAX_CANDLES ? next.slice(-MAX_CANDLES) : next
      })

      setLive(createCandle(finalized.close))
      candleStart = Date.now()
      setFormProgress(0)
    }, CANDLE_MS)

    return () => {
      clearInterval(progressId)
      clearInterval(candleId)
    }
  }, [])

  const pair = 'EUR/USD'
  const lastPrice = live.close
  const change = ((live.close - live.open) / live.open) * 100
  const isBullish = live.close >= live.open

  return { candles, live, formProgress, pair, lastPrice, change, isBullish }
}
