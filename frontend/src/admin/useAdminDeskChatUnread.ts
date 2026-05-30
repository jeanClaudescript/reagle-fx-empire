import { useCallback, useEffect, useState } from 'react'
import { onCommunityMessage, onDirectMessage } from '@/realtime/appSocket'
import type { AdminTab } from '@/admin/layout/adminNav'

const LAST_SEEN_KEY = 'rfx_admin_desk_chat_seen_v1'

function readLastSeen() {
  try {
    return Number(localStorage.getItem(LAST_SEEN_KEY) || '0')
  } catch {
    return 0
  }
}

function writeLastSeen(at = Date.now()) {
  try {
    localStorage.setItem(LAST_SEEN_KEY, String(at))
  } catch {
    /* ignore */
  }
}

function ts(iso: string) {
  const n = Date.parse(iso)
  return Number.isFinite(n) ? n : 0
}

export function useAdminDeskChatUnread(activeTab: AdminTab) {
  const [unread, setUnread] = useState(0)

  const markSeen = useCallback(() => {
    writeLastSeen()
    setUnread(0)
  }, [])

  useEffect(() => {
    if (activeTab === 'desk-chat') markSeen()
  }, [activeTab, markSeen])

  useEffect(() => {
    const bump = (at: number) => {
      if (activeTab === 'desk-chat') return
      if (at > readLastSeen()) setUnread((n) => n + 1)
    }

    const unsubs = [
      onCommunityMessage((msg) => bump(ts(msg.createdAt))),
      onDirectMessage((msg) => {
        if (msg.fromRole === 'student') bump(ts(msg.createdAt))
      }),
    ]
    return () => unsubs.forEach((u) => u())
  }, [activeTab])

  return { unread, markSeen }
}
