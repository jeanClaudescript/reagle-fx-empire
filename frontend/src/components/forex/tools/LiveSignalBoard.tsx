import { useEffect, useState } from 'react'
import { Radio, Share2 } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { liveApi, type LiveSession } from '@/services/api'
import { ForexToolShell } from '@/components/forex/ForexToolShell'

export function LiveSignalBoard() {
  const { t } = useLanguage()
  const [session, setSession] = useState<LiveSession | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await liveApi.getActive()
        setSession(res.data)
      } catch {
        setSession(null)
      }
    }
    void load()
    const id = window.setInterval(load, 15_000)
    return () => window.clearInterval(id)
  }, [])

  const shareText =
    session?.signalSide && session.signalSide !== 'neutral'
      ? `${session.signalSide.toUpperCase()} ${session.pair ?? ''}\nEntry: ${session.signalEntry ?? '—'}\nSL: ${session.signalStop ?? '—'}\nTP: ${session.signalTarget ?? '—'}\n— ${t.tools.shareVia} Reagle FX`
      : ''

  const copyShare = async () => {
    if (!shareText) return
    try {
      await navigator.clipboard.writeText(shareText)
    } catch {
      /* ignore */
    }
  }

  const isLive = session?.status === 'live'

  return (
    <ForexToolShell
      icon={Radio}
      title={t.tools.signalBoardTitle}
      description={t.tools.signalBoardDesc}
      tag={isLive ? t.live.liveNow : t.tools.tagSignals}
    >
      {session?.signalSide && session.signalSide !== 'neutral' ? (
        <div className="forex-signal-card">
          <p className={`text-xl font-bold uppercase ${session.signalSide === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {session.signalSide} {session.pair}
          </p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-theme-elevated/50 p-2">
              <dt className="text-theme-muted">{t.tools.entry}</dt>
              <dd className="font-mono font-bold text-theme-primary">{session.signalEntry ?? '—'}</dd>
            </div>
            <div className="rounded-xl bg-theme-elevated/50 p-2">
              <dt className="text-theme-muted">{t.tools.stop}</dt>
              <dd className="font-mono font-bold text-rose-400">{session.signalStop ?? '—'}</dd>
            </div>
            <div className="rounded-xl bg-theme-elevated/50 p-2">
              <dt className="text-theme-muted">{t.tools.target}</dt>
              <dd className="font-mono font-bold text-emerald-400">{session.signalTarget ?? '—'}</dd>
            </div>
          </dl>
          {session.coachNote ? <p className="mt-3 text-sm text-theme-muted">{session.coachNote}</p> : null}
          <button type="button" className="forex-tool-action mt-4" onClick={copyShare} disabled={!shareText}>
            <Share2 className="h-4 w-4" />
            {t.tools.copySignal}
          </button>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-theme px-4 py-8 text-center text-sm text-theme-muted">
          {t.live.signalEmpty}
        </p>
      )}
    </ForexToolShell>
  )
}
