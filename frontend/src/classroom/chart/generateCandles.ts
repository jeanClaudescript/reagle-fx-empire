import type { CandlestickData, UTCTimestamp } from 'lightweight-charts'
import type { ClassroomSymbol } from '../types'

const BASE_PRICES: Record<string, number> = {
  EURUSD: 1.085,
  GBPUSD: 1.265,
  USDJPY: 149.5,
  AUDUSD: 0.655,
  USDCAD: 1.365,
  XAUUSD: 2320,
  BTCUSD: 67500,
}

function hashSeed(symbol: string) {
  let h = 0
  for (let i = 0; i < symbol.length; i += 1) {
    h = (h << 5) - h + symbol.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h) + 1
}

function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function generateCandles(
  symbol: ClassroomSymbol | string,
  count = 300,
  timeframeMinutes = 15,
): CandlestickData<UTCTimestamp>[] {
  const base = BASE_PRICES[symbol] ?? 1
  const seed = hashSeed(symbol)
  const now = Math.floor(Date.now() / 1000)
  const step = timeframeMinutes * 60
  const candles: CandlestickData<UTCTimestamp>[] = []
  let price = base

  for (let i = count - 1; i >= 0; i -= 1) {
    const t = (now - i * step) as UTCTimestamp
    const r1 = pseudoRandom(seed + i * 17)
    const r2 = pseudoRandom(seed + i * 31)
    const drift = (r1 - 0.5) * base * 0.002
    const open = price
    const close = open + drift
    const high = Math.max(open, close) + r2 * base * 0.001
    const low = Math.min(open, close) - r2 * base * 0.001
    candles.push({ time: t, open, high, low, close })
    price = close
  }

  return candles
}

export function timeframeToMinutes(tf: string) {
  if (tf === 'D') return 1440
  const n = Number(tf)
  return Number.isFinite(n) && n > 0 ? n : 15
}
