import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useCmsContent } from '@/cms/CmsProvider'
import { isSectionEnabled } from '@/cms/sectionVisibility'
import {
  classroomApi,
  deskChatApi,
  liveApi,
  type ClassroomRoom,
  type LiveSession,
} from '@/services/api'
import {
  onClassroomUpdated,
  onCmsPublished,
  onCommunityMessage,
  onDirectMessage,
  onLiveUpdated,
  type DeskChatMessage,
} from '@/realtime/appSocket'
import type { VipPanelId } from '@/components/student/vip/VipDeskShell'
import { getLastSeenAt, isNewSince, markPanelSeen } from '@/vip/vipLastSeen'
import { hasActiveSignal, isSignalNew, markSignalSeen } from '@/vip/vipSignalTracking'

export type VipActivityKind = 'live' | 'classroom' | 'community' | 'coach' | 'book' | 'signal'

export type VipActivityItem = {
  id: string
  panelId: VipPanelId
  kind: VipActivityKind
  title: string
  preview: string
  at: number
  isNew: boolean
  isLive?: boolean
  priority: number
  fromName?: string
  session?: LiveSession
}

export type VipToast = {
  id: string
  kind: 'signal' | 'coach' | 'community' | 'book' | 'classroom' | 'live'
  panelId: VipPanelId
  title: string
  preview: string
}

function ts(iso?: string) {
  if (!iso) return 0
  const n = Date.parse(iso)
  return Number.isFinite(n) ? n : 0
}

function pushToast(list: VipToast[], toast: VipToast) {
  if (list.some((t) => t.id === toast.id)) return list
  return [toast, ...list].slice(0, 4)
}

function latestCommunityItem(messages: DeskChatMessage[]): VipActivityItem | null {
  const last = messages[messages.length - 1]
  if (!last) return null
  const at = ts(last.createdAt)
  return {
    id: `community-${last.id}`,
    panelId: 'community-chat',
    kind: 'community',
    title: 'community',
    preview: last.message,
    at,
    isNew: isNewSince('community-chat', at),
    priority: 70,
    fromName: last.fromUserName,
  }
}

function latestCoachItem(messages: DeskChatMessage[]): VipActivityItem | null {
  const fromCoach = [...messages].reverse().find((m) => m.fromRole === 'admin')
  if (!fromCoach) return null
  const at = ts(fromCoach.createdAt)
  return {
    id: `coach-${fromCoach.id}`,
    panelId: 'coach-chat',
    kind: 'coach',
    title: 'coach',
    preview: fromCoach.message,
    at,
    isNew: isNewSince('coach-chat', at),
    priority: 85,
    fromName: fromCoach.fromUserName,
  }
}

function liveRoomItem(session: LiveSession | null): VipActivityItem | null {
  if (!session || session.status !== 'live') return null
  const at = ts(session.startedAt || session.updatedAt || session.createdAt)
  return {
    id: `live-${session.id}`,
    panelId: 'live',
    kind: 'live',
    title: 'live',
    preview: session.title,
    at,
    isNew: isNewSince('live', at),
    isLive: true,
    priority: 90,
    session,
  }
}

function signalItem(session: LiveSession | null): VipActivityItem | null {
  if (!hasActiveSignal(session) || !session) return null
  const at = ts(session.updatedAt || session.startedAt || session.createdAt)
  const isNew = isSignalNew(session)
  return {
    id: `signal-${session.id}-${session.updatedAt}`,
    panelId: 'signals',
    kind: 'signal',
    title: 'signal',
    preview: `${session.pair} · ${session.signalSide!.toUpperCase()} @ ${session.signalEntry}`,
    at,
    isNew,
    isLive: session.status === 'live',
    priority: 100,
    session,
  }
}

function classroomItem(room: ClassroomRoom | null): VipActivityItem | null {
  if (!room || room.status !== 'live') return null
  const at = ts(room.startedAt || room.updatedAt || room.createdAt)
  return {
    id: `classroom-${room.id}`,
    panelId: 'classroom',
    kind: 'classroom',
    title: 'classroom',
    preview: room.title,
    at,
    isNew: isNewSince('classroom', at),
    isLive: true,
    priority: 95,
  }
}

function bookItems(
  books: Array<{ id: string; title: string; createdAt: string; enabled: boolean; fileUrl: string }>,
) {
  return books
    .filter((b) => b.enabled && b.fileUrl)
    .map((book) => {
      const at = ts(book.createdAt)
      return {
        id: `book-${book.id}`,
        panelId: 'books' as const,
        kind: 'book' as const,
        title: 'book',
        preview: book.title,
        at,
        isNew: isNewSince('books', at),
        priority: 60,
      }
    })
    .filter((item) => item.isNew)
}

export function useVipActivityFeed() {
  const { t } = useLanguage()
  const cms = useCmsContent()
  const [community, setCommunity] = useState<DeskChatMessage[]>([])
  const [direct, setDirect] = useState<DeskChatMessage[]>([])
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null)
  const [classroom, setClassroom] = useState<ClassroomRoom | null>(null)
  const [tick, setTick] = useState(0)
  const [toasts, setToasts] = useState<VipToast[]>([])
  const activePanelRef = useRef<VipPanelId>('overview')
  const knownBookIdsRef = useRef<Set<string> | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [liveRes, classRes, commRes, directRes] = await Promise.all([
        liveApi.getActive().catch(() => ({ data: null })),
        classroomApi.getActive().catch(() => ({ data: null })),
        deskChatApi.communityList().catch(() => ({ data: [] as DeskChatMessage[] })),
        deskChatApi.directList().catch(() => ({ data: [] as DeskChatMessage[] })),
      ])
      setLiveSession(liveRes.data)
      setClassroom(classRes.data)
      setCommunity(commRes.data)
      setDirect(directRes.data)
    } catch {
      /* ignore */
    }
  }, [])

  const setActivePanel = useCallback((panelId: VipPanelId) => {
    activePanelRef.current = panelId
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const maybeToast = useCallback((toast: VipToast) => {
    if (activePanelRef.current === toast.panelId) return
    setToasts((prev) => pushToast(prev, toast))
  }, [])

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((toast) => window.setTimeout(() => dismissToast(toast.id), 9000))
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [toasts, dismissToast])

  useEffect(() => {
    if (!isSectionEnabled(cms, 'books')) return
    const books = (cms.vipBooks ?? []).filter((b) => b.enabled && b.fileUrl)
    const ids = new Set(books.map((b) => b.id))
    if (knownBookIdsRef.current === null) {
      knownBookIdsRef.current = ids
      return
    }
    for (const book of books) {
      if (knownBookIdsRef.current.has(book.id)) continue
      if (activePanelRef.current !== 'books') {
        maybeToast({
          id: `book-${book.id}`,
          kind: 'book',
          panelId: 'books',
          title: book.title,
          preview: t.vip.alertBookPreview,
        })
      }
    }
    knownBookIdsRef.current = ids
  }, [cms, maybeToast, t.vip.alertBookPreview])

  useEffect(() => {
    void refresh()
  }, [refresh, tick])

  useEffect(() => {
    const unsubs = [
      onCommunityMessage((msg) => {
        setCommunity((prev) => [...prev.filter((m) => m.id !== msg.id), msg].slice(-200))
        if (activePanelRef.current !== 'community-chat') {
          maybeToast({
            id: `community-${msg.id}`,
            kind: 'community',
            panelId: 'community-chat',
            title: msg.fromUserName,
            preview: msg.message,
          })
        }
      }),
      onDirectMessage((msg) => {
        setDirect((prev) => [...prev.filter((m) => m.id !== msg.id), msg].slice(-200))
        if (msg.fromRole === 'admin' && activePanelRef.current !== 'coach-chat') {
          maybeToast({
            id: `coach-${msg.id}`,
            kind: 'coach',
            panelId: 'coach-chat',
            title: msg.fromUserName,
            preview: msg.message,
          })
        }
      }),
      onLiveUpdated((p) => {
        const next = p.data
        setLiveSession(next)
        if (!hasActiveSignal(next) || !next) return
        if (activePanelRef.current === 'signals') {
          markSignalSeen(next)
          return
        }
        if (isSignalNew(next)) {
          maybeToast({
            id: `signal-${next.id}-${next.updatedAt}`,
            kind: 'signal',
            panelId: 'signals',
            title: `${next.signalSide!.toUpperCase()} ${next.pair}`,
            preview: `Entry ${next.signalEntry} · SL ${next.signalStop ?? '—'} · TP ${next.signalTarget ?? '—'}`,
          })
        }
      }),
      onClassroomUpdated((p) => {
        setClassroom(p.data)
        if (p.data?.status === 'live' && activePanelRef.current !== 'classroom') {
          maybeToast({
            id: `classroom-${p.data.id}-${p.at}`,
            kind: 'classroom',
            panelId: 'classroom',
            title: p.data.title,
            preview: t.vip.alertClassroomPreview,
          })
        }
      }),
      onCmsPublished(() => setTick((n) => n + 1)),
    ]
    return () => unsubs.forEach((u) => u())
  }, [maybeToast, t.vip.alertClassroomPreview])

  const items = useMemo(() => {
    const list: VipActivityItem[] = []
    const signal = signalItem(liveSession)
    if (signal) list.push(signal)
    const live = liveRoomItem(liveSession)
    if (live) list.push(live)
    const classLive = classroomItem(classroom)
    if (classLive) list.push(classLive)
    const comm = latestCommunityItem(community)
    if (comm) list.push(comm)
    const coach = latestCoachItem(direct)
    if (coach) list.push(coach)
    if (isSectionEnabled(cms, 'books')) {
      list.push(...bookItems(cms.vipBooks ?? []))
    }
    return list.sort((a, b) => b.priority - a.priority || b.at - a.at)
  }, [community, direct, liveSession, classroom, cms])

  const activeSignal = useMemo(
    () => (hasActiveSignal(liveSession) ? liveSession : null),
    [liveSession],
  )

  const unreadByPanel = useMemo(() => {
    const map: Partial<Record<VipPanelId, number>> = {}
    for (const item of items) {
      if (!item.isNew) continue
      map[item.panelId] = (map[item.panelId] ?? 0) + 1
    }
    return map
  }, [items])

  const totalUnread = useMemo(() => items.filter((i) => i.isNew).length, [items])

  const markSeen = useCallback(
    (panelId: VipPanelId) => {
      markPanelSeen(panelId)
      if (panelId === 'signals' && liveSession) markSignalSeen(liveSession)
      setTick((n) => n + 1)
    },
    [liveSession],
  )

  const groupsWithUpdates = useMemo(() => {
    const set = new Set<string>()
    for (const item of items) {
      if (!item.isNew && !item.isLive) continue
      if (item.panelId === 'live' || item.panelId === 'classroom' || item.panelId === 'signals') set.add('live')
      if (['watch', 'chart', 'session', 'calendar', 'news', 'books'].includes(item.panelId)) set.add('market')
      if (item.panelId === 'community-chat' || item.panelId === 'coach-chat') set.add('messages')
    }
    return set
  }, [items])

  return {
    items,
    unreadByPanel,
    totalUnread,
    markSeen,
    refresh,
    groupsWithUpdates,
    lastSeenAt: getLastSeenAt,
    activeSignal,
    toasts,
    dismissToast,
    setActivePanel,
  }
}
