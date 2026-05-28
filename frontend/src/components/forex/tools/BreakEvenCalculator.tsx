import { useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export function BreakEvenCalculator() {
  const { t } = useLanguage()
  const [entry, setEntry] = useState(1.085)
  const [commission, setCommission] = useState(7)
  const [spreadPips, setSpreadPips] = useState(1.2)
  const pipSize = 0.0001

  const breakEven = useMemo(() => {
    const pipCost = spreadPips * pipSize
    const commPips = commission / 10
    return Math.round((entry + pipCost + commPips * pipSize) * 100000) / 100000
  }, [entry, commission, spreadPips, pipSize])

  return (
    <div className="forex-tool-card">
      <h3 className="forex-tool-card__title">{t.tools.beTitle}</h3>
      <p className="forex-tool-card__desc">{t.tools.beDesc}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="forex-field">
          <span>{t.tools.entry}</span>
          <input type="number" step={0.0001} value={entry} onChange={(e) => setEntry(Number(e.target.value))} />
        </label>
        <label className="forex-field">
          <span>{t.tools.spreadPips}</span>
          <input type="number" step={0.1} value={spreadPips} onChange={(e) => setSpreadPips(Number(e.target.value))} />
        </label>
        <label className="forex-field">
          <span>{t.tools.commission}</span>
          <input type="number" value={commission} onChange={(e) => setCommission(Number(e.target.value))} />
        </label>
      </div>
      <div className="forex-tool-result mt-4">
        <span className="text-xs text-theme-muted">{t.tools.breakEvenPrice}</span>
        <p className="font-display text-2xl font-bold text-theme-primary">{breakEven}</p>
      </div>
    </div>
  )
}
