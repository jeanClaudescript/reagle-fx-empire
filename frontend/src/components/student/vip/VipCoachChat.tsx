import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { deskChatApi } from '@/services/api'
import { MessengerChat, mergeMessage } from '@/components/chat/MessengerChat'
import type { ChatSendPayload } from '@/components/chat/MessengerComposer'
import {
  emitDeskDirectSend,
  emitDeskDirectTyping,
  onDirectMessage,
  onDirectRead,
  onDirectTyping,
  type DeskChatMessage,
} from '@/realtime/appSocket'

export function VipCoachChat() {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<DeskChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [typingNames, setTypingNames] = useState<string[]>([])
  const [coachTyping, setCoachTyping] = useState(false)

  useEffect(() => {
    deskChatApi
      .directList()
      .then((res) => setMessages(res.data))
      .finally(() => setLoading(false))
    void deskChatApi.directMarkRead()
  }, [])

  useEffect(() => onDirectMessage((msg) => setMessages((prev) => mergeMessage(prev, msg))), [])

  useEffect(
    () =>
      onDirectTyping((p) => {
        if (p.userId && p.userName !== messages[0]?.fromUserName) {
          setCoachTyping(p.typing)
          setTypingNames(p.typing ? ['Coach'] : [])
        }
      }),
    [messages],
  )

  useEffect(
    () =>
      onDirectRead(() => {
        setMessages((prev) =>
          prev.map((m) => (m.fromRole === 'student' ? { ...m, readAt: new Date().toISOString() } : m)),
        )
      }),
    [],
  )

  const send = async (payload: ChatSendPayload) => {
    try {
      const msg = await emitDeskDirectSend(payload)
      setMessages((prev) => mergeMessage(prev, msg))
    } catch {
      const res = await deskChatApi.directSend(payload)
      setMessages((prev) => mergeMessage(prev, res.data))
    }
  }

  const upload = async (file: File) => {
    const res = await deskChatApi.upload(file)
    return res.data
  }

  return (
    <MessengerChat
      title={t.chat.coachTitle}
      subtitle={t.chat.coachHint}
      emptyLabel={t.chat.coachEmpty}
      placeholder={t.chat.coachPlaceholder}
      loading={loading}
      messages={messages}
      mineRole="student"
      showReadReceipts
      typingNames={coachTyping ? typingNames : []}
      onSend={send}
      onUpload={upload}
      onTyping={emitDeskDirectTyping}
    />
  )
}
