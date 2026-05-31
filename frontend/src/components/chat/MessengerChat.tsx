import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { DeskChatMessage } from '@/realtime/appSocket'
import { chatThemeVars, getChatTheme } from './chatTheme'
import { ChatThemePicker } from './ChatThemePicker'
import { MessengerBubble, MessengerDateSeparator, MessengerTypingBar } from './MessengerBubble'
import { MessengerComposer, type ChatSendPayload } from './MessengerComposer'
import { scrollChatToBottom, useChatViewport } from './useChatViewport'

function mergeMessage(list: DeskChatMessage[], msg: DeskChatMessage) {
  if (list.some((m) => m.id === msg.id)) return list
  return [...list, msg].slice(-200)
}

function dateLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

type Props = {
  title: string
  subtitle?: string
  emptyLabel: string
  placeholder: string
  loading?: boolean
  messages: DeskChatMessage[]
  mineRole: 'student' | 'admin'
  groupChat?: boolean
  showReadReceipts?: boolean
  typingNames?: string[]
  disabled?: boolean
  onSend: (payload: ChatSendPayload) => Promise<void>
  onUpload: (file: File) => Promise<{ url: string; type: 'image' | 'video' | 'voice' | 'file'; mimeType?: string; fileName?: string }>
  onTyping?: (typing: boolean) => void
}

export function MessengerChat({
  title,
  subtitle,
  emptyLabel,
  placeholder,
  loading,
  messages,
  mineRole,
  groupChat,
  showReadReceipts,
  typingNames = [],
  disabled,
  onSend,
  onUpload,
  onTyping,
}: Props) {
  const chatRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState(getChatTheme)

  const syncViewport = useChatViewport(chatRef)

  useEffect(() => {
    const onTheme = () => setTheme(getChatTheme())
    window.addEventListener('rfx-chat-theme', onTheme)
    return () => window.removeEventListener('rfx-chat-theme', onTheme)
  }, [])

  const scrollMessages = (smooth = false) => {
    scrollChatToBottom(bodyRef.current, smooth)
  }

  useEffect(() => {
    scrollMessages(false)
  }, [messages.length, typingNames.length])

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const ro = new ResizeObserver(() => scrollMessages(false))
    ro.observe(body)
    return () => ro.disconnect()
  }, [])

  const handleComposerFocus = () => {
    syncViewport()
    scrollMessages(false)
  }

  const handleSent = () => {
    syncViewport()
    window.requestAnimationFrame(() => scrollMessages(false))
  }

  const rows = useMemo(() => {
    const out: { kind: 'date' | 'msg'; key: string; label?: string; message?: DeskChatMessage }[] = []
    let lastDate = ''
    for (const m of messages) {
      const dl = dateLabel(m.createdAt)
      if (dl !== lastDate) {
        out.push({ kind: 'date', key: `d-${dl}-${m.id}`, label: dl })
        lastDate = dl
      }
      out.push({ kind: 'msg', key: m.id, message: m })
    }
    return out
  }, [messages])

  return (
    <div ref={chatRef} className="messenger-chat" style={chatThemeVars(theme) as CSSProperties}>
      <header className="messenger-chat__header">
        <div className="messenger-chat__header-text">
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <ChatThemePicker />
      </header>

      <div
        ref={bodyRef}
        className="messenger-chat__body"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={`${title} messages`}
      >
        {loading ? (
          <p className="messenger-chat__empty">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="messenger-chat__empty">{emptyLabel}</p>
        ) : (
          rows.map((row) =>
            row.kind === 'date' ? (
              <MessengerDateSeparator key={row.key} label={row.label!} />
            ) : (
              <MessengerBubble
                key={row.key}
                message={row.message!}
                isMine={row.message!.fromRole === mineRole}
                showAvatar={groupChat}
                showName={groupChat && row.message!.fromRole !== mineRole}
                showRead={showReadReceipts}
              />
            ),
          )
        )}
        <MessengerTypingBar names={typingNames} />
        <div ref={bottomRef} className="messenger-chat__anchor" aria-hidden />
      </div>

      <MessengerComposer
        placeholder={placeholder}
        disabled={disabled}
        onSend={onSend}
        onUpload={onUpload}
        onTyping={onTyping}
        onFocus={handleComposerFocus}
        onSent={handleSent}
      />
    </div>
  )
}

export { mergeMessage }
