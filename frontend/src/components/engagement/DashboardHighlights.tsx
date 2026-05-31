import { useEngagement } from '@/engagement/EngagementProvider'
import type { VipPanelId } from '@/components/student/vip/VipDeskShell'

type Props = {
  onNavigate?: (panel: VipPanelId) => void
}

export function DashboardHighlights({ onNavigate }: Props) {
  const { highlights } = useEngagement()
  if (!highlights) return null

  const items = [
    ...highlights.highlights.map((h) => ({
      id: h.id,
      title: h.title,
      body: h.body,
      panelId: h.panelId,
      kind: 'highlight' as const,
    })),
    ...highlights.feedPreview.slice(0, 3).map((f) => ({
      id: f.id,
      title: f.title,
      body: f.body,
      panelId: f.panelId,
      kind: 'feed' as const,
    })),
  ]

  if (items.length === 0) return null

  return (
    <section className="engagement-highlights">
      <h3 className="font-display text-lg font-bold text-theme-primary">Today&apos;s highlights</h3>
      <ul className="mt-3 space-y-2">
        {items.slice(0, 6).map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="engagement-highlights__item"
              onClick={() => item.panelId && onNavigate?.(item.panelId as VipPanelId)}
            >
              <span className="font-medium text-theme-primary">{item.title}</span>
              <span className="mt-0.5 block text-xs text-theme-muted line-clamp-2">{item.body}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
