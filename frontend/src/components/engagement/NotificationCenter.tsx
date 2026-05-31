import { X } from 'lucide-react'
import { useEngagement } from '@/engagement/EngagementProvider'
import type { VipPanelId } from '@/components/student/vip/VipDeskShell'

type Props = {
  onNavigate?: (panel: VipPanelId) => void
}

export function NotificationCenter({ onNavigate }: Props) {
  const { centerOpen, setCenterOpen, notifications, feed, markRead, markAllRead } = useEngagement()
  if (!centerOpen) return null

  const openItem = async (id: string, panelId?: string) => {
    await markRead(id)
    if (panelId && onNavigate) onNavigate(panelId as VipPanelId)
    setCenterOpen(false)
  }

  return (
    <div className="engagement-center-backdrop" onClick={() => setCenterOpen(false)}>
      <aside
        className="engagement-center"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Notification center"
      >
        <div className="engagement-center__head">
          <h3 className="font-display text-lg font-bold text-theme-primary">Notifications</h3>
          <div className="flex items-center gap-2">
            <button type="button" className="text-xs font-semibold text-theme-accent" onClick={() => void markAllRead()}>
              Mark all read
            </button>
            <button type="button" onClick={() => setCenterOpen(false)} aria-label="Close">
              <X className="h-5 w-5 text-theme-muted" />
            </button>
          </div>
        </div>

        <div className="engagement-center__body">
          {notifications.length === 0 && feed.length === 0 ? (
            <p className="p-4 text-sm text-theme-muted">You&apos;re all caught up.</p>
          ) : null}

          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`engagement-center__item ${n.readAt ? '' : 'engagement-center__item--unread'}`}
              onClick={() => void openItem(n.id, n.panelId)}
            >
              <p className="font-semibold text-theme-primary">{n.title}</p>
              <p className="mt-1 text-xs text-theme-muted line-clamp-2">{n.body}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-theme-muted">
                Priority {n.priority} · {new Date(n.createdAt).toLocaleString()}
              </p>
            </button>
          ))}

          {feed.length > 0 ? (
            <div className="border-t border-theme px-4 py-2">
              <p className="text-xs font-bold uppercase tracking-wider text-theme-muted">Activity feed</p>
            </div>
          ) : null}
          {feed.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`engagement-center__item ${f.readAt ? '' : 'engagement-center__item--unread'}`}
              onClick={() => {
                if (f.panelId && onNavigate) onNavigate(f.panelId as VipPanelId)
                setCenterOpen(false)
              }}
            >
              <p className="font-semibold text-theme-primary">{f.title}</p>
              <p className="mt-1 text-xs text-theme-muted line-clamp-3">{f.body}</p>
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
