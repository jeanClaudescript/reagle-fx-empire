export type ChatThemeId = 'meta-blue' | 'meta-purple' | 'meta-emerald' | 'meta-rose' | 'meta-dark'

export type ChatTheme = {
  id: ChatThemeId
  label: string
  mine: string
  mineText: string
  theirs: string
  theirsText: string
  accent: string
  header: string
  inputBg: string
}

export const CHAT_THEMES: ChatTheme[] = [
  {
    id: 'meta-blue',
    label: 'Messenger blue',
    mine: 'linear-gradient(135deg, #0084ff 0%, #0066cc 100%)',
    mineText: '#ffffff',
    theirs: '#e4e6eb',
    theirsText: '#050505',
    accent: '#0084ff',
    header: 'linear-gradient(135deg, #0084ff 0%, #00c6ff 100%)',
    inputBg: '#f0f2f5',
  },
  {
    id: 'meta-purple',
    label: 'Royal purple',
    mine: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    mineText: '#ffffff',
    theirs: '#ede9fe',
    theirsText: '#1e1b4b',
    accent: '#7c3aed',
    header: 'linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)',
    inputBg: '#f5f3ff',
  },
  {
    id: 'meta-emerald',
    label: 'Fresh green',
    mine: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    mineText: '#ffffff',
    theirs: '#d1fae5',
    theirsText: '#064e3b',
    accent: '#059669',
    header: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
    inputBg: '#ecfdf5',
  },
  {
    id: 'meta-rose',
    label: 'Warm rose',
    mine: 'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)',
    mineText: '#ffffff',
    theirs: '#ffe4e6',
    theirsText: '#881337',
    accent: '#e11d48',
    header: 'linear-gradient(135deg, #be123c 0%, #fb7185 100%)',
    inputBg: '#fff1f2',
  },
  {
    id: 'meta-dark',
    label: 'Dark mode',
    mine: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    mineText: '#ffffff',
    theirs: '#3a3b3c',
    theirsText: '#e4e6eb',
    accent: '#0084ff',
    header: 'linear-gradient(135deg, #1c1e21 0%, #242526 100%)',
    inputBg: '#3a3b3c',
  },
]

const STORAGE_KEY = 'rfx_chat_theme_v1'

export function getChatTheme(): ChatTheme {
  try {
    const id = localStorage.getItem(STORAGE_KEY) as ChatThemeId | null
    return CHAT_THEMES.find((t) => t.id === id) ?? CHAT_THEMES[0]
  } catch {
    return CHAT_THEMES[0]
  }
}

export function setChatTheme(id: ChatThemeId) {
  localStorage.setItem(STORAGE_KEY, id)
}

export function chatThemeVars(theme: ChatTheme): Record<string, string> {
  return {
    '--messenger-mine': theme.mine,
    '--messenger-mine-text': theme.mineText,
    '--messenger-theirs': theme.theirs,
    '--messenger-theirs-text': theme.theirsText,
    '--messenger-accent': theme.accent,
    '--messenger-header': theme.header,
    '--messenger-input-bg': theme.inputBg,
  }
}

export function avatarColor(name: string) {
  const colors = ['#0084ff', '#7c3aed', '#059669', '#e11d48', '#f59e0b', '#06b6d4']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?'
}
