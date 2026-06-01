export type ChatMessageType = 'text' | 'image' | 'video' | 'voice' | 'file'

export type ChatAttachment = {
  url: string
  type: 'image' | 'video' | 'voice' | 'file'
  mimeType?: string
  fileName?: string
  durationSec?: number
  width?: number
  height?: number
}

export type ChatSendPayload = {
  message?: string
  messageType?: ChatMessageType
  attachments?: ChatAttachment[]
  replyTo?: { id: string; preview: string; fromUserName: string }
}

export type DeskChatChannel = 'vip-community' | 'regular-community' | 'direct'

export type SerializedDeskChatMessage = {
  id: string
  channel: DeskChatChannel
  fromUserId: string
  fromUserName: string
  fromRole: 'admin' | 'student'
  toUserId?: string
  message: string
  messageType: ChatMessageType
  attachments?: ChatAttachment[]
  replyTo?: { id: string; preview: string; fromUserName: string }
  createdAt: string
  readAt?: string
}
