import type { Server as HttpServer } from 'http'
import { Server, type Socket } from 'socket.io'
import { env } from '../config/env.js'
import { validateAdminSession } from '../services/adminAuthService.js'
import { validateStudentSession } from '../services/studentAuthService.js'
import { saveDeskChatMessage } from '../services/deskChatService.js'
import {
  getClassroomRoom,
  getRoomChartState,
  joinClassroomParticipant,
  leaveClassroomParticipant,
  listActiveParticipants,
  listRecentChatMessages,
  pinChatMessage,
  recordClassroomEvent,
  saveChatMessage,
  setParticipantCanSpeak,
} from '../services/classroomService.js'
import { emitToAdmins, emitToDirectThread, emitToVip, setIo } from './io.js'

export type ClassroomSocketRole = 'teacher' | 'moderator' | 'student'

export type AppSocketRole = 'guest' | 'admin' | 'student' | 'teacher'

export type AppSocketUser = {
  id: string
  name: string
  role: AppSocketRole
}

type SocketData = {
  user: AppSocketUser
  roomId?: string
}

const CURSOR_THROTTLE_MS = 50
const cursorLastSent = new Map<string, number>()

function isChartController(role: AppSocketRole) {
  return role === 'teacher' || role === 'admin'
}

function isTeacherSocket(role: AppSocketRole) {
  return role === 'teacher' || role === 'admin'
}

function classroomRoleFromUser(role: AppSocketRole): 'teacher' | 'student' {
  return role === 'student' ? 'student' : 'teacher'
}

async function resolveAppUser(token: string | undefined, roleHint?: string): Promise<AppSocketUser> {
  if (!token) {
    return { id: 'guest', name: 'Guest', role: 'guest' }
  }

  if (roleHint === 'teacher') {
    const admin = await validateAdminSession(token)
    if (!admin) throw new Error('Unauthorized')
    return {
      id: String(admin.user._id),
      name: admin.user.name || admin.user.email || 'Teacher',
      role: 'teacher',
    }
  }

  if (roleHint === 'admin') {
    const admin = await validateAdminSession(token)
    if (!admin) throw new Error('Unauthorized')
    return {
      id: String(admin.user._id),
      name: admin.user.name || admin.user.email || 'Coach',
      role: 'admin',
    }
  }

  if (roleHint === 'student') {
    const student = await validateStudentSession(token)
    if (!student) throw new Error('Unauthorized')
    return {
      id: String(student.user._id),
      name: student.user.name || student.user.phone || student.user.email || 'Student',
      role: 'student',
    }
  }

  const admin = await validateAdminSession(token)
  if (admin) {
    return {
      id: String(admin.user._id),
      name: admin.user.name || admin.user.email || 'Coach',
      role: 'admin',
    }
  }

  const student = await validateStudentSession(token)
  if (student) {
    return {
      id: String(student.user._id),
      name: student.user.name || student.user.phone || student.user.email || 'Student',
      role: 'student',
    }
  }

  throw new Error('Unauthorized')
}

function joinRoleRooms(socket: Socket, user: AppSocketUser) {
  if (user.role === 'admin' || user.role === 'teacher') {
    void socket.join('role:admin')
  }
  if (user.role === 'student') {
    void socket.join('role:vip')
    void socket.join(`direct:${user.id}`)
  }
}

function roomChannel(roomId: string) {
  return `classroom:${roomId}`
}

async function hasTeacherSocketInRoom(io: Server, roomId: string) {
  const sockets = await io.in(roomChannel(roomId)).fetchSockets()
  return sockets.some((s) => {
    const user = (s.data as SocketData).user
    return isTeacherSocket(user.role)
  })
}

async function onTeacherLeftRoom(io: Server, roomId: string) {
  const { scheduleClassroomEndIfNoTeacher } = await import('../services/classroomService.js')
  scheduleClassroomEndIfNoTeacher(roomId, () => hasTeacherSocketInRoom(io, roomId))
}

async function persistAndBroadcast(
  io: Server,
  roomId: string,
  eventType: string,
  payload: Record<string, unknown>,
  userId?: string,
  skipPersist = false,
) {
  if (!skipPersist) {
    await recordClassroomEvent({ roomId, eventType, payload, userId })
  }
  io.to(roomChannel(roomId)).emit(eventType, payload)
}

export function initClassroomSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.frontendOrigins,
      credentials: true,
    },
    path: '/socket.io',
    maxHttpBufferSize: 1e6,
    pingInterval: 25000,
    pingTimeout: 60000,
  })

  io.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.query?.token as string | undefined)
      const roleHint = socket.handshake.auth?.role as string | undefined
      const user = await resolveAppUser(token, roleHint)
      ;(socket.data as SocketData).user = user
      return next()
    } catch (error) {
      return next(error instanceof Error ? error : new Error('Auth failed'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const data = socket.data as SocketData
    joinRoleRooms(socket, data.user)

    socket.on('classroom:join', async (payload: { roomId: string }, ack?: (res: unknown) => void) => {
      try {
        const roomId = payload?.roomId
        if (!roomId) throw new Error('roomId is required')
        if (data.user.role === 'guest') throw new Error('Sign in required')

        const room = await getClassroomRoom(roomId)
        if (data.user.role === 'student' && room.status !== 'live') {
          throw new Error('Classroom is not live')
        }
        const classroomRole = classroomRoleFromUser(data.user.role)

        if (data.roomId && data.roomId !== roomId) {
          await socket.leave(roomChannel(data.roomId))
        }

        data.roomId = roomId
        await socket.join(roomChannel(roomId))

        await joinClassroomParticipant({
          roomId,
          userId: data.user.id,
          userName: data.user.name,
          role: classroomRole,
          socketId: socket.id,
        })

        if (classroomRole === 'teacher') {
          const { cancelClassroomEndIfNoTeacher } = await import('../services/classroomService.js')
          cancelClassroomEndIfNoTeacher(roomId)
        }

        const [participants, chartState, chat] = await Promise.all([
          listActiveParticipants(roomId),
          getRoomChartState(roomId),
          listRecentChatMessages(roomId),
        ])

        const state = {
          room,
          participants,
          chartState,
          chat,
          self: {
            id: data.user.id,
            name: data.user.name,
            role: classroomRole,
          },
          turn: {
            urls: env.turnUrls,
            username: env.turnUsername,
            credential: env.turnCredential,
          },
        }

        io.to(roomChannel(roomId)).emit('classroom:participants', participants)
        ack?.({ ok: true, data: state })
      } catch (error) {
        ack?.({
          ok: false,
          error: error instanceof Error ? error.message : 'Join failed',
        })
      }
    })

    socket.on('classroom:leave', async (payload?: { endSession?: boolean }) => {
      const roomId = data.roomId
      if (!roomId) return
      const wasTeacher = isTeacherSocket(data.user.role)
      await leaveClassroomParticipant(roomId, data.user.id)
      await socket.leave(roomChannel(roomId))
      data.roomId = undefined
      const participants = await listActiveParticipants(roomId)
      io.to(roomChannel(roomId)).emit('classroom:participants', participants)
      if (wasTeacher) {
        if (payload?.endSession) {
          const { endClassroomIfNoTeacher } = await import('../services/classroomService.js')
          await endClassroomIfNoTeacher(roomId, () => hasTeacherSocketInRoom(io, roomId))
        } else {
          await onTeacherLeftRoom(io, roomId)
        }
      }
    })

    socket.on('chart:symbol', async (payload: { symbol: string }) => {
      const roomId = data.roomId
      if (!roomId || !isChartController(data.user.role)) return
      if (!payload?.symbol) return
      await persistAndBroadcast(io, roomId, 'chart:symbol', { symbol: payload.symbol }, data.user.id)
    })

    socket.on('chart:timeframe', async (payload: { timeframe: string }) => {
      const roomId = data.roomId
      if (!roomId || !isChartController(data.user.role)) return
      if (!payload?.timeframe) return
      await persistAndBroadcast(
        io,
        roomId,
        'chart:timeframe',
        { timeframe: payload.timeframe },
        data.user.id,
      )
    })

    socket.on('chart:range', async (payload: Record<string, unknown>) => {
      const roomId = data.roomId
      if (!roomId || !isChartController(data.user.role)) return
      await persistAndBroadcast(io, roomId, 'chart:range', payload, data.user.id)
    })

    socket.on('chart:crosshair', async (payload: Record<string, unknown>) => {
      const roomId = data.roomId
      if (!roomId || !isChartController(data.user.role)) return
      await persistAndBroadcast(io, roomId, 'chart:crosshair', payload, data.user.id, true)
    })

    socket.on(
      'cursor:move',
      (payload: { x: number; y: number; name?: string; userId?: string }) => {
        const roomId = data.roomId
        if (!roomId || !isChartController(data.user.role)) return
        const key = `${roomId}:${data.user.id}`
        const now = Date.now()
        const last = cursorLastSent.get(key) ?? 0
        if (now - last < CURSOR_THROTTLE_MS) return
        cursorLastSent.set(key, now)
        socket.to(roomChannel(roomId)).emit('cursor:move', {
          x: payload.x,
          y: payload.y,
          name: data.user.name,
          userId: data.user.id,
        })
      },
    )

    socket.on('drawing:add', async (payload: Record<string, unknown>) => {
      const roomId = data.roomId
      if (!roomId || !isChartController(data.user.role)) return
      if (!payload?.id) return
      await persistAndBroadcast(io, roomId, 'drawing:add', payload, data.user.id)
    })

    socket.on('drawing:update', async (payload: Record<string, unknown>) => {
      const roomId = data.roomId
      if (!roomId || !isChartController(data.user.role)) return
      if (!payload?.id) return
      await persistAndBroadcast(io, roomId, 'drawing:update', payload, data.user.id)
    })

    socket.on('drawing:delete', async (payload: { id: string }) => {
      const roomId = data.roomId
      if (!roomId || !isChartController(data.user.role)) return
      if (!payload?.id) return
      await persistAndBroadcast(io, roomId, 'drawing:delete', { id: payload.id }, data.user.id)
    })

    socket.on(
      'chat:send',
      async (
        payload: { message: string; replyToId?: string },
        ack?: (res: unknown) => void,
      ) => {
        try {
          const roomId = data.roomId
          if (!roomId) throw new Error('Not in a room')
          const msg = await saveChatMessage({
            roomId,
            userId: data.user.id,
            userName: data.user.name,
            role: classroomRoleFromUser(data.user.role),
            message: payload.message,
            replyToId: payload.replyToId,
          })
          io.to(roomChannel(roomId)).emit('chat:message', msg)
          ack?.({ ok: true, data: msg })
        } catch (error) {
          ack?.({ ok: false, error: error instanceof Error ? error.message : 'Send failed' })
        }
      },
    )

    socket.on(
      'chat:pin',
      async (payload: { messageId: string; pinned: boolean }, ack?: (res: unknown) => void) => {
        try {
          const roomId = data.roomId
          if (!roomId) throw new Error('Not in a room')
          if (data.user.role === 'student') throw new Error('Not allowed')
          const result = await pinChatMessage(roomId, payload.messageId, payload.pinned)
          io.to(roomChannel(roomId)).emit('chat:pinned', result)
          ack?.({ ok: true, data: result })
        } catch (error) {
          ack?.({ ok: false, error: error instanceof Error ? error.message : 'Pin failed' })
        }
      },
    )

    socket.on(
      'audio:grant',
      async (payload: { userId: string; canSpeak: boolean }, ack?: (res: unknown) => void) => {
        try {
          const roomId = data.roomId
          if (!roomId || !isTeacherSocket(data.user.role)) throw new Error('Not allowed')
          const result = await setParticipantCanSpeak(roomId, payload.userId, payload.canSpeak)
          io.to(roomChannel(roomId)).emit('audio:grant', result)
          ack?.({ ok: true, data: result })
        } catch (error) {
          ack?.({ ok: false, error: error instanceof Error ? error.message : 'Grant failed' })
        }
      },
    )

    socket.on('webrtc:signal', (payload: { targetUserId: string; signal: unknown }) => {
      const roomId = data.roomId
      if (!roomId || !payload?.targetUserId) return
      io.to(roomChannel(roomId)).emit('webrtc:signal', {
        fromUserId: data.user.id,
        targetUserId: payload.targetUserId,
        signal: payload.signal,
      })
    })

    socket.on('jitsi:mode', (payload: { mode?: string }) => {
      const roomId = data.roomId
      if (!roomId || !isChartController(data.user.role)) return
      const mode = payload?.mode === 'screenshare' ? 'screenshare' : 'webcam'
      io.to(roomChannel(roomId)).emit('jitsi:mode', { mode })
    })

    socket.on(
      'desk:community:send',
      async (payload: { message?: string; messageType?: string; attachments?: unknown[]; replyTo?: unknown }, ack?: (res: unknown) => void) => {
        try {
          if (data.user.role !== 'student' && data.user.role !== 'admin') {
            throw new Error('Not allowed')
          }
          const msg = await saveDeskChatMessage({
            channel: 'vip-community',
            fromUserId: data.user.id,
            fromUserName: data.user.name,
            fromRole: data.user.role === 'admin' ? 'admin' : 'student',
            payload: {
              message: payload.message,
              messageType: payload.messageType as import('../types/chat.js').ChatMessageType | undefined,
              attachments: payload.attachments as import('../types/chat.js').ChatAttachment[] | undefined,
              replyTo: payload.replyTo as import('../types/chat.js').SerializedDeskChatMessage['replyTo'],
            },
          })
          emitToVip('desk:community:message', msg)
          emitToAdmins('desk:community:message', msg)
          ack?.({ ok: true, data: msg })
        } catch (error) {
          ack?.({ ok: false, error: error instanceof Error ? error.message : 'Send failed' })
        }
      },
    )

    socket.on(
      'desk:direct:send',
      async (
        payload: { message?: string; messageType?: string; attachments?: unknown[]; replyTo?: unknown; toUserId?: string },
        ack?: (res: unknown) => void,
      ) => {
        try {
          const sendPayload = {
            message: payload.message,
            messageType: payload.messageType as import('../types/chat.js').ChatMessageType | undefined,
            attachments: payload.attachments as import('../types/chat.js').ChatAttachment[] | undefined,
            replyTo: payload.replyTo as import('../types/chat.js').SerializedDeskChatMessage['replyTo'],
          }
          if (data.user.role === 'student') {
            const msg = await saveDeskChatMessage({
              channel: 'direct',
              fromUserId: data.user.id,
              fromUserName: data.user.name,
              fromRole: 'student',
              toUserId: 'admin',
              payload: sendPayload,
            })
            emitToDirectThread(data.user.id, 'desk:direct:message', msg)
            emitToAdmins('desk:direct:message', msg)
            ack?.({ ok: true, data: msg })
            return
          }
          if (data.user.role === 'admin' && payload.toUserId) {
            const msg = await saveDeskChatMessage({
              channel: 'direct',
              fromUserId: data.user.id,
              fromUserName: data.user.name,
              fromRole: 'admin',
              toUserId: payload.toUserId,
              payload: sendPayload,
            })
            emitToDirectThread(payload.toUserId, 'desk:direct:message', msg)
            emitToAdmins('desk:direct:message', msg)
            ack?.({ ok: true, data: msg })
            return
          }
          throw new Error('Not allowed')
        } catch (error) {
          ack?.({ ok: false, error: error instanceof Error ? error.message : 'Send failed' })
        }
      },
    )

    socket.on('desk:community:typing', (payload: { typing?: boolean }) => {
      if (data.user.role !== 'student' && data.user.role !== 'admin') return
      emitToVip('desk:community:typing', {
        userId: data.user.id,
        userName: data.user.name,
        typing: payload?.typing !== false,
      })
      emitToAdmins('desk:community:typing', {
        userId: data.user.id,
        userName: data.user.name,
        typing: payload?.typing !== false,
      })
    })

    socket.on('desk:direct:typing', (payload: { typing?: boolean; toUserId?: string }) => {
      if (data.user.role === 'student') {
        emitToAdmins('desk:direct:typing', {
          userId: data.user.id,
          userName: data.user.name,
          studentId: data.user.id,
          typing: payload?.typing !== false,
        })
        return
      }
      if (data.user.role === 'admin' && payload.toUserId) {
        emitToDirectThread(payload.toUserId, 'desk:direct:typing', {
          userId: data.user.id,
          userName: data.user.name,
          typing: payload?.typing !== false,
        })
      }
    })

    socket.on('disconnect', async () => {
      const roomId = data.roomId
      if (!roomId) return
      const wasTeacher = isTeacherSocket(data.user.role)
      await leaveClassroomParticipant(roomId, data.user.id)
      const participants = await listActiveParticipants(roomId)
      io.to(roomChannel(roomId)).emit('classroom:participants', participants)
      if (wasTeacher) await onTeacherLeftRoom(io, roomId)
    })
  })

  setIo(io)
  return io
}
