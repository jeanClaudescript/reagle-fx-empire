import { io, type Socket } from 'socket.io-client'
import { API_BASE } from '@/services/api'
import { getAdminAuthToken } from '@/admin/adminSession'
import { getStudentAuthToken } from '@/student/studentSession'

export type DeskChatMessage = {
  id: string
  channel: 'vip-community' | 'direct'
  fromUserId: string
  fromUserName: string
  fromRole: 'admin' | 'student'
  toUserId?: string
  message: string
  messageType?: 'text' | 'image' | 'video' | 'voice' | 'file'
  attachments?: {
    url: string
    type: 'image' | 'video' | 'voice' | 'file'
    mimeType?: string
    fileName?: string
    durationSec?: number
  }[]
  replyTo?: { id: string; preview: string; fromUserName: string }
  readAt?: string
  createdAt: string
}

export type ChatSendPayload = {
  message?: string
  messageType?: DeskChatMessage['messageType']
  attachments?: DeskChatMessage['attachments']
  replyTo?: DeskChatMessage['replyTo']
}

export type TypingPayload = {
  userId: string
  userName: string
  typing: boolean
  studentId?: string
}

export type InboxMessage = {
  id: string
  name: string
  email?: string
  phone?: string
  channel?: string
  message: string
  source: string
  status: 'new' | 'read'
  createdAt: string
}

type LiveUpdatedPayload = {
  data: import('@/services/api').LiveSession | null
  at: string
}

type ClassroomUpdatedPayload = {
  data: import('@/services/api').ClassroomRoom | null
  at: string
}

type CmsPublishedPayload = {
  data: unknown
  at: string
}

let socket: Socket | null = null
let currentRole: 'guest' | 'admin' | 'student' | 'teacher' = 'guest'

const communityHandlers = new Set<(msg: DeskChatMessage) => void>()
const directHandlers = new Set<(msg: DeskChatMessage) => void>()
const inboxHandlers = new Set<(msg: InboxMessage) => void>()
const cmsHandlers = new Set<(payload: CmsPublishedPayload) => void>()
const liveHandlers = new Set<(payload: LiveUpdatedPayload) => void>()
const classroomHandlers = new Set<(payload: ClassroomUpdatedPayload) => void>()
const engagementHandlers = new Set<(payload: EngagementNotificationPayload) => void>()
const communityTypingHandlers = new Set<(payload: TypingPayload) => void>()
const directTypingHandlers = new Set<(payload: TypingPayload) => void>()
const directReadHandlers = new Set<(payload: { studentId: string; readAt: string }) => void>()

export type EngagementNotificationPayload = {
  notification: import('@/services/api').EngagementNotification
  popup: boolean
  at: string
}

function socketUrl() {
  return API_BASE.replace(/\/$/, '')
}

function attachCoreListeners(s: Socket) {
  s.on('desk:community:message', (msg: DeskChatMessage) => {
    communityHandlers.forEach((h) => h(msg))
  })
  s.on('desk:direct:message', (msg: DeskChatMessage) => {
    directHandlers.forEach((h) => h(msg))
  })
  s.on('inbox:message', (msg: InboxMessage) => {
    inboxHandlers.forEach((h) => h(msg))
  })
  s.on('cms:published', (payload: CmsPublishedPayload) => {
    cmsHandlers.forEach((h) => h(payload))
  })
  s.on('live:updated', (payload: LiveUpdatedPayload) => {
    liveHandlers.forEach((h) => h(payload))
  })
  s.on('classroom:updated', (payload: ClassroomUpdatedPayload) => {
    classroomHandlers.forEach((h) => h(payload))
  })
  s.on('notification:new', (payload: EngagementNotificationPayload) => {
    engagementHandlers.forEach((h) => h(payload))
  })
  s.on('desk:community:typing', (payload: TypingPayload) => {
    communityTypingHandlers.forEach((h) => h(payload))
  })
  s.on('desk:direct:typing', (payload: TypingPayload) => {
    directTypingHandlers.forEach((h) => h(payload))
  })
  s.on('desk:direct:read', (payload: { studentId: string; readAt: string }) => {
    directReadHandlers.forEach((h) => h(payload))
  })
}

export function connectAppSocket(role: 'guest' | 'admin' | 'student' | 'teacher' = 'guest') {
  if (socket?.connected && currentRole === role) return socket

  if (socket) {
    socket.disconnect()
    socket = null
  }

  currentRole = role
  const token =
    role === 'admin' || role === 'teacher'
      ? getAdminAuthToken()
      : role === 'student'
        ? getStudentAuthToken()
        : undefined

  socket = io(socketUrl(), {
    path: '/socket.io',
    auth: { token, role },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 12,
  })

  attachCoreListeners(socket)
  return socket
}

export function refreshAppSocketAuth() {
  const adminToken = getAdminAuthToken()
  const studentToken = getStudentAuthToken()
  if (adminToken) {
    connectAppSocket('admin')
    return
  }
  if (studentToken) {
    connectAppSocket('student')
    return
  }
  connectAppSocket('guest')
}

export function getAppSocket() {
  return socket
}

export function onCommunityMessage(handler: (msg: DeskChatMessage) => void) {
  communityHandlers.add(handler)
  return () => {
    communityHandlers.delete(handler)
  }
}

export function onDirectMessage(handler: (msg: DeskChatMessage) => void) {
  directHandlers.add(handler)
  return () => {
    directHandlers.delete(handler)
  }
}

export function onInboxMessage(handler: (msg: InboxMessage) => void) {
  inboxHandlers.add(handler)
  return () => {
    inboxHandlers.delete(handler)
  }
}

export function onCmsPublished(handler: (payload: CmsPublishedPayload) => void) {
  cmsHandlers.add(handler)
  return () => {
    cmsHandlers.delete(handler)
  }
}

export function onLiveUpdated(handler: (payload: LiveUpdatedPayload) => void) {
  liveHandlers.add(handler)
  return () => {
    liveHandlers.delete(handler)
  }
}

export function onClassroomUpdated(handler: (payload: ClassroomUpdatedPayload) => void) {
  classroomHandlers.add(handler)
  return () => {
    classroomHandlers.delete(handler)
  }
}

export function onEngagementNotification(handler: (payload: EngagementNotificationPayload) => void) {
  engagementHandlers.add(handler)
  return () => {
    engagementHandlers.delete(handler)
  }
}

export function emitDeskCommunitySend(payload: ChatSendPayload | string) {
  const body = typeof payload === 'string' ? { message: payload } : payload
  return new Promise<DeskChatMessage>((resolve, reject) => {
    if (!socket) {
      reject(new Error('Not connected'))
      return
    }
    socket.emit('desk:community:send', body, (res: { ok: boolean; data?: DeskChatMessage; error?: string }) => {
      if (res?.ok && res.data) resolve(res.data)
      else reject(new Error(res?.error ?? 'Send failed'))
    })
  })
}

export function emitDeskDirectSend(payload: ChatSendPayload | string, toUserId?: string) {
  const body = typeof payload === 'string' ? { message: payload, toUserId } : { ...payload, toUserId }
  return new Promise<DeskChatMessage>((resolve, reject) => {
    if (!socket) {
      reject(new Error('Not connected'))
      return
    }
    socket.emit('desk:direct:send', body, (res: { ok: boolean; data?: DeskChatMessage; error?: string }) => {
      if (res?.ok && res.data) resolve(res.data)
      else reject(new Error(res?.error ?? 'Send failed'))
    })
  })
}

export function emitDeskCommunityTyping(typing: boolean) {
  socket?.emit('desk:community:typing', { typing })
}

export function emitDeskDirectTyping(typing: boolean, toUserId?: string) {
  socket?.emit('desk:direct:typing', { typing, toUserId })
}

export function onCommunityTyping(handler: (payload: TypingPayload) => void) {
  communityTypingHandlers.add(handler)
  return () => {
    communityTypingHandlers.delete(handler)
  }
}

export function onDirectTyping(handler: (payload: TypingPayload) => void) {
  directTypingHandlers.add(handler)
  return () => {
    directTypingHandlers.delete(handler)
  }
}

export function onDirectRead(handler: (payload: { studentId: string; readAt: string }) => void) {
  directReadHandlers.add(handler)
  return () => {
    directReadHandlers.delete(handler)
  }
}
