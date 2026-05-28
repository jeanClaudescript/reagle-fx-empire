import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

const WATCH = [
  { pair: 'EUR/USD', bid: 1.0841, ask: 1.0843, spread: 0.2 },
  { pair: 'GBP/USD', bid: 1.2633, ask: 1.2636, spread: 0.3 },
  { pair: 'USD/JPY', bid: 149.8, ask: 149.83, spread: 0.3 },
  { pair: 'XAU/USD', bid: 2347.8, ask: 2348.6, spread: 0.8 },
  { pair: 'USD/RWF', bid: 1328.2, ask: 1329.0, spread: 0.8 },
]

type WatchRow = { pair: string; bid: number; ask: number; spread: number }

export function MarketWatch() {
  const { t } = useLanguage()
  const [rows, setRows] = useState<WatchRow[]>(() => WATCH.map((r) => ({ ...r })))

  useEffect(() => {
    const id = window.setInterval(() => {
      setRows((prev) =>
        prev.map((r, i) => {
          const base = WATCH[i]
          const nudge = (Math.random() - 0.5) * (base.bid > 100 ? 0.15 : 0.0002)
          const bid = Math.round((r.bid + nudge) * 10000) / 10000
          const ask = Math.round((bid + base.spread / 10) * 10000) / 10000
          return { ...r, bid, ask }
        }),
      )
    }, 4000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="forex-tool-card forex-tool-card--wide h-full">
      <div className="flex items-center justify-between gap-2">
        <h3 className="forex-tool-card__title">{t.tools.watchTitle}</h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-theme-muted">
          Demo · updates live
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="forex-watch-table w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-theme-muted">
              <th className="pb-2 font-semibold">{t.tools.pair}</th>
              <th className="pb-2 font-semibold">Bid</th>
              <th className="pb-2 font-semibold">Ask</th>
              <th className="pb-2 text-right font-semibold">Spread</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.pair} className="border-t border-theme">
                <td className="py-2.5 font-semibold text-theme-primary">{r.pair}</td>
                <td className="py-2.5 font-mono tabular-nums text-emerald-400">{r.bid}</td>
                <td className="py-2.5 font-mono tabular-nums text-rose-400">{r.ask}</td>
                <td className="py-2.5 text-right font-mono text-theme-muted">{r.spread}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
