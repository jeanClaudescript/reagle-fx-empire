import { BRAND } from '@/constants/brand'

export interface SharePayload {
  url: string
  text?: string
}

export function buildShareLinks({ url, text }: SharePayload) {
  const shareUrl = encodeURIComponent(url)
  const shareText = encodeURIComponent(text ?? '')
  const message = encodeURIComponent(text ? `${text} ${url}` : url)

  return {
    whatsapp: `https://wa.me/?text=${message}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    instagram: BRAND.instagramLink,
    x: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`,
  }
}

export function buildShareClipboardText({ url, text }: SharePayload) {
  return text ? `${text}\n${url}` : url
}

export async function tryNativeShare(payload: SharePayload) {
  if (!('share' in navigator)) return false
  try {
    await navigator.share({ url: payload.url, text: payload.text, title: payload.text })
    return true
  } catch {
    return false
  }
}

export async function copyShareLink(url: string, text?: string) {
  try {
    await navigator.clipboard.writeText(buildShareClipboardText({ url, text }))
    return true
  } catch {
    return false
  }
}
