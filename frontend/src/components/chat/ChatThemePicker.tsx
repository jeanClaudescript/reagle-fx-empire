import { useEffect, useRef, useState } from 'react'
import { Palette } from 'lucide-react'
import { CHAT_THEMES, getChatTheme, setChatTheme, type ChatThemeId } from './chatTheme'
import { useClickOutside } from './useChatViewport'

export function ChatThemePicker() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [themeId, setThemeId] = useState<ChatThemeId>(() => getChatTheme().id)

  useClickOutside(rootRef, () => setOpen(false), open)

  useEffect(() => {
    const onTheme = () => setThemeId(getChatTheme().id)
    window.addEventListener('rfx-chat-theme', onTheme)
    return () => window.removeEventListener('rfx-chat-theme', onTheme)
  }, [])

  const pick = (id: ChatThemeId) => {
    setChatTheme(id)
    setThemeId(id)
    window.dispatchEvent(new Event('rfx-chat-theme'))
    setOpen(false)
  }

  return (
    <div className="messenger-theme-picker" ref={rootRef}>
      <button
        type="button"
        className="messenger-theme-picker__btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat colors"
        aria-expanded={open}
        title="Chat colors"
      >
        <Palette size={16} />
      </button>
      {open ? (
        <div className="messenger-theme-picker__menu" role="menu">
          {CHAT_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitem"
              className={`messenger-theme-picker__opt ${themeId === t.id ? 'messenger-theme-picker__opt--active' : ''}`}
              onClick={() => pick(t.id)}
            >
              <span className="messenger-theme-picker__swatch" style={{ background: t.accent }} />
              {t.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
