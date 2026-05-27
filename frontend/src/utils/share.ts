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
    x: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`,
  }
}

export async function tryNativeShare(payload: SharePayload) {
  if (!('share' in navigator)) return false
  try {
    await navigator.share({ url: payload.url, text: payload.text })
    return true
  } catch {
    return false
  }
}

export async function copyShareLink(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}

