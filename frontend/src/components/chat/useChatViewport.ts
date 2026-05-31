import { useCallback, useEffect, type RefObject } from 'react'

function isMobileChat() {
  return window.matchMedia('(max-width: 640px)').matches
}

/** Keeps composer visible when the mobile keyboard opens (Visual Viewport API). */
export function useChatViewport(containerRef: RefObject<HTMLElement | null>) {
  const applyViewport = useCallback(() => {
    const el = containerRef.current
    const vv = window.visualViewport
    if (!el || !vv) return

    const keyboardGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
    const keyboardOpen = keyboardGap > 50

    el.style.setProperty('--chat-keyboard-gap', `${keyboardGap}px`)
    el.classList.toggle('messenger-chat--keyboard', keyboardOpen)

    if (keyboardOpen && isMobileChat()) {
      const rect = el.getBoundingClientRect()
      const topInViewport = rect.top - vv.offsetTop
      const available = vv.height - Math.max(0, topInViewport)
      el.style.setProperty('--chat-fit-height', `${Math.max(180, available)}px`)
    } else {
      el.style.removeProperty('--chat-fit-height')
    }
  }, [containerRef])

  useEffect(() => {
    const el = containerRef.current
    const vv = window.visualViewport
    if (!el || !vv) return

    applyViewport()
    vv.addEventListener('resize', applyViewport)
    vv.addEventListener('scroll', applyViewport)
    window.addEventListener('orientationchange', applyViewport)

    return () => {
      vv.removeEventListener('resize', applyViewport)
      vv.removeEventListener('scroll', applyViewport)
      window.removeEventListener('orientationchange', applyViewport)
      el.style.removeProperty('--chat-keyboard-gap')
      el.style.removeProperty('--chat-fit-height')
      el.classList.remove('messenger-chat--keyboard')
    }
  }, [containerRef, applyViewport])

  return applyViewport
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
  const mobile = isMobileChat()
  const behavior =
    mobile || !smooth || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  node.scrollTo({ top: node.scrollHeight, behavior })
}
