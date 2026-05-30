import { useEffect, useState } from 'react'
import { Radio } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { liveApi, type LiveSession } from '@/services/api'
import { onLiveUpdated } from '@/realtime/appSocket'
import { ForexToolShell } from '@/components/forex/ForexToolShell'
import { VipSignalCard } from '@/components/student/vip/VipSignalCard'
import { hasActiveSignal } from '@/vip/vipSignalTracking'

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
    const off = onLiveUpdated((payload) => setSession(payload.data))
    return () => off()
  }, [])

  const active = hasActiveSignal(session) ? session : null
  const isLive = session?.status === 'live'

  return (
    <ForexToolShell
      icon={Radio}
      title={t.tools.signalBoardTitle}
      description={t.tools.signalBoardDesc}
      tag={isLive ? t.live.liveNow : t.tools.tagSignals}
    >
      {active ? (
        <VipSignalCard session={active} />
      ) : (
        <div className="vip-signal-empty">
          <Radio className="mx-auto h-8 w-8 text-theme-muted" />
          <p className="mt-3 text-sm text-theme-muted">{t.live.signalEmpty}</p>
          <p className="mt-1 text-xs text-theme-muted">{t.vip.signalEmptyHint}</p>
        </div>
      )}
    </ForexToolShell>
  )
}
