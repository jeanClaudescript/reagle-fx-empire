import { useMemo, useState } from 'react'
import { GitBranch } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { calcFibLevels } from '@/lib/forexCalc'
import { ForexToolShell } from '@/components/forex/ForexToolShell'

export function FibonacciCalculator() {
  const { t } = useLanguage()
  const [high, setHigh] = useState(1.095)
  const [low, setLow] = useState(1.075)

  const levels = useMemo(() => calcFibLevels(high, low), [high, low])

  return (
    <ForexToolShell
      icon={GitBranch}
      title={t.tools.fibTitle}
      description={t.tools.fibDesc}
      tag={t.tools.tagAnalysis}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="forex-field">
          <span>{t.tools.swingHigh}</span>
          <input type="number" step={0.0001} value={high} onChange={(e) => setHigh(Number(e.target.value))} />
        </label>
        <label className="forex-field">
          <span>{t.tools.swingLow}</span>
          <input type="number" step={0.0001} value={low} onChange={(e) => setLow(Number(e.target.value))} />
        </label>
      </div>
      <ul className="forex-level-list mt-4">
        {levels.map((row) => (
          <li key={row.ratio} className="forex-level-row forex-level-row--fib">
            <span>{(row.ratio * 100).toFixed(1)}%</span>
            <span className="font-mono tabular-nums">{row.price.toFixed(5)}</span>
          </li>
        ))}
      </ul>
    </ForexToolShell>
  )
}
