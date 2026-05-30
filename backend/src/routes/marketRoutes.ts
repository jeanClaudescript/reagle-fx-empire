import { Router } from 'express'
import {
  getEconomicCalendar,
  getForexNews,
  getMarketCandles,
  getMarketQuotes,
  getPairMid,
} from '../services/marketDataService.js'

export const marketRoutes = Router()

marketRoutes.get('/quotes', async (_req, res, next) => {
  try {
    const data = await getMarketQuotes()
    return res.json({ data, source: 'live', at: new Date().toISOString() })
  } catch (error) {
    return next(error)
  }
})

marketRoutes.get('/candles', async (req, res, next) => {
  try {
    const symbol = String(req.query.symbol ?? 'EURUSD')
    const interval = String(req.query.interval ?? '1')
    const limit = Math.min(Number(req.query.limit ?? 60), 300)
    const data = await getMarketCandles(symbol, interval, limit)
    return res.json({ data, symbol, source: 'live', at: new Date().toISOString() })
  } catch (error) {
    return next(error)
  }
})

marketRoutes.get('/calendar', async (_req, res, next) => {
  try {
    const data = await getEconomicCalendar()
    return res.json({ data, source: 'live', at: new Date().toISOString() })
  } catch (error) {
    return next(error)
  }
})

marketRoutes.get('/news', async (_req, res, next) => {
  try {
    const data = await getForexNews()
    return res.json({ data, source: 'live', at: new Date().toISOString() })
  } catch (error) {
    return next(error)
  }
})

marketRoutes.get('/price', async (req, res, next) => {
  try {
    const symbol = String(req.query.symbol ?? 'EURUSD')
    const mid = await getPairMid(symbol)
    if (mid == null) return res.status(404).json({ error: 'Price unavailable' })
    return res.json({ data: { symbol, mid }, at: new Date().toISOString() })
  } catch (error) {
    return next(error)
  }
})
