import { useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { lotsToUnits } from '@/lib/forexCalc'
import { ForexResult, ForexToolShell } from '@/components/forex/ForexToolShell'

export function LotConverter() {
  const { t } = useLanguage()
  const [lots, setLots] = useState(0.1)
  const units = useMemo(() => lotsToUnits(lots), [lots])

  return (
    <ForexToolShell icon={Layers} title={t.tools.lotConvTitle} description={t.tools.lotConvDesc} tag={t.tools.tagRisk}>
      <label className="forex-field">
        <span>{t.tools.standardLots}</span>
        <input type="number" min={0.01} step={0.01} value={lots} onChange={(e) => setLots(Number(e.target.value))} />
      </label>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: t.tools.standardLots, value: units.standard },
          { label: t.tools.miniLots, value: units.mini },
          { label: t.tools.microLots, value: units.micro },
          { label: t.tools.units, value: units.units },
        ].map((row) => (
          <ForexResult key={row.label} label={row.label} value={row.value} tone="accent" />
        ))}
      </div>
    </ForexToolShell>
  )
}
