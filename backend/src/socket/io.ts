import type { Server } from 'socket.io'

let io: Server | null = null

export function setIo(server: Server) {
  io = server
}

export function getIo() {
  return io
}

export function emitToAll(event: string, payload: unknown) {
  io?.emit(event, payload)
}

export function emitToAdmins(event: string, payload: unknown) {
  io?.to('role:admin').emit(event, payload)
}

export function emitToVip(event: string, payload: unknown) {
  io?.to('role:vip').emit(event, payload)
}

export function emitToDirectThread(studentId: string, event: string, payload: unknown) {
  io?.to(`direct:${studentId}`).emit(event, payload)
}
