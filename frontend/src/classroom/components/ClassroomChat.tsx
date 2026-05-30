import { useEffect, useRef, useState } from 'react'
import { Pin, Reply, Send } from 'lucide-react'
import type { ClassroomChatMessage } from '../types'
import { useClassroomStore } from '../store/useClassroomStore'
import { emitChatPin, emitChatSend } from '../socket/classroomSocket'

export function ClassroomChat() {
  const chat = useClassroomStore((s) => s.chat)
  const role = useClassroomStore((s) => s.role)
  const replyTo = useClassroomStore((s) => s.replyTo)
  const setReplyTo = useClassroomStore((s) => s.setReplyTo)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.length])

  const send = async () => {
    const msg = text.trim()
    if (!msg || sending) return
    setSending(true)
    try {
      await emitChatSend(msg, replyTo?.id)
      setText('')
      setReplyTo(null)
    } finally {
      setSending(false)
    }
  }

  const canModerate = role === 'teacher' || role === 'moderator'

  return (
    <div className="classroom-chat">
      <div className="classroom-chat__header">Live chat</div>
      <div className="classroom-chat__messages">
        {chat.map((m) => (
          <ChatRow
            key={m.id}
            message={m}
            canModerate={canModerate}
            onReply={() => setReplyTo(m)}
            onPin={() => emitChatPin(m.id, !m.pinned)}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      {replyTo && (
        <div className="classroom-chat__reply">
          Replying to {replyTo.userName}
          <button type="button" onClick={() => setReplyTo(null)}>
            ×
          </button>
        </div>
      )}
      <div className="classroom-chat__input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Message… 😊"
          maxLength={2000}
        />
        <button type="button" onClick={send} disabled={sending || !text.trim()} aria-label="Send">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

function ChatRow({
  message,
  canModerate,
  onReply,
  onPin,
}: {
  message: ClassroomChatMessage
  canModerate: boolean
  onReply: () => void
  onPin: () => void
}) {
  return (
    <div className={`classroom-chat__row${message.pinned ? ' classroom-chat__row--pinned' : ''}`}>
      <div className="classroom-chat__meta">
        <strong>{message.userName}</strong>
        <span className="classroom-chat__role">{message.role}</span>
        <span className="classroom-chat__time">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <button type="button" className="classroom-chat__action" onClick={onReply} aria-label="Reply">
          <Reply size={12} />
        </button>
        {canModerate && (
          <button type="button" className="classroom-chat__action" onClick={onPin} aria-label="Pin">
            <Pin size={12} />
          </button>
        )}
      </div>
      <p>{message.message}</p>
    </div>
  )
}
