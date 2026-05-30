import { ChevronRight } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useMarketQuotes } from '@/hooks/useMarketQuotes'

function formatPrice(pair: string, value: number) {
  if (pair.includes('JPY')) return value.toFixed(3)
  if (pair.includes('XAU')) return value.toFixed(2)
  return value.toFixed(5)
}

function toSymbol(pair: string) {
  return pair.replace(/\//g, '').toUpperCase()
}

export function MarketWatch({ onOpenChart }: { onOpenChart?: (symbol: string) => void }) {
  const { t } = useLanguage()
  const { quotes, loading, error, updatedAt } = useMarketQuotes()

  return (
    <div className="forex-tool-card forex-tool-card--wide h-full">
      <div className="flex items-center justify-between gap-2">
        <h3 className="forex-tool-card__title">{t.tools.watchTitle}</h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">
          {loading ? '…' : t.tools.liveFeed}
        </span>
      </div>
      {onOpenChart ? (
        <p className="mt-1 text-xs text-theme-muted">{t.tools.watchOpenChart}</p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-rose-400">{error}</p> : null}
      <div className="mt-4 overflow-x-auto">
        <table className="forex-watch-table w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-theme-muted">
              <th className="pb-2 font-semibold">{t.tools.pair}</th>
              <th className="pb-2 font-semibold">Bid</th>
              <th className="pb-2 font-semibold">Ask</th>
              <th className="pb-2 text-right font-semibold">Spread</th>
              {onOpenChart ? <th className="pb-2 w-8" aria-hidden /> : null}
            </tr>
          </thead>
          <tbody>
            {quotes.map((r) => (
              <tr key={r.pair} className="border-t border-theme">
                {onOpenChart ? (
                  <td colSpan={5} className="p-0">
                    <button
                      type="button"
                      className="forex-watch-row-btn flex w-full items-center gap-2 py-2.5 text-left transition hover:bg-theme-accent/5"
                      onClick={() => onOpenChart(toSymbol(r.pair))}
                    >
                      <span className="min-w-[4.5rem] font-semibold text-theme-primary">{r.pair}</span>
                      <span className="font-mono tabular-nums text-emerald-400">{formatPrice(r.pair, r.bid)}</span>
                      <span className="font-mono tabular-nums text-rose-400">{formatPrice(r.pair, r.ask)}</span>
                      <span className="ml-auto font-mono text-theme-muted">{r.spread}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-theme-muted" />
                    </button>
                  </td>
                ) : (
                  <>
                    <td className="py-2.5 font-semibold text-theme-primary">{r.pair}</td>
                    <td className="py-2.5 font-mono tabular-nums text-emerald-400">{formatPrice(r.pair, r.bid)}</td>
                    <td className="py-2.5 font-mono tabular-nums text-rose-400">{formatPrice(r.pair, r.ask)}</td>
                    <td className="py-2.5 text-right font-mono text-theme-muted">{r.spread}</td>
                  </>
                )}
              </tr>
            ))}
            {!loading && quotes.length === 0 ? (
              <tr>
                <td colSpan={onOpenChart ? 5 : 4} className="py-4 text-center text-sm text-theme-muted">
                  {t.tools.watchEmpty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {updatedAt ? (
        <p className="mt-2 text-[10px] text-theme-muted">
          {t.tools.updatedAt} {new Date(updatedAt).toLocaleTimeString()}
        </p>
      ) : null}
    </div>
  )
}
