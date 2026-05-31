import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  engagementApi,
  type ActivityFeedEntry,
  type EngagementHighlights,
  type EngagementNotification,
  type EngagementRecommendations,
  type WhatsNewPayload,
} from '@/services/api'
import { onEngagementNotification } from '@/realtime/appSocket'
import type { VipPanelId } from '@/components/student/vip/VipDeskShell'

export type EngagementToast = {
  id: string
  title: string
  body: string
  panelId?: VipPanelId
  priority: number
}

export function useEngagementEngine(enabled: boolean) {
  const [notifications, setNotifications] = useState<EngagementNotification[]>([])
  const [feed, setFeed] = useState<ActivityFeedEntry[]>([])
  const [highlights, setHighlights] = useState<EngagementHighlights | null>(null)
  const [recommendations, setRecommendations] = useState<EngagementRecommendations | null>(null)
  const [whatsNew, setWhatsNew] = useState<WhatsNewPayload | null>(null)
  const [toasts, setToasts] = useState<EngagementToast[]>([])
  const [centerOpen, setCenterOpen] = useState(false)
  const [whatsNewOpen, setWhatsNewOpen] = useState(false)
  const [unread, setUnread] = useState({ center: 0, feed: 0, total: 0 })
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    try {
      const [n, f, h, r, w, u] = await Promise.all([
        engagementApi.listNotifications(),
        engagementApi.listFeed(),
        engagementApi.highlights(),
        engagementApi.recommendations(),
        engagementApi.whatsNew(),
        engagementApi.unreadCounts(),
      ])
      setNotifications(n.data)
      setFeed(f.data)
      setHighlights(h.data)
      setRecommendations(r.data)
      setWhatsNew(w.data)
      setUnread(u.data)
      if (w.data.hasNew && !whatsNewOpen) setWhatsNewOpen(true)
    } catch {
      /* desk may be gated */
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (whatsNew?.hasNew) setWhatsNewOpen(true)
  }, [whatsNew?.hasNew])

  useEffect(() => {
    if (!enabled) return
    return onEngagementNotification((payload) => {
      const n = payload.notification
      setNotifications((prev) => [n, ...prev.filter((x) => x.id !== n.id)].slice(0, 50))
      setUnread((prev) => ({ ...prev, center: prev.center + 1, total: prev.total + 1 }))
      if (payload.popup && n.priority <= 2) {
        setToasts((prev) =>
          [
            {
              id: n.id,
              title: n.title,
              body: n.body,
              panelId: (n.panelId as VipPanelId | undefined) ?? 'overview',
              priority: n.priority,
            },
            ...prev,
          ].slice(0, 3),
        )
      }
    })
  }, [enabled])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const markRead = useCallback(async (id: string) => {
    await engagementApi.markRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)))
    setUnread((prev) => ({
      ...prev,
      center: Math.max(0, prev.center - 1),
      total: Math.max(0, prev.total - 1),
    }))
  }, [])

  const markAllRead = useCallback(async () => {
    await engagementApi.markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    setFeed((prev) => prev.map((f) => ({ ...f, readAt: f.readAt ?? new Date().toISOString() })))
    setUnread({ center: 0, feed: 0, total: 0 })
  }, [])

  const closeWhatsNew = useCallback(async () => {
    setWhatsNewOpen(false)
    try {
      await engagementApi.markWhatsNewSeen()
      setWhatsNew((prev) => (prev ? { ...prev, hasNew: false } : prev))
    } catch {
      /* ignore */
    }
  }, [])

  const trackView = useCallback(
    (contentType: string, contentId: string, metadata?: Record<string, unknown>) => {
      if (!enabled) return
      void engagementApi.trackView({ contentType, contentId, metadata }).catch(() => null)
    },
    [enabled],
  )

  const unreadCenter = useMemo(
    () => notifications.filter((n) => !n.readAt).length,
    [notifications],
  )

  return {
    notifications,
    feed,
    highlights,
    recommendations,
    whatsNew,
    toasts,
    unread,
    unreadCenter,
    loading,
    centerOpen,
    setCenterOpen,
    whatsNewOpen,
    setWhatsNewOpen,
    refresh,
    dismissToast,
    markRead,
    markAllRead,
    closeWhatsNew,
    trackView,
  }
}
