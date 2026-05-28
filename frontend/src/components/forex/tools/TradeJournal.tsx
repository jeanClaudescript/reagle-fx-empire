import { useEffect, useState } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { ForexToolShell } from '@/components/forex/ForexToolShell'

type Entry = {
  id: string
  pair: string
  side: 'buy' | 'sell'
  entry: number
  stop: number
  target: number
  note: string
  at: string
}

const STORAGE = 'rfx_trade_journal_v1'

export function TradeJournal() {
  const { t } = useLanguage()
  const [entries, setEntries] = useState<Entry[]>([])
  const [pair, setPair] = useState('EUR/USD')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [entry, setEntry] = useState(1.085)
  const [stop, setStop] = useState(1.082)
  const [target, setTarget] = useState(1.091)
  const [note, setNote] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE)
      if (raw) setEntries(JSON.parse(raw) as Entry[])
    } catch {
      /* ignore */
    }
  }, [])

  const persist = (next: Entry[]) => {
    setEntries(next)
    localStorage.setItem(STORAGE, JSON.stringify(next))
  }

  const add = () => {
    persist([
      {
        id: crypto.randomUUID(),
        pair,
        side,
        entry,
        stop,
        target,
        note: note.trim(),
        at: new Date().toISOString(),
      },
      ...entries,
    ])
    setNote('')
  }

  return (
    <ForexToolShell
      icon={BookOpen}
      title={t.tools.journalTitle}
      description={t.tools.journalDesc}
      tag={t.tools.tagSignals}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="forex-field">
          <span>{t.tools.pair}</span>
          <input value={pair} onChange={(e) => setPair(e.target.value.toUpperCase())} />
        </label>
        <label className="forex-field">
          <span>{t.tools.side}</span>
          <select value={side} onChange={(e) => setSide(e.target.value as 'buy' | 'sell')} className="forex-input-select">
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>
        <label className="forex-field">
          <span>{t.tools.entry}</span>
          <input type="number" step={0.0001} value={entry} onChange={(e) => setEntry(Number(e.target.value))} />
        </label>
        <label className="forex-field">
          <span>{t.tools.stop}</span>
          <input type="number" step={0.0001} value={stop} onChange={(e) => setStop(Number(e.target.value))} />
        </label>
        <label className="forex-field sm:col-span-2">
          <span>{t.tools.target}</span>
          <input type="number" step={0.0001} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
        </label>
        <label className="forex-field sm:col-span-2">
          <span>{t.tools.journalNote}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.tools.journalNotePh} />
        </label>
      </div>
      <button type="button" className="forex-tool-action mt-3" onClick={add}>
        <Plus className="h-4 w-4" />
        {t.tools.journalSave}
      </button>

      <ul className="forex-journal-list mt-4 max-h-48 space-y-2 overflow-y-auto">
        {entries.length === 0 ? (
          <li className="text-center text-xs text-theme-muted">{t.tools.journalEmpty}</li>
        ) : (
          entries.map((e) => (
            <li key={e.id} className="forex-journal-item">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-bold ${e.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {e.side.toUpperCase()} {e.pair}
                  </p>
                  <p className="mt-1 font-mono text-xs text-theme-muted">
                    E {e.entry} · SL {e.stop} · TP {e.target}
                  </p>
                  {e.note ? <p className="mt-1 text-xs text-theme-primary">{e.note}</p> : null}
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-lg p-1.5 text-theme-muted hover:bg-theme-elevated hover:text-rose-400"
                  onClick={() => persist(entries.filter((x) => x.id !== e.id))}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </ForexToolShell>
  )
}
