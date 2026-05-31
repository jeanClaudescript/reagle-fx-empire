import { BookOpen, Radio, Target } from 'lucide-react'
import { useEngagement } from '@/engagement/EngagementProvider'
import type { VipPanelId } from '@/components/student/vip/VipDeskShell'

type Props = {
  onNavigate?: (panel: VipPanelId) => void
}

export function RecommendationWidgets({ onNavigate }: Props) {
  const { recommendations } = useEngagement()
  if (!recommendations) return null

  const cards = [
    recommendations.continueLearning
      ? {
          icon: BookOpen,
          title: 'Continue learning',
          body: recommendations.continueLearning.title,
          panel: 'overview' as VipPanelId,
        }
      : null,
    recommendations.upcomingLiveSession
      ? {
          icon: Radio,
          title: recommendations.upcomingLiveSession.isLive ? 'Live now' : 'Upcoming live',
          body: recommendations.upcomingLiveSession.title,
          panel: 'live' as VipPanelId,
        }
      : null,
    {
      icon: Target,
      title: 'Focus pair',
      body: recommendations.focusPair,
      panel: 'chart' as VipPanelId,
    },
  ].filter(Boolean) as { icon: typeof BookOpen; title: string; body: string; panel: VipPanelId }[]

  return (
    <section className="engagement-recs">
      <h3 className="font-display text-lg font-bold text-theme-primary">Recommended for you</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.title}
              type="button"
              className="engagement-recs__card"
              onClick={() => onNavigate?.(card.panel)}
            >
              <Icon className="h-5 w-5 text-theme-accent" />
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-theme-muted">{card.title}</p>
              <p className="mt-1 text-sm font-semibold text-theme-primary">{card.body}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
