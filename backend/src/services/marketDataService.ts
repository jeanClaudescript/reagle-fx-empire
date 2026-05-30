import { env } from '../config/env.js'

export type MarketQuote = {
  pair: string
  bid: number
  ask: number
  spread: number
  mid: number
  changePct?: number
  updatedAt: string
}

export type MarketCandle = {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export type EconomicEvent = {
  id: string
  time: string
  currency: string
  title: string
  impact: 'low' | 'medium' | 'high'
  date: string
}

export type ForexNewsItem = {
  id: string
  headline: string
  source: string
  url: string
  datetime: number
}

const WATCH_PAIRS: Array<{
  pair: string
  frankfurter?: { from: string; to: string }
  finnhub?: string
  spreadPips: number
}> = [
  { pair: 'EUR/USD', frankfurter: { from: 'EUR', to: 'USD' }, finnhub: 'OANDA:EUR_USD', spreadPips: 0.8 },
  { pair: 'GBP/USD', frankfurter: { from: 'GBP', to: 'USD' }, finnhub: 'OANDA:GBP_USD', spreadPips: 1.0 },
  { pair: 'USD/JPY', frankfurter: { from: 'USD', to: 'JPY' }, finnhub: 'OANDA:USD_JPY', spreadPips: 0.9 },
  { pair: 'AUD/USD', frankfurter: { from: 'AUD', to: 'USD' }, finnhub: 'OANDA:AUD_USD', spreadPips: 0.9 },
  { pair: 'USD/CAD', frankfurter: { from: 'USD', to: 'CAD' }, finnhub: 'OANDA:USD_CAD', spreadPips: 1.0 },
  { pair: 'XAU/USD', finnhub: 'OANDA:XAU_USD', spreadPips: 2.5 },
]

const spotHistory = new Map<string, Array<{ t: number; mid: number }>>()
const MAX_HISTORY = 120

function pipSize(pair: string) {
  return pair.includes('JPY') ? 0.01 : 0.0001
}

function symbolToPair(symbol: string) {
  const s = symbol.replace('/', '').toUpperCase()
  if (s.length === 6) return `${s.slice(0, 3)}/${s.slice(3)}`
  return symbol
}

function pairToSymbol(pair: string) {
  return pair.replace('/', '').toUpperCase()
}

function recordSpot(pair: string, mid: number) {
  const key = pairToSymbol(pair)
  const list = spotHistory.get(key) ?? []
  list.push({ t: Date.now(), mid })
  while (list.length > MAX_HISTORY) list.shift()
  spotHistory.set(key, list)
}

async function fetchFrankfurterRate(from: string, to: string) {
  const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`)
  if (!res.ok) throw new Error('Frankfurter rate fetch failed')
  const data = (await res.json()) as { rates: Record<string, number> }
  const rate = data.rates[to]
  if (!rate) throw new Error('Rate missing')
  return rate
}

async function fetchFinnhubQuote(symbol: string) {
  if (!env.finnhubApiKey) return null
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${env.finnhubApiKey}`,
  )
  if (!res.ok) return null
  const data = (await res.json()) as { c?: number; pc?: number }
  if (!data.c) return null
  return { mid: data.c, changePct: data.pc ? ((data.c - data.pc) / data.pc) * 100 : undefined }
}

export async function getMarketQuotes(): Promise<MarketQuote[]> {
  const out: MarketQuote[] = []

  for (const cfg of WATCH_PAIRS) {
    try {
      let mid: number | null = null
      let changePct: number | undefined

      if (cfg.finnhub) {
        const fq = await fetchFinnhubQuote(cfg.finnhub)
        if (fq) {
          mid = fq.mid
          changePct = fq.changePct
        }
      }

      if (mid == null && cfg.frankfurter) {
        mid = await fetchFrankfurterRate(cfg.frankfurter.from, cfg.frankfurter.to)
      }

      if (mid == null) continue

      const pip = pipSize(cfg.pair)
      const halfSpread = (cfg.spreadPips * pip) / 2
      recordSpot(cfg.pair, mid)

      out.push({
        pair: cfg.pair,
        mid,
        bid: Math.round((mid - halfSpread) * 100000) / 100000,
        ask: Math.round((mid + halfSpread) * 100000) / 100000,
        spread: Math.round(cfg.spreadPips * 10) / 10,
        changePct,
        updatedAt: new Date().toISOString(),
      })
    } catch {
      /* skip pair */
    }
  }

  return out
}

export async function getMarketCandles(symbol: string, interval = '1', limit = 60): Promise<MarketCandle[]> {
  const pair = symbolToPair(symbol)
  const cfg = WATCH_PAIRS.find((p) => p.pair === pair)
  const finnhubSymbol = cfg?.finnhub ?? `OANDA:${pair.replace('/', '_')}`

  if (env.finnhubApiKey) {
    const to = Math.floor(Date.now() / 1000)
    const resolution = interval === 'D' ? 'D' : interval
    const from = to - (resolution === 'D' ? limit * 86400 : limit * 60 * Number(resolution || 1))
    const url = `https://finnhub.io/api/v1/forex/candle?symbol=${encodeURIComponent(finnhubSymbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${env.finnhubApiKey}`
    const res = await fetch(url)
    if (res.ok) {
      const data = (await res.json()) as {
        s?: string
        t?: number[]
        o?: number[]
        h?: number[]
        l?: number[]
        c?: number[]
      }
      if (data.s === 'ok' && data.t?.length) {
        return data.t.map((time, i) => ({
          time,
          open: data.o![i],
          high: data.h![i],
          low: data.l![i],
          close: data.c![i],
        }))
      }
    }
  }

  const key = pairToSymbol(pair)
  const history = spotHistory.get(key) ?? []
  if (history.length >= 2) {
    const bucketMs = 60_000
    const buckets = new Map<number, number[]>()
    for (const pt of history) {
      const bucket = Math.floor(pt.t / bucketMs) * bucketMs
      const arr = buckets.get(bucket) ?? []
      arr.push(pt.mid)
      buckets.set(bucket, arr)
    }
    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .slice(-limit)
      .map(([t, vals]) => {
        const open = vals[0]
        const close = vals[vals.length - 1]
        return {
          time: Math.floor(t / 1000),
          open,
          high: Math.max(...vals),
          low: Math.min(...vals),
          close,
        }
      })
  }

  const quotes = await getMarketQuotes()
  const q = quotes.find((x) => x.pair === pair)
  const mid = q?.mid ?? 1.0842
  const now = Math.floor(Date.now() / 1000)
  return Array.from({ length: Math.min(limit, 30) }, (_, i) => {
    const close = mid + (Math.sin(i / 5) * mid * 0.0002)
    return { time: now - (limit - i) * 60, open: close, high: close * 1.0001, low: close * 0.9999, close }
  })
}

export async function getEconomicCalendar(): Promise<EconomicEvent[]> {
  if (env.finnhubApiKey) {
    const from = new Date().toISOString().slice(0, 10)
    const toDate = new Date()
    toDate.setDate(toDate.getDate() + 7)
    const to = toDate.toISOString().slice(0, 10)
    const res = await fetch(
      `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${env.finnhubApiKey}`,
    )
    if (res.ok) {
      const data = (await res.json()) as {
        economicCalendar?: Array<{
          country?: string
          event?: string
          impact?: string
          time?: string
          date?: string
        }>
      }
      return (data.economicCalendar ?? []).slice(0, 40).map((ev, i) => ({
        id: `fh-${i}-${ev.date}-${ev.time}`,
        time: ev.time?.slice(0, 5) ?? '—',
        currency: ev.country ?? '—',
        title: ev.event ?? 'Event',
        impact: (ev.impact?.toLowerCase() as 'low' | 'medium' | 'high') || 'medium',
        date: ev.date ?? from,
      }))
    }
  }

  const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json')
  if (!res.ok) throw new Error('Calendar unavailable')
  const data = (await res.json()) as Array<{
    title: string
    country: string
    date: string
    impact: string
  }>
  const today = new Date().toISOString().slice(0, 10)
  return data
    .filter((ev) => ev.date >= today)
    .slice(0, 30)
    .map((ev, i) => ({
      id: `ff-${i}-${ev.date}`,
      time: ev.date.includes(' ') ? ev.date.split(' ')[1]?.slice(0, 5) ?? '—' : '—',
      currency: ev.country,
      title: ev.title,
      impact: (ev.impact?.toLowerCase() as 'low' | 'medium' | 'high') || 'medium',
      date: ev.date.slice(0, 10),
    }))
}

export async function getForexNews(): Promise<ForexNewsItem[]> {
  if (!env.finnhubApiKey) return []
  const res = await fetch(`https://finnhub.io/api/v1/news?category=forex&token=${env.finnhubApiKey}`)
  if (!res.ok) return []
  const data = (await res.json()) as Array<{
    id?: number
    headline?: string
    source?: string
    url?: string
    datetime?: number
  }>
  return data.slice(0, 15).map((n) => ({
    id: String(n.id ?? n.headline),
    headline: n.headline ?? 'News',
    source: n.source ?? 'Forex',
    url: n.url ?? '#',
    datetime: n.datetime ?? Date.now() / 1000,
  }))
}

export async function getPairMid(symbol: string) {
  const pair = symbolToPair(symbol)
  const quotes = await getMarketQuotes()
  const hit = quotes.find((q) => q.pair === pair)
  return hit?.mid ?? null
}
