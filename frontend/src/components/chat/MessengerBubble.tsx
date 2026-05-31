import { Check, CheckCheck, Mic, Pause, Play } from 'lucide-react'
import type { DeskChatMessage } from '@/realtime/appSocket'
import { avatarColor, initials } from './chatTheme'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(sec?: number) {
  if (!sec) return '0:00'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function MediaContent({ message }: { message: DeskChatMessage }) {
  const att = message.attachments?.[0]
  if (!att) return null

  if (att.type === 'image' || message.messageType === 'image') {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="messenger-bubble__media-link">
        <img src={att.url} alt={att.fileName ?? 'Image'} className="messenger-bubble__image" loading="lazy" />
      </a>
    )
  }

  if (att.type === 'video' || message.messageType === 'video') {
    return (
      <video src={att.url} controls className="messenger-bubble__video" preload="metadata">
        <track kind="captions" />
      </video>
    )
  }

  if (att.type === 'voice' || message.messageType === 'voice') {
    return (
      <div className="messenger-bubble__voice">
        <Mic size={14} />
        <audio src={att.url} controls className="messenger-bubble__audio" preload="metadata" />
        <span className="messenger-bubble__voice-dur">{formatDuration(att.durationSec)}</span>
      </div>
    )
  }

  return (
    <a href={att.url} target="_blank" rel="noopener noreferrer" className="messenger-bubble__file">
      📎 {att.fileName ?? 'Download file'}
    </a>
  )
}

export function MessengerBubble({
  message,
  isMine,
  showAvatar,
  showName,
  showRead,
}: {
  message: DeskChatMessage
  isMine: boolean
  showAvatar?: boolean
  showName?: boolean
  showRead?: boolean
}) {
  const read = isMine && message.readAt

  return (
    <div className={`messenger-row ${isMine ? 'messenger-row--mine' : 'messenger-row--theirs'}`}>
      {!isMine && showAvatar ? (
        <div className="messenger-avatar" style={{ backgroundColor: avatarColor(message.fromUserName) }}>
          {initials(message.fromUserName)}
        </div>
      ) : (
        !isMine && showAvatar !== false ? <div className="messenger-avatar messenger-avatar--spacer" /> : null
      )}

      <div className="messenger-bubble-wrap">
        {!isMine && showName ? (
          <span className="messenger-bubble__name">{message.fromUserName}</span>
        ) : null}
        {message.replyTo ? (
          <div className="messenger-bubble__quote">
            <strong>{message.replyTo.fromUserName}</strong>
            <span>{message.replyTo.preview}</span>
          </div>
        ) : null}
        <div className={`messenger-bubble ${isMine ? 'messenger-bubble--mine' : 'messenger-bubble--theirs'}`}>
          {message.attachments?.length ? <MediaContent message={message} /> : null}
          {message.message ? <p className="messenger-bubble__text">{message.message}</p> : null}
          <div className="messenger-bubble__footer">
            <span>{formatTime(message.createdAt)}</span>
            {isMine && showRead ? (
              <span className="messenger-bubble__status" title={read ? 'Seen' : 'Sent'}>
                {read ? <CheckCheck size={12} className="messenger-bubble__seen" /> : <Check size={12} />}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MessengerTypingBar({ names }: { names: string[] }) {
  if (!names.length) return null
  const label =
    names.length === 1 ? `${names[0]} is typing…` : `${names.slice(0, 2).join(', ')} are typing…`
  return (
    <div className="messenger-typing">
      <span className="messenger-typing__dots">
        <i />
        <i />
        <i />
      </span>
      {label}
    </div>
  )
}

export function MessengerDateSeparator({ label }: { label: string }) {
  return <div className="messenger-date">{label}</div>
}

export function VoiceRecordingBar({
  duration,
  onCancel,
  onSend,
}: {
  duration: number
  onCancel: () => void
  onSend: () => void
}) {
  return (
    <div className="messenger-recording">
      <span className="messenger-recording__pulse" />
      <Mic size={16} />
      <span>
        {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
      </span>
      <button type="button" onClick={onCancel} aria-label="Cancel">
        <Pause size={16} />
      </button>
      <button type="button" className="messenger-recording__send" onClick={onSend} aria-label="Send voice">
        <Play size={16} />
      </button>
    </div>
  )
}
