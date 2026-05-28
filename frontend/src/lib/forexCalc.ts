/** Simplified pip value (USD) per 1 standard lot on major USD-quote pairs */
export function pipValueUsd(lots: number) {
  return lots * 10
}

export function calcPositionLots(input: {
  balance: number
  riskPercent: number
  stopLossPips: number
  lots?: number
}) {
  const { balance, riskPercent, stopLossPips } = input
  if (balance <= 0 || riskPercent <= 0 || stopLossPips <= 0) return 0
  const riskAmount = balance * (riskPercent / 100)
  const pipValuePerLot = pipValueUsd(1)
  const lots = riskAmount / (stopLossPips * pipValuePerLot)
  return Math.max(0, Math.round(lots * 100) / 100)
}

export function calcRiskReward(entry: number, stop: number, target: number) {
  const risk = Math.abs(entry - stop)
  const reward = Math.abs(target - entry)
  if (risk === 0) return { risk, reward, ratio: 0 }
  return { risk, reward, ratio: Math.round((reward / risk) * 100) / 100 }
}

export function calcPipProfit(lots: number, pips: number) {
  return Math.round(pipValueUsd(lots) * pips * 100) / 100
}

export function calcMargin(lots: number, price: number, contractSize: number, leverage: number) {
  if (leverage <= 0 || price <= 0) return 0
  return Math.round(((lots * contractSize * price) / leverage) * 100) / 100
}

export function calcBreakEven(entry: number, spreadPips: number, commission: number, lots: number, side: 'buy' | 'sell') {
  const pip = 0.0001
  const spread = spreadPips * pip
  const commPips = lots > 0 ? commission / (pipValueUsd(lots) || 1) : 0
  const totalPips = spread + commPips * pip / pip
  return side === 'buy' ? entry + totalPips : entry - totalPips
}

export function calcCompound(balance: number, monthlyPercent: number, months: number) {
  let b = balance
  const rate = monthlyPercent / 100
  for (let i = 0; i < months; i += 1) b *= 1 + rate
  return Math.round(b * 100) / 100
}

/** Classic daily pivot points */
export function calcPivotPoints(high: number, low: number, close: number) {
  const p = (high + low + close) / 3
  const r1 = 2 * p - low
  const s1 = 2 * p - high
  const r2 = p + (high - low)
  const s2 = p - (high - low)
  const r3 = high + 2 * (p - low)
  const s3 = low - 2 * (high - p)
  return { p, r1, r2, r3, s1, s2, s3 }
}

export function calcFibLevels(high: number, low: number) {
  const diff = high - low
  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
  return levels.map((r) => ({
    ratio: r,
    price: Math.round((high - diff * r) * 100000) / 100000,
  }))
}

export function lotsToUnits(lots: number) {
  return {
    standard: lots,
    mini: lots * 10,
    micro: lots * 100,
    units: Math.round(lots * 100000),
  }
}
