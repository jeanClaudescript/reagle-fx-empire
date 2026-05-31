import { useEffect, type RefObject } from 'react'

/** Keeps composer visible when the mobile keyboard opens (Visual Viewport API). */
export function useChatViewport(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = containerRef.current
    const vv = window.visualViewport
    if (!el || !vv) return

    const apply = () => {
      const keyboardGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      el.style.setProperty('--chat-keyboard-gap', `${keyboardGap}px`)
      el.classList.toggle('messenger-chat--keyboard', keyboardGap > 80)
    }

    apply()
    vv.addEventListener('resize', apply)
    vv.addEventListener('scroll', apply)
    return () => {
      vv.removeEventListener('resize', apply)
      vv.removeEventListener('scroll', apply)
      el.style.removeProperty('--chat-keyboard-gap')
      el.classList.remove('messenger-chat--keyboard')
    }
  }, [containerRef])
}

export function useClickOutside(ref: RefObject<HTMLElement | null>, onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, onClose, active])
}

export function scrollChatToBottom(node: HTMLElement | null, smooth = true) {
  if (!node) return
  node.scrollTo({ top: node.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
}
