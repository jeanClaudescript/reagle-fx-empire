import { Bell } from 'lucide-react'
import { useEngagement } from '@/engagement/EngagementProvider'

export function NotificationBell() {
  const { unread, setCenterOpen, centerOpen } = useEngagement()
  const count = unread.total

  return (
    <button
      type="button"
      className={`engagement-bell ${centerOpen ? 'engagement-bell--open' : ''}`}
      aria-label="Notifications"
      onClick={() => setCenterOpen((v) => !v)}
    >
      <Bell className="h-5 w-5" />
      {count > 0 ? (
        <span className="engagement-bell__badge">{count > 9 ? '9+' : count}</span>
      ) : null}
    </button>
  )
}
