import { useMemo, useState } from 'react'
import { Target } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { calcPivotPoints } from '@/lib/forexCalc'
import { ForexToolShell } from '@/components/forex/ForexToolShell'

export function PivotCalculator() {
  const { t } = useLanguage()
  const [high, setHigh] = useState(1.092)
  const [low, setLow] = useState(1.078)
  const [close, setClose] = useState(1.085)

  const pivots = useMemo(() => calcPivotPoints(high, low, close), [high, low, close])
  const rows = [
    { k: 'R3', v: pivots.r3, tone: 'resistance' },
    { k: 'R2', v: pivots.r2, tone: 'resistance' },
    { k: 'R1', v: pivots.r1, tone: 'resistance' },
    { k: 'P', v: pivots.p, tone: 'pivot' },
    { k: 'S1', v: pivots.s1, tone: 'support' },
    { k: 'S2', v: pivots.s2, tone: 'support' },
    { k: 'S3', v: pivots.s3, tone: 'support' },
  ] as const

  return (
    <ForexToolShell
      icon={Target}
      title={t.tools.pivotTitle}
      description={t.tools.pivotDesc}
      tag={t.tools.tagAnalysis}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="forex-field">
          <span>{t.tools.dayHigh}</span>
          <input type="number" step={0.0001} value={high} onChange={(e) => setHigh(Number(e.target.value))} />
        </label>
        <label className="forex-field">
          <span>{t.tools.dayLow}</span>
          <input type="number" step={0.0001} value={low} onChange={(e) => setLow(Number(e.target.value))} />
        </label>
        <label className="forex-field">
          <span>{t.tools.dayClose}</span>
          <input type="number" step={0.0001} value={close} onChange={(e) => setClose(Number(e.target.value))} />
        </label>
      </div>
      <ul className="forex-level-list mt-4">
        {rows.map(({ k, v, tone }) => (
          <li key={k} className={`forex-level-row forex-level-row--${tone}`}>
            <span>{k}</span>
            <span className="font-mono tabular-nums">{v.toFixed(5)}</span>
          </li>
        ))}
      </ul>
    </ForexToolShell>
  )
}
