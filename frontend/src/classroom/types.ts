export type ClassroomRoomStatus = 'draft' | 'live' | 'ended'
export type JitsiTeachingMode = 'webcam' | 'screenshare'

export type ClassroomRole = 'teacher' | 'moderator' | 'student'

export type ClassroomRoom = {
  id: string
  teacherId: string
  title: string
  description: string
  status: ClassroomRoomStatus
  symbol: string
  timeframe: string
  enableLiveTeaching: boolean
  jitsiRoomName: string
  teachingSessionTitle: string
  teachingScheduledAt?: string
  jitsiMode: JitsiTeachingMode
  startedAt?: string
  endedAt?: string
  createdAt: string
  updatedAt: string
}

export type ClassroomParticipant = {
  id: string
  roomId: string
  userId: string
  userName: string
  role: ClassroomRole
  joinedAt: string
  canSpeak: boolean
}

export type ClassroomChatMessage = {
  id: string
  roomId: string
  userId: string
  userName: string
  role: ClassroomRole
  message: string
  replyToId?: string
  pinned: boolean
  createdAt: string
}

export type DrawingTool =
  | 'select'
  | 'trendline'
  | 'hline'
  | 'vline'
  | 'rectangle'
  | 'support'
  | 'resistance'
  | 'fibonacci'
  | 'arrow'
  | 'text'

export type DrawingObject = {
  id: string
  tool: DrawingTool
  color: string
  points: Array<{ time?: number; price?: number; x?: number; y?: number }>
  text?: string
  meta?: Record<string, unknown>
}

export type ChartRange = {
  from: number
  to: number
}

export type CursorState = {
  x: number
  y: number
  name: string
  userId: string
}

export type TurnConfig = {
  urls: string[]
  username: string
  credential: string
}

export type ClassroomJoinState = {
  room: ClassroomRoom
  participants: ClassroomParticipant[]
  chartState: {
    symbol: string
    timeframe: string
    range: ChartRange | null
    crosshair: Record<string, unknown> | null
    drawings: DrawingObject[]
  }
  chat: ClassroomChatMessage[]
  self: { id: string; name: string; role: ClassroomRole }
  turn: TurnConfig
}

export const CLASSROOM_SYMBOLS = [
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'AUDUSD',
  'USDCAD',
  'XAUUSD',
  'BTCUSD',
] as const

export const CLASSROOM_TIMEFRAMES = ['1', '5', '15', '30', '60', '240', 'D'] as const

export type ClassroomSymbol = (typeof CLASSROOM_SYMBOLS)[number]
