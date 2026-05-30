import { Share2, TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { LiveSession } from '@/services/api'
import { isSignalNew } from '@/vip/vipSignalTracking'

type Props = {
  session: LiveSession
  compact?: boolean
  showShare?: boolean
  onShare?: () => void
}

export function VipSignalCard({ session, compact = false, showShare = true, onShare }: Props) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const isBuy = session.signalSide === 'buy'
  const isNew = isSignalNew(session)

  const shareText = `${session.signalSide.toUpperCase()} ${session.pair}\nEntry: ${session.signalEntry ?? '—'}\nSL: ${session.signalStop ?? '—'}\nTP: ${session.signalTarget ?? '—'}\n— ${t.tools.shareVia} Reagle FX`

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
      onShare?.()
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className={`vip-signal-card ${isBuy ? 'vip-signal-card--buy' : 'vip-signal-card--sell'} ${isNew ? 'vip-signal-card--new' : ''} ${compact ? 'vip-signal-card--compact' : ''}`}
    >
      <div className="vip-signal-card__head">
        <span className={`vip-signal-card__side ${isBuy ? 'vip-signal-card__side--buy' : 'vip-signal-card__side--sell'}`}>
          {isBuy ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {session.signalSide.toUpperCase()} {session.pair}
        </span>
        {isNew ? <span className="vip-signal-card__new">{t.vip.signalJustIn}</span> : null}
        {session.status === 'live' ? <span className="vip-signal-card__live">{t.vip.activityLiveNow}</span> : null}
      </div>

      <dl className="vip-signal-card__levels">
        <div>
          <dt>{t.tools.entry}</dt>
          <dd>{session.signalEntry ?? '—'}</dd>
        </div>
        <div>
          <dt>{t.tools.stop}</dt>
          <dd className="text-rose-400">{session.signalStop ?? '—'}</dd>
        </div>
        <div>
          <dt>{t.tools.target}</dt>
          <dd className="text-emerald-400">{session.signalTarget ?? '—'}</dd>
        </div>
      </dl>

      {session.coachNote && !compact ? (
        <p className="vip-signal-card__note">{session.coachNote}</p>
      ) : null}

      {showShare ? (
        <button type="button" className="vip-signal-card__share" onClick={() => void copyShare()}>
          <Share2 className="h-4 w-4" />
          {copied ? t.vip.signalCopied : t.tools.copySignal}
        </button>
      ) : null}
    </div>
  )
}
