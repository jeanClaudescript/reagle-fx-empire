import { useEffect, useMemo, useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'

type Position = {
  id: string
  side: 'buy' | 'sell'
  lots: number
  entry: number
  pair: string
}

const STORAGE = 'rfx_paper_account'

function loadAccount() {
  try {
    const raw = localStorage.getItem(STORAGE)
    if (raw) return JSON.parse(raw) as { balance: number; positions: Position[] }
  } catch {
    /* ignore */
  }
  return { balance: 10000, positions: [] as Position[] }
}

export function PaperTradingDesk({ pair = 'EUR/USD', livePrice = 1.0842 }: { pair?: string; livePrice?: number }) {
  const { t } = useLanguage()
  const { isPaid } = useStudentAccess()
  const [balance, setBalance] = useState(10000)
  const [positions, setPositions] = useState<Position[]>([])
  const [lots, setLots] = useState(0.1)
  const [price, setPrice] = useState(livePrice)

  useEffect(() => {
    const acc = loadAccount()
    setBalance(acc.balance)
    setPositions(acc.positions)
  }, [])

  useEffect(() => {
    setPrice(livePrice)
  }, [livePrice])

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify({ balance, positions }))
  }, [balance, positions])

  const floating = useMemo(() => {
    return positions.reduce((sum, p) => {
      const diff = p.side === 'buy' ? price - p.entry : p.entry - price
      return sum + diff * p.lots * 100000
    }, 0)
  }, [positions, price])

  const open = (side: 'buy' | 'sell') => {
    if (!isPaid) return
    setPositions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), side, lots, entry: price, pair },
    ])
  }

  const closeAll = () => {
    setBalance((b) => Math.round((b + floating) * 100) / 100)
    setPositions([])
  }

  if (!isPaid) {
    return (
      <div className="forex-tool-card forex-tool-card--locked">
        <h3 className="forex-tool-card__title">{t.tools.paperTitle}</h3>
        <p className="forex-tool-card__desc">{t.tools.paperLocked}</p>
      </div>
    )
  }

  return (
    <div className="forex-tool-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="forex-tool-card__title">{t.tools.paperTitle}</h3>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
          {t.tools.paperLive}
        </span>
      </div>
      <p className="forex-tool-card__desc">{t.tools.paperDesc}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl border border-theme bg-theme-surface/50 p-3">
          <p className="text-xs text-theme-muted">{t.tools.balance}</p>
          <p className="font-mono font-bold text-theme-primary">${balance.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-theme bg-theme-surface/50 p-3">
          <p className="text-xs text-theme-muted">{t.tools.floating}</p>
          <p className={`font-mono font-bold ${floating >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {floating >= 0 ? '+' : ''}${floating.toFixed(2)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-center font-mono text-lg font-bold text-theme-primary">
        {pair} @ {price.toFixed(5)}
      </p>

      <label className="forex-field mt-3">
        <span>{t.tools.lotSize}</span>
        <input type="number" min={0.01} step={0.01} value={lots} onChange={(e) => setLots(Number(e.target.value))} />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className="paper-trade-btn paper-trade-btn--buy" onClick={() => open('buy')}>
          <TrendingUp className="h-4 w-4" />
          Buy
        </button>
        <button type="button" className="paper-trade-btn paper-trade-btn--sell" onClick={() => open('sell')}>
          <TrendingDown className="h-4 w-4" />
          Sell
        </button>
      </div>

      {positions.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted">{t.tools.openTrades}</span>
            <button type="button" className="text-xs text-theme-accent" onClick={closeAll}>
              {t.tools.closeAll}
            </button>
          </div>
          <ul className="space-y-1 text-xs">
            {positions.map((p) => (
              <li key={p.id} className="flex justify-between rounded-lg bg-theme-elevated/40 px-2 py-1.5">
                <span className={p.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}>
                  {p.side.toUpperCase()} {p.lots}
                </span>
                <span className="font-mono text-theme-muted">@ {p.entry.toFixed(5)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
