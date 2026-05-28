import { useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export function CompoundingCalculator() {
  const { t } = useLanguage()
  const [start, setStart] = useState(1000)
  const [monthlyReturn, setMonthlyReturn] = useState(8)
  const [months, setMonths] = useState(6)

  const end = useMemo(() => {
    return Math.round(start * (1 + monthlyReturn / 100) ** months)
  }, [start, monthlyReturn, months])

  const gain = end - start

  return (
    <div className="forex-tool-card">
      <h3 className="forex-tool-card__title">{t.tools.compoundTitle}</h3>
      <p className="forex-tool-card__desc">{t.tools.compoundDesc}</p>
      <div className="mt-4 grid gap-3">
        <label className="forex-field">
          <span>{t.tools.startBalance}</span>
          <input type="number" min={1} value={start} onChange={(e) => setStart(Number(e.target.value))} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="forex-field">
            <span>{t.tools.monthlyReturn}</span>
            <input type="number" value={monthlyReturn} onChange={(e) => setMonthlyReturn(Number(e.target.value))} />
          </label>
          <label className="forex-field">
            <span>{t.tools.months}</span>
            <input type="number" min={1} max={36} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
          </label>
        </div>
      </div>
      <div className="forex-tool-result mt-4">
        <span className="text-xs text-theme-muted">{t.tools.projectedBalance}</span>
        <p className="font-display text-2xl font-bold text-emerald-400">${end.toLocaleString()}</p>
        <p className="mt-1 text-xs text-theme-muted">
          +${gain.toLocaleString()} ({monthlyReturn}% × {months} mo)
        </p>
      </div>
    </div>
  )
}
