import { useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { calcPipProfit } from '@/lib/forexCalc'

export function PipCalculator() {
  const { t } = useLanguage()
  const [lots, setLots] = useState(0.1)
  const [pips, setPips] = useState(25)

  const profit = useMemo(() => calcPipProfit(lots, pips), [lots, pips])

  return (
    <div className="forex-tool-card">
      <h3 className="forex-tool-card__title">{t.tools.pipTitle}</h3>
      <p className="forex-tool-card__desc">{t.tools.pipDesc}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="forex-field">
          <span>{t.tools.lotSize}</span>
          <input type="number" min={0.01} step={0.01} value={lots} onChange={(e) => setLots(Number(e.target.value))} />
        </label>
        <label className="forex-field">
          <span>{t.tools.pips}</span>
          <input type="number" min={1} value={pips} onChange={(e) => setPips(Number(e.target.value))} />
        </label>
      </div>
      <div className="forex-tool-result mt-4">
        <span className="text-xs text-theme-muted">{t.tools.estimatedProfit}</span>
        <p className="font-display text-2xl font-bold text-emerald-400">${profit.toLocaleString()}</p>
      </div>
    </div>
  )
}
