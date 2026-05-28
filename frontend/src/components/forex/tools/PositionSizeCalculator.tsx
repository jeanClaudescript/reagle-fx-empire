import { useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { calcPositionLots } from '@/lib/forexCalc'

export function PositionSizeCalculator() {
  const { t } = useLanguage()
  const [balance, setBalance] = useState(1000)
  const [risk, setRisk] = useState(1)
  const [stopPips, setStopPips] = useState(20)

  const lots = useMemo(
    () => calcPositionLots({ balance, riskPercent: risk, stopLossPips: stopPips }),
    [balance, risk, stopPips],
  )

  return (
    <div className="forex-tool-card">
      <h3 className="forex-tool-card__title">{t.tools.positionTitle}</h3>
      <p className="forex-tool-card__desc">{t.tools.positionDesc}</p>
      <div className="mt-4 grid gap-3">
        <label className="forex-field">
          <span>{t.tools.accountBalance}</span>
          <input type="number" min={1} value={balance} onChange={(e) => setBalance(Number(e.target.value))} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="forex-field">
            <span>{t.tools.riskPercent}</span>
            <input type="number" min={0.1} max={10} step={0.1} value={risk} onChange={(e) => setRisk(Number(e.target.value))} />
          </label>
          <label className="forex-field">
            <span>{t.tools.stopLossPips}</span>
            <input type="number" min={1} value={stopPips} onChange={(e) => setStopPips(Number(e.target.value))} />
          </label>
        </div>
      </div>
      <div className="forex-tool-result mt-4">
        <span className="text-xs text-theme-muted">{t.tools.suggestedLots}</span>
        <p className="font-display text-2xl font-bold text-theme-accent">{lots.toFixed(2)}</p>
      </div>
    </div>
  )
}
