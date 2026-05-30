import { useState, type ReactNode } from 'react'
import { BarChart3, MessageSquare, Video } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export type LiveTeachingMobileTab = 'chart' | 'class' | 'chat'

type Props = {
  chart: ReactNode
  teaching: ReactNode
  chat?: ReactNode
  teachingEnabled: boolean
}

export function LiveTeachingSplitLayout({ chart, teaching, chat, teachingEnabled }: Props) {
  const { t } = useLanguage()
  const [mobileTab, setMobileTab] = useState<LiveTeachingMobileTab>('chart')

  if (!teachingEnabled) {
    return <div className="live-teaching-split live-teaching-split--chart-only">{chart}</div>
  }

  return (
    <div className="live-teaching-split">
      <div className="live-teaching-split__mobile-tabs" role="tablist" aria-label="Live teaching views">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'chart'}
          className={mobileTab === 'chart' ? 'active' : ''}
          onClick={() => setMobileTab('chart')}
        >
          <BarChart3 size={16} aria-hidden />
          {t.jitsi.tabChart}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'class'}
          className={mobileTab === 'class' ? 'active' : ''}
          onClick={() => setMobileTab('class')}
        >
          <Video size={16} aria-hidden />
          {t.jitsi.tabClass}
        </button>
        {chat ? (
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'chat'}
            className={mobileTab === 'chat' ? 'active' : ''}
            onClick={() => setMobileTab('chat')}
          >
            <MessageSquare size={16} aria-hidden />
            {t.jitsi.tabChat}
          </button>
        ) : null}
      </div>

      <div className="live-teaching-split__panes">
        <div
          className={`live-teaching-split__chart${mobileTab === 'chart' ? ' live-teaching-split__pane--active' : ' live-teaching-split__pane--hidden-mobile'}`}
        >
          {chart}
        </div>
        <div
          className={`live-teaching-split__jitsi${mobileTab === 'class' ? ' live-teaching-split__pane--active' : ' live-teaching-split__pane--hidden-mobile'}`}
        >
          {teaching}
        </div>
        {chat ? (
          <div
            className={`live-teaching-split__chat${mobileTab === 'chat' ? ' live-teaching-split__pane--active' : ' live-teaching-split__pane--hidden-mobile'}`}
          >
            {chat}
          </div>
        ) : null}
      </div>
    </div>
  )
}
