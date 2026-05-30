import type { JitsiTeachingMode } from './types'

export function sanitizeJitsiRoomName(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .slice(0, 80)
  return cleaned || `reagle-${Date.now()}`
}

export function buildJitsiApiOptions(input: {
  roomName: string
  displayName?: string
  isModerator?: boolean
  mode?: JitsiTeachingMode
  parentNode: HTMLElement
}) {
  const roomName = sanitizeJitsiRoomName(input.roomName)
  const mode = input.mode ?? 'webcam'

  return {
    roomName,
    width: '100%',
    height: '100%',
    parentNode: input.parentNode,
    userInfo: input.displayName ? { displayName: input.displayName } : undefined,
    configOverwrite: {
      prejoinPageEnabled: false,
      disableDeepLinking: true,
      enableWelcomePage: false,
      startWithAudioMuted: !input.isModerator,
      startWithVideoMuted: mode === 'screenshare' && input.isModerator,
      enableClosePage: false,
      disableInviteFunctions: true,
      hideConferenceSubject: false,
      subject: input.displayName ? undefined : roomName,
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      MOBILE_APP_PROMO: false,
      DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
      TOOLBAR_BUTTONS: input.isModerator
        ? [
            'microphone',
            'camera',
            'desktop',
            'fullscreen',
            'hangup',
            'tileview',
            'settings',
          ]
        : ['microphone', 'camera', 'fullscreen', 'hangup', 'tileview'],
    },
  }
}

/** @deprecated iframe URL — use External API instead */
export function buildJitsiEmbedUrl(
  roomName: string,
  options: { mode?: JitsiTeachingMode; displayName?: string; isModerator?: boolean } = {},
) {
  const domain = (import.meta.env.VITE_JITSI_DOMAIN as string | undefined)?.trim() || 'meet.jit.si'
  const room = sanitizeJitsiRoomName(roomName)
  const hashParts = ['config.prejoinPageEnabled=false', 'config.disableDeepLinking=true']
  if (options.displayName) {
    hashParts.push(`userInfo.displayName="${encodeURIComponent(options.displayName)}"`)
  }
  if (options.mode === 'screenshare') {
    hashParts.push('config.startScreenSharing=true')
  }
  return `https://${domain}/${room}#${hashParts.join('&')}`
}
