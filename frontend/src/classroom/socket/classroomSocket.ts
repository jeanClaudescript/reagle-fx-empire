import type { Socket } from 'socket.io-client'
import { connectAppSocket, getAppSocket, resolvePreferredAppSocketRole } from '@/realtime/appSocket'
import type { ClassroomJoinState, DrawingObject } from '../types'
import { useClassroomStore } from '../store/useClassroomStore'

function ensureClassroomSocket(token: string, role: 'teacher' | 'student'): Socket {
  const socketRole = role === 'teacher' ? 'teacher' : 'student'
  const preferred = resolvePreferredAppSocketRole()
  connectAppSocket(preferred === socketRole ? preferred : socketRole)
  const socket = getAppSocket()
  if (!socket) throw new Error('Socket not available')
  if (socket.auth && typeof socket.auth === 'object') {
    ;(socket.auth as { token?: string; role?: string }).token = token
    ;(socket.auth as { token?: string; role?: string }).role = socketRole
  }
  return socket
}

function waitForSocketConnect(socket: Socket, timeoutMs = 20_000): Promise<void> {
  if (socket.connected) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      socket.off('connect', onConnect)
      socket.off('connect_error', onError)
      reject(new Error('Could not connect to classroom server'))
    }, timeoutMs)
    const onConnect = () => {
      window.clearTimeout(timer)
      socket.off('connect_error', onError)
      resolve()
    }
    const onError = (err: Error) => {
      window.clearTimeout(timer)
      socket.off('connect', onConnect)
      reject(err instanceof Error ? err : new Error('Connection failed'))
    }
    socket.once('connect', onConnect)
    socket.once('connect_error', onError)
    socket.connect()
  })
}

let classroomListenersAttached = false

function attachClassroomListeners(socket: Socket) {
  if (classroomListenersAttached) return
  classroomListenersAttached = true

  const store = useClassroomStore.getState()

  socket.on('connect', () => store.setConnected(true))
  socket.on('disconnect', () => store.setConnected(false))

  socket.on('classroom:participants', (participants) => {
    store.setParticipants(participants)
  })

  socket.on('chart:symbol', (payload: { symbol: string }) => {
    if (payload.symbol) store.setSymbol(payload.symbol)
  })

  socket.on('chart:timeframe', (payload: { timeframe: string }) => {
    if (payload.timeframe) store.setTimeframe(payload.timeframe)
  })

  socket.on('drawing:add', (payload: DrawingObject) => {
    store.upsertDrawing(payload)
  })

  socket.on('drawing:update', (payload: DrawingObject) => {
    store.upsertDrawing(payload)
  })

  socket.on('drawing:delete', (payload: { id: string }) => {
    if (payload.id) store.removeDrawing(payload.id)
  })

  socket.on('cursor:move', (payload: { x: number; y: number; name: string; userId: string }) => {
    store.setCursor(payload)
  })

  socket.on('chat:message', (msg) => {
    store.addChatMessage(msg)
  })

  socket.on('chat:pinned', (payload: { id: string; pinned: boolean }) => {
    store.setChatPinned(payload.id, payload.pinned)
  })

  socket.on('audio:grant', (payload: { userId: string; canSpeak: boolean }) => {
    const selfId = useClassroomStore.getState().selfId
    if (payload.userId === selfId) {
      store.setCanSpeak(payload.canSpeak)
    }
  })

  socket.on('jitsi:mode', (payload: { mode?: string }) => {
    store.setJitsiMode(payload?.mode === 'screenshare' ? 'screenshare' : 'webcam')
  })
}

export function connectClassroomSocket(token: string, role: 'teacher' | 'student') {
  const socket = ensureClassroomSocket(token, role)
  attachClassroomListeners(socket)
  return socket
}

export async function ensureClassroomSocketConnected(token: string, role: 'teacher' | 'student') {
  const socket = connectClassroomSocket(token, role)
  await waitForSocketConnect(socket)
  return socket
}

export function disconnectClassroomSocket() {
  useClassroomStore.getState().reset()
}

export function joinClassroomRoom(roomId: string): Promise<ClassroomJoinState> {
  return new Promise((resolve, reject) => {
    const socket = getAppSocket()
    if (!socket) {
      reject(new Error('Socket not connected'))
      return
    }

    const timer = window.setTimeout(() => {
      reject(new Error('Joining classroom timed out — check your connection and try again'))
    }, 25_000)

    socket.emit('classroom:join', { roomId }, (res: { ok: boolean; data?: ClassroomJoinState; error?: string }) => {
      window.clearTimeout(timer)
      if (res?.ok && res.data) {
        useClassroomStore.getState().applyJoinState(res.data)
        resolve(res.data)
      } else {
        reject(new Error(res?.error ?? 'Failed to join classroom'))
      }
    })
  })
}

export function leaveClassroomRoom(endSession = false) {
  getAppSocket()?.emit('classroom:leave', endSession ? { endSession: true } : undefined)
}

export function emitChartSymbol(symbol: string) {
  getAppSocket()?.emit('chart:symbol', { symbol })
}

export function emitChartTimeframe(timeframe: string) {
  getAppSocket()?.emit('chart:timeframe', { timeframe })
}

export function emitChartRange(range: { from: number; to: number }) {
  getAppSocket()?.emit('chart:range', range)
}

export function emitCursorMove(x: number, y: number) {
  getAppSocket()?.emit('cursor:move', { x, y })
}

export function emitDrawingAdd(drawing: DrawingObject) {
  getAppSocket()?.emit('drawing:add', drawing)
}

export function emitDrawingUpdate(drawing: DrawingObject) {
  getAppSocket()?.emit('drawing:update', drawing)
}

export function emitDrawingDelete(id: string) {
  getAppSocket()?.emit('drawing:delete', { id })
}

export function emitChatSend(message: string, replyToId?: string) {
  return new Promise<void>((resolve, reject) => {
    getAppSocket()?.emit('chat:send', { message, replyToId }, (res: { ok: boolean; error?: string }) => {
      if (res?.ok) resolve()
      else reject(new Error(res?.error ?? 'Send failed'))
    })
  })
}

export function emitChatPin(messageId: string, pinned: boolean) {
  getAppSocket()?.emit('chat:pin', { messageId, pinned })
}

export function emitAudioGrant(userId: string, canSpeak: boolean) {
  getAppSocket()?.emit('audio:grant', { userId, canSpeak })
}

export function emitWebRtcSignal(targetUserId: string, signal: unknown) {
  getAppSocket()?.emit('webrtc:signal', { targetUserId, signal })
}

export function emitJitsiMode(mode: 'webcam' | 'screenshare') {
  getAppSocket()?.emit('jitsi:mode', { mode })
}

export function onWebRtcSignal(handler: (payload: { fromUserId: string; targetUserId: string; signal: unknown }) => void) {
  const socket = getAppSocket()
  socket?.on('webrtc:signal', handler)
  return () => {
    socket?.off('webrtc:signal', handler)
  }
}

export function getClassroomSocket() {
  return getAppSocket()
}
