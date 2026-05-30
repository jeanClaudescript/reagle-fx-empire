import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { deskChatApi } from '@/services/api'
import { emitDeskDirectSend, onDirectMessage, type DeskChatMessage } from '@/realtime/appSocket'

function mergeMessage(list: DeskChatMessage[], msg: DeskChatMessage) {
  if (list.some((m) => m.id === msg.id)) return list
  return [...list, msg].slice(-200)
}

export function VipCoachChat() {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<DeskChatMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    deskChatApi
      .directList()
      .then((res) => setMessages(res.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => onDirectMessage((msg) => setMessages((prev) => mergeMessage(prev, msg))), [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    const msg = text.trim()
    if (!msg || sending) return
    setSending(true)
    try {
      await emitDeskDirectSend(msg)
      setText('')
    } catch {
      try {
        const res = await deskChatApi.directSend(msg)
        setMessages((prev) => mergeMessage(prev, res.data))
        setText('')
      } catch {
        /* ignore */
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) return <p className="text-sm text-theme-muted">{t.chat.coachLoading}</p>

  return (
    <div className="desk-chat desk-chat--direct">
      <p className="desk-chat__hint text-sm text-theme-muted mb-3">{t.chat.coachHint}</p>
      <div className="desk-chat__messages">
        {messages.length === 0 ? (
          <p className="text-sm text-theme-muted py-4 text-center">{t.chat.coachEmpty}</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`desk-chat__row desk-chat__row--${m.fromRole === 'student' ? 'mine' : 'coach'}`}
            >
              <div className="desk-chat__meta">
                <strong>{m.fromUserName}</strong>
                <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p>{m.message}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="desk-chat__input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder={t.chat.coachPlaceholder}
          maxLength={2000}
        />
        <button type="button" onClick={send} disabled={sending || !text.trim()} aria-label={t.chat.sendAria}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
