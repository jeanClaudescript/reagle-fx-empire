import { useEffect, useRef, useState } from 'react'
import { Image, Mic, Paperclip, Plus, Send, Smile, Video, X } from 'lucide-react'
import { useVoiceRecorder } from './useVoiceRecorder'
import { VoiceRecordingBar } from './MessengerBubble'
import { useClickOutside } from './useChatViewport'

const QUICK_EMOJIS = ['😊', '👍', '🔥', '💯', '🙏', '📈', '💪', '🎯', '✅', '❤️', '😂', '🚀']

export type ChatSendPayload = {
  message?: string
  messageType?: 'text' | 'image' | 'video' | 'voice' | 'file'
  attachments?: {
    url: string
    type: 'image' | 'video' | 'voice' | 'file'
    mimeType?: string
    fileName?: string
    durationSec?: number
  }[]
}

type Props = {
  placeholder: string
  disabled?: boolean
  sending?: boolean
  onSend: (payload: ChatSendPayload) => Promise<void>
  onUpload: (file: File) => Promise<{ url: string; type: 'image' | 'video' | 'voice' | 'file'; mimeType?: string; fileName?: string }>
  onTyping?: (typing: boolean) => void
  onFocus?: () => void
  onSent?: () => void
  sendLabel?: string
}

function resizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`
}

export function MessengerComposer({
  placeholder,
  disabled,
  sending,
  onSend,
  onUpload,
  onTyping,
  onFocus,
  onSent,
  sendLabel = 'Send message',
}: Props) {
  const [text, setText] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [attachOpen, setAttachOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const attachRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const typingTimer = useRef<number | null>(null)
  const voice = useVoiceRecorder()

  useClickOutside(emojiRef, () => setEmojiOpen(false), emojiOpen)
  useClickOutside(attachRef, () => setAttachOpen(false), attachOpen)

  useEffect(() => {
    return () => {
      if (typingTimer.current) window.clearTimeout(typingTimer.current)
      onTyping?.(false)
    }
  }, [onTyping])

  useEffect(() => {
    resizeTextarea(inputRef.current)
  }, [text])

  const notifyTyping = (value: string) => {
    if (!onTyping) return
    onTyping(value.length > 0)
    if (typingTimer.current) window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => onTyping(false), 2500)
  }

  const refocusInput = () => {
    window.requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      try {
        el.focus({ preventScroll: true })
      } catch {
        el.focus()
      }
      resizeTextarea(el)
    })
  }

  const submit = async (payload: ChatSendPayload) => {
    if (disabled || busy) return
    setBusy(true)
    setError(null)
    try {
      await onSend(payload)
      setText('')
      setEmojiOpen(false)
      setAttachOpen(false)
      onTyping?.(false)
      if (inputRef.current) inputRef.current.style.height = 'auto'
      onSent?.()
      refocusInput()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send — try again')
    } finally {
      setBusy(false)
    }
  }

  const sendText = async () => {
    const msg = text.trim()
    if (!msg || sending || disabled || busy) return
    await submit({ message: msg, messageType: 'text' })
  }

  const uploadFile = async (file: File) => {
    setAttachOpen(false)
    setUploading(true)
    setError(null)
    try {
      const att = await onUpload(file)
      await submit({
        message: att.type === 'image' ? '' : file.name,
        messageType: att.type,
        attachments: [{ ...att }],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed — try again')
    } finally {
      setUploading(false)
    }
  }

  const startVoice = async () => {
    try {
      await voice.start()
    } catch {
      /* mic denied */
    }
  }

  const sendVoice = async () => {
    setError(null)
    setUploading(true)
    try {
      const { blob, durationSec, ext, mimeType } = await voice.finish()
      const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType || blob.type || 'audio/webm' })
      const att = await onUpload(file)
      await submit({
        messageType: 'voice',
        attachments: [{ ...att, type: 'voice', durationSec }],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voice message failed — try again')
    } finally {
      setUploading(false)
    }
  }

  const isDisabled = disabled || uploading || busy

  if (voice.recording) {
    return <VoiceRecordingBar duration={voice.duration} onCancel={voice.cancel} onSend={() => void sendVoice()} />
  }

  return (
    <div className="messenger-composer" ref={attachRef}>
      {emojiOpen ? (
        <div className="messenger-composer__emoji" ref={emojiRef} role="toolbar" aria-label="Emoji picker">
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className="messenger-composer__emoji-btn"
              onClick={() => {
                setText((t) => t + e)
                refocusInput()
              }}
            >
              {e}
            </button>
          ))}
          <button type="button" className="messenger-composer__emoji-close" onClick={() => setEmojiOpen(false)} aria-label="Close emoji">
            <X size={14} />
          </button>
        </div>
      ) : null}

      {attachOpen ? (
        <div className="messenger-composer__attach-sheet" role="menu" aria-label="Attach">
          <button type="button" role="menuitem" onClick={() => imageRef.current?.click()}>
            <Image size={18} /> Photo
          </button>
          <button type="button" role="menuitem" onClick={() => videoRef.current?.click()}>
            <Video size={18} /> Video
          </button>
          <button type="button" role="menuitem" onClick={() => fileRef.current?.click()}>
            <Paperclip size={18} /> File
          </button>
        </div>
      ) : null}

      <div className="messenger-composer__bar">
        <button
          type="button"
          className="messenger-composer__icon"
          onClick={() => {
            setAttachOpen(false)
            setEmojiOpen((v) => !v)
          }}
          aria-label="Emoji"
          aria-expanded={emojiOpen}
          disabled={isDisabled}
        >
          <Smile size={20} />
        </button>

        <button
          type="button"
          className="messenger-composer__icon messenger-composer__icon--desktop"
          onClick={() => imageRef.current?.click()}
          aria-label="Photo"
          disabled={isDisabled}
        >
          <Image size={20} />
        </button>
        <button
          type="button"
          className="messenger-composer__icon messenger-composer__icon--desktop"
          onClick={() => videoRef.current?.click()}
          aria-label="Video"
          disabled={isDisabled}
        >
          <Video size={20} />
        </button>
        <button
          type="button"
          className="messenger-composer__icon messenger-composer__icon--desktop"
          onClick={() => fileRef.current?.click()}
          aria-label="File"
          disabled={isDisabled}
        >
          <Paperclip size={20} />
        </button>

        <button
          type="button"
          className="messenger-composer__icon messenger-composer__icon--mobile-more"
          onClick={() => {
            setEmojiOpen(false)
            setAttachOpen((v) => !v)
          }}
          aria-label="Attach"
          aria-expanded={attachOpen}
          disabled={isDisabled}
        >
          <Plus size={20} />
        </button>

        <textarea
          ref={inputRef}
          className="messenger-composer__input"
          rows={1}
          value={text}
          disabled={isDisabled}
          placeholder={placeholder}
          maxLength={2000}
          enterKeyHint="send"
          inputMode="text"
          autoComplete="off"
          autoCorrect="on"
          spellCheck
          aria-label={placeholder}
          onFocus={() => {
            onFocus?.()
          }}
          onChange={(e) => {
            setText(e.target.value)
            notifyTyping(e.target.value)
            resizeTextarea(e.target)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void sendText()
            }
            if (e.key === 'Escape') {
              setEmojiOpen(false)
              setAttachOpen(false)
            }
          }}
        />

        {text.trim() ? (
          <button
            type="button"
            className="messenger-composer__send"
            disabled={sending || isDisabled}
            onClick={() => void sendText()}
            aria-label={sendLabel}
          >
            <Send size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="messenger-composer__send messenger-composer__send--mic"
            disabled={isDisabled}
            onClick={() => void startVoice()}
            aria-label="Voice message"
          >
            <Mic size={18} />
          </button>
        )}
      </div>

      {uploading ? <p className="messenger-composer__status" aria-live="polite">Uploading…</p> : null}
      {error ? (
        <p className="messenger-composer__status messenger-composer__status--error" role="alert">
          {error}
        </p>
      ) : null}

      <input ref={imageRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void uploadFile(f) }} />
      <input ref={videoRef} type="file" accept="video/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void uploadFile(f) }} />
      <input ref={fileRef} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void uploadFile(f) }} />
    </div>
  )
}
