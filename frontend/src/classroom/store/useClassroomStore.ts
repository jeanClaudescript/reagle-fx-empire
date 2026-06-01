import { create } from 'zustand'
import type {
  ClassroomChatMessage,
  ClassroomJoinState,
  ClassroomParticipant,
  ClassroomRole,
  ClassroomRoom,
  CursorState,
  DrawingObject,
  DrawingTool,
  JitsiTeachingMode,
  TurnConfig,
} from '../types'

type ClassroomStore = {
  connected: boolean
  roomId: string | null
  role: ClassroomRole
  selfId: string
  selfName: string
  symbol: string
  timeframe: string
  enableLiveTeaching: boolean
  jitsiRoomName: string
  teachingSessionTitle: string
  jitsiMode: JitsiTeachingMode
  participants: ClassroomParticipant[]
  chat: ClassroomChatMessage[]
  drawings: DrawingObject[]
  cursors: Record<string, CursorState>
  activeTool: DrawingTool
  canSpeak: boolean
  turn: TurnConfig | null
  replyTo: ClassroomChatMessage | null
  setConnected: (v: boolean) => void
  applyJoinState: (state: ClassroomJoinState) => void
  setSymbol: (symbol: string) => void
  setTimeframe: (tf: string) => void
  setParticipants: (p: ClassroomParticipant[]) => void
  addChatMessage: (msg: ClassroomChatMessage) => void
  setChatPinned: (messageId: string, pinned: boolean) => void
  upsertDrawing: (d: DrawingObject) => void
  removeDrawing: (id: string) => void
  setDrawings: (drawings: DrawingObject[]) => void
  setCursor: (cursor: CursorState) => void
  setActiveTool: (tool: DrawingTool) => void
  setCanSpeak: (v: boolean) => void
  setReplyTo: (msg: ClassroomChatMessage | null) => void
  setJitsiMode: (mode: JitsiTeachingMode) => void
  applyRoomSettings: (
    room: Pick<
      ClassroomRoom,
      'enableLiveTeaching' | 'jitsiRoomName' | 'teachingSessionTitle' | 'jitsiMode' | 'status' | 'title'
    >,
  ) => void
  reset: () => void
}

const initial = {
  connected: false,
  roomId: null as string | null,
  role: 'student' as ClassroomRole,
  selfId: '',
  selfName: '',
  symbol: 'EURUSD',
  timeframe: '15',
  enableLiveTeaching: false,
  jitsiRoomName: '',
  teachingSessionTitle: '',
  jitsiMode: 'webcam' as JitsiTeachingMode,
  participants: [] as ClassroomParticipant[],
  chat: [] as ClassroomChatMessage[],
  drawings: [] as DrawingObject[],
  cursors: {} as Record<string, CursorState>,
  activeTool: 'select' as DrawingTool,
  canSpeak: false,
  turn: null as TurnConfig | null,
  replyTo: null as ClassroomChatMessage | null,
}

export const useClassroomStore = create<ClassroomStore>((set) => ({
  ...initial,
  setConnected: (connected) => set({ connected }),
  applyJoinState: (state) =>
    set({
      roomId: state.room.id,
      role: state.self.role === 'student' ? 'student' : 'teacher',
      selfId: state.self.id,
      selfName: state.self.name,
      symbol: state.chartState.symbol,
      timeframe: state.chartState.timeframe,
      participants: state.participants,
      chat: state.chat,
      drawings: state.chartState.drawings as DrawingObject[],
      canSpeak: state.self.role === 'teacher',
      turn: state.turn,
      enableLiveTeaching: Boolean(state.room.enableLiveTeaching),
      jitsiRoomName: state.room.jitsiRoomName ?? '',
      teachingSessionTitle: state.room.teachingSessionTitle || state.room.title,
      jitsiMode: state.room.jitsiMode === 'screenshare' ? 'screenshare' : 'webcam',
    }),
  setSymbol: (symbol) => set({ symbol }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setParticipants: (participants) => set({ participants }),
  addChatMessage: (msg) =>
    set((s) => ({
      chat: [...s.chat.filter((m) => m.id !== msg.id), msg].slice(-200),
    })),
  setChatPinned: (messageId, pinned) =>
    set((s) => ({
      chat: s.chat.map((m) =>
        m.id === messageId ? { ...m, pinned } : pinned ? { ...m, pinned: false } : m,
      ),
    })),
  upsertDrawing: (d) =>
    set((s) => {
      const idx = s.drawings.findIndex((x) => x.id === d.id)
      if (idx >= 0) {
        const next = [...s.drawings]
        next[idx] = d
        return { drawings: next }
      }
      return { drawings: [...s.drawings, d] }
    }),
  removeDrawing: (id) => set((s) => ({ drawings: s.drawings.filter((d) => d.id !== id) })),
  setDrawings: (drawings) => set({ drawings }),
  setCursor: (cursor) =>
    set((s) => ({
      cursors: { ...s.cursors, [cursor.userId]: cursor },
    })),
  setActiveTool: (activeTool) => set({ activeTool }),
  setCanSpeak: (canSpeak) => set({ canSpeak }),
  setReplyTo: (replyTo) => set({ replyTo }),
  setJitsiMode: (jitsiMode) => set({ jitsiMode }),
  applyRoomSettings: (room) =>
    set({
      enableLiveTeaching: Boolean(room.enableLiveTeaching),
      jitsiRoomName: room.jitsiRoomName ?? '',
      teachingSessionTitle: room.teachingSessionTitle || room.title,
      jitsiMode: room.jitsiMode === 'screenshare' ? 'screenshare' : 'webcam',
    }),
  reset: () => set({ ...initial }),
}))
