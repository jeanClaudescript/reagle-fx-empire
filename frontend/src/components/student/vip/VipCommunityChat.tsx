import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { deskChatApi } from '@/services/api'
import { emitDeskCommunitySend, onCommunityMessage, type DeskChatMessage } from '@/realtime/appSocket'

function mergeMessage(list: DeskChatMessage[], msg: DeskChatMessage) {
  if (list.some((m) => m.id === msg.id)) return list
  return [...list, msg].slice(-200)
}

export function VipCommunityChat() {
  const [messages, setMessages] = useState<DeskChatMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    deskChatApi
      .communityList()
      .then((res) => setMessages(res.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => onCommunityMessage((msg) => setMessages((prev) => mergeMessage(prev, msg))), [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    const msg = text.trim()
    if (!msg || sending) return
    setSending(true)
    try {
      await emitDeskCommunitySend(msg)
      setText('')
    } catch {
      try {
        const res = await deskChatApi.communitySend(msg)
        setMessages((prev) => mergeMessage(prev, res.data))
        setText('')
      } catch {
        /* ignore */
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) return <p className="text-sm text-theme-muted">Loading chat…</p>

  return (
    <div className="desk-chat">
      <p className="desk-chat__hint text-sm text-theme-muted mb-3">
        VIP community chat — updates instantly for all paid members and Coach.
      </p>
      <div className="desk-chat__messages">
        {messages.map((m) => (
          <div key={m.id} className={`desk-chat__row desk-chat__row--${m.fromRole}`}>
            <div className="desk-chat__meta">
              <strong>{m.fromUserName}</strong>
              <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p>{m.message}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="desk-chat__input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Message the VIP community…"
          maxLength={2000}
        />
        <button type="button" onClick={send} disabled={sending || !text.trim()} aria-label="Send">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
