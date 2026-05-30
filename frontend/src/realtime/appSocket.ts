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
  createdAt: string
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

export function emitDeskCommunitySend(message: string) {
  return new Promise<DeskChatMessage>((resolve, reject) => {
    if (!socket) {
      reject(new Error('Not connected'))
      return
    }
    socket.emit('desk:community:send', { message }, (res: { ok: boolean; data?: DeskChatMessage; error?: string }) => {
      if (res?.ok && res.data) resolve(res.data)
      else reject(new Error(res?.error ?? 'Send failed'))
    })
  })
}

export function emitDeskDirectSend(message: string, toUserId?: string) {
  return new Promise<DeskChatMessage>((resolve, reject) => {
    if (!socket) {
      reject(new Error('Not connected'))
      return
    }
    socket.emit('desk:direct:send', { message, toUserId }, (res: { ok: boolean; data?: DeskChatMessage; error?: string }) => {
      if (res?.ok && res.data) resolve(res.data)
      else reject(new Error(res?.error ?? 'Send failed'))
    })
  })
}
