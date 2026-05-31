import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { deskChatApi } from '@/services/api'
import { MessengerChat, mergeMessage } from '@/components/chat/MessengerChat'
import type { ChatSendPayload } from '@/components/chat/MessengerComposer'
import {
  emitDeskCommunitySend,
  emitDeskCommunityTyping,
  onCommunityMessage,
  onCommunityTyping,
  type DeskChatMessage,
} from '@/realtime/appSocket'

export function VipCommunityChat() {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<DeskChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [typingNames, setTypingNames] = useState<string[]>([])

  useEffect(() => {
    deskChatApi
      .communityList()
      .then((res) => setMessages(res.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => onCommunityMessage((msg) => setMessages((prev) => mergeMessage(prev, msg))), [])

  useEffect(
    () =>
      onCommunityTyping((p) => {
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
      await emitDeskCommunitySend(payload)
    } catch {
      const res = await deskChatApi.communitySend(payload)
      setMessages((prev) => mergeMessage(prev, res.data))
    }
  }

  const upload = async (file: File) => {
    const res = await deskChatApi.upload(file)
    return res.data
  }

  return (
    <MessengerChat
      title={t.chat.communityTitle}
      subtitle={t.chat.liveRealtime}
      emptyLabel={t.chat.communityEmpty}
      placeholder={t.chat.communityPlaceholder}
      loading={loading}
      messages={messages}
      mineRole="student"
      groupChat
      typingNames={typingNames}
      onSend={send}
      onUpload={upload}
      onTyping={emitDeskCommunityTyping}
    />
  )
}
