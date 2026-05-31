import { useEngagement } from '@/engagement/EngagementProvider'

/** Surfaces priority-1 announcements as a top banner on the VIP desk. */
export function AnnouncementBanner() {
  const { notifications } = useEngagement()
  const banner = notifications.find((n) => !n.readAt && n.contentType === 'announcement' && n.priority === 1)
  if (!banner) return null

  return (
    <div className="engagement-banner" role="status">
      <p className="font-semibold text-theme-primary">{banner.title}</p>
      <p className="mt-1 text-sm text-theme-muted">{banner.body}</p>
    </div>
  )
}
