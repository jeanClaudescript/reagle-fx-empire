import { useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export function MarginCalculator() {
  const { t } = useLanguage()
  const [lots, setLots] = useState(0.1)
  const [leverage, setLeverage] = useState(100)
  const [price, setPrice] = useState(1.085)
  const [contract, setContract] = useState(100000)

  const margin = useMemo(() => {
    if (lots <= 0 || leverage <= 0 || price <= 0) return 0
    return Math.round(((lots * contract * price) / leverage) * 100) / 100
  }, [lots, leverage, price, contract])

  return (
    <div className="forex-tool-card">
      <h3 className="forex-tool-card__title">{t.tools.marginTitle}</h3>
      <p className="forex-tool-card__desc">{t.tools.marginDesc}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="forex-field">
          <span>{t.tools.lotSize}</span>
          <input type="number" min={0.01} step={0.01} value={lots} onChange={(e) => setLots(Number(e.target.value))} />
        </label>
        <label className="forex-field">
          <span>{t.tools.leverage}</span>
          <input type="number" min={1} value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} />
        </label>
        <label className="forex-field">
          <span>{t.tools.price}</span>
          <input type="number" step={0.0001} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </label>
        <label className="forex-field">
          <span>{t.tools.contractSize}</span>
          <input type="number" value={contract} onChange={(e) => setContract(Number(e.target.value))} />
        </label>
      </div>
      <div className="forex-tool-result mt-4">
        <span className="text-xs text-theme-muted">{t.tools.requiredMargin}</span>
        <p className="font-display text-2xl font-bold text-theme-accent">${margin.toLocaleString()}</p>
      </div>
    </div>
  )
}
