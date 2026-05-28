import { useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { calcRiskReward } from '@/lib/forexCalc'

export function RiskRewardCalculator() {
  const { t } = useLanguage()
  const [entry, setEntry] = useState(1.085)
  const [stop, setStop] = useState(1.082)
  const [target, setTarget] = useState(1.091)

  const { ratio } = useMemo(() => calcRiskReward(entry, stop, target), [entry, stop, target])

  return (
    <div className="forex-tool-card">
      <h3 className="forex-tool-card__title">{t.tools.rrTitle}</h3>
      <p className="forex-tool-card__desc">{t.tools.rrDesc}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="forex-field">
          <span>{t.tools.entry}</span>
          <input type="number" step={0.0001} value={entry} onChange={(e) => setEntry(Number(e.target.value))} />
        </label>
        <label className="forex-field">
          <span>{t.tools.stop}</span>
          <input type="number" step={0.0001} value={stop} onChange={(e) => setStop(Number(e.target.value))} />
        </label>
        <label className="forex-field">
          <span>{t.tools.target}</span>
          <input type="number" step={0.0001} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
        </label>
      </div>
      <div className="forex-tool-result mt-4 flex items-end justify-between gap-4">
        <div>
          <span className="text-xs text-theme-muted">{t.tools.riskRewardRatio}</span>
          <p className="font-display text-2xl font-bold text-theme-primary">1 : {ratio}</p>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
            ratio >= 2 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {ratio >= 2 ? t.tools.rrGood : t.tools.rrReview}
        </div>
      </div>
    </div>
  )
}
