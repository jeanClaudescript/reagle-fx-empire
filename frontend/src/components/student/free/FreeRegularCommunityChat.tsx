import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { deskChatApi } from '@/services/api'
import { MessengerChat, mergeMessage } from '@/components/chat/MessengerChat'
import type { ChatSendPayload } from '@/components/chat/MessengerComposer'
import {
  emitDeskRegularCommunitySend,
  emitDeskRegularCommunityTyping,
  onRegularCommunityMessage,
  onRegularCommunityTyping,
  type DeskChatMessage,
} from '@/realtime/appSocket'

export function FreeRegularCommunityChat() {
  const { t } = useLanguage()
  const c = t.chat
  const [messages, setMessages] = useState<DeskChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [typingNames, setTypingNames] = useState<string[]>([])

  useEffect(() => {
    deskChatApi
      .regularCommunityList()
      .then((res) => setMessages(res.data.filter((m) => m.channel === 'regular-community')))
      .finally(() => setLoading(false))
  }, [])

  useEffect(
    () =>
      onRegularCommunityMessage((msg) => {
        if (msg.channel !== 'regular-community') return
        setMessages((prev) => mergeMessage(prev, msg))
      }),
    [],
  )

  useEffect(
    () =>
      onRegularCommunityTyping((p) => {
        if (!p.typing) {
          setTypingNames((prev) => prev.filter((n) => n !== p.userName))
          return
        }
        setTypingNames((prev) => (prev.includes(p.userName) ? prev : [...prev, p.userName]))
        window.setTimeout(() => {
          setTypingNames((prev) => prev.filter((n) => n !== p.userName))
        }, 3000)
      }),
    [],
  )

  const send = async (payload: ChatSendPayload) => {
    try {
      const msg = await emitDeskRegularCommunitySend(payload)
      setMessages((prev) => mergeMessage(prev, msg))
    } catch {
      const res = await deskChatApi.regularCommunitySend(payload)
      setMessages((prev) => mergeMessage(prev, res.data))
    }
  }

  const upload = async (file: File) => {
    const res = await deskChatApi.regularUpload(file)
    return res.data
  }

  return (
    <MessengerChat
      title={c.regularCommunityTitle}
      subtitle={c.liveRealtime}
      emptyLabel={c.regularCommunityEmpty}
      placeholder={c.regularCommunityPlaceholder}
      loading={loading}
      messages={messages}
      mineRole="student"
      groupChat
      typingNames={typingNames}
      onSend={send}
      onUpload={upload}
      onTyping={emitDeskRegularCommunityTyping}
    />
  )
}
