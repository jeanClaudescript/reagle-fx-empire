import { useState } from 'react'
import { Loader2, Maximize2, Minimize2, Monitor, Video } from 'lucide-react'
import type { JitsiTeachingMode } from './types'
import { useJitsiTeachingConference } from './useJitsiTeachingConference'

type Props = {
  roomName: string
  sessionTitle?: string
  mode: JitsiTeachingMode
  displayName?: string
  isModerator?: boolean
  onModeChange?: (mode: JitsiTeachingMode) => void
  showModeToggle?: boolean
}

/**
 * Production Jitsi layer using External API (not raw iframe).
 * Isolated from WebSocket chart + WebRTC voice modules.
 */
export function JitsiTeachingEmbed({
  roomName,
  sessionTitle,
  mode,
  displayName,
  isModerator = false,
  onModeChange,
  showModeToggle = false,
}: Props) {
  const [fullscreen, setFullscreen] = useState(false)

  const { containerRef, state, error } = useJitsiTeachingConference({
    roomName,
    displayName,
    isModerator,
    mode,
    enabled: Boolean(roomName),
  })

  return (
    <div className={`jitsi-teaching${fullscreen ? ' jitsi-teaching--fullscreen' : ''}`}>
      <div className="jitsi-teaching__bar">
        <div>
          <p className="jitsi-teaching__label">Live class</p>
          <p className="jitsi-teaching__title">{sessionTitle || roomName}</p>
          <p className="jitsi-teaching__status">
            {state === 'loading' && 'Connecting…'}
            {state === 'joined' && 'In session'}
            {state === 'left' && 'Session ended'}
            {state === 'error' && (error ?? 'Connection error')}
            {state === 'idle' && 'Standby'}
          </p>
        </div>
        <div className="jitsi-teaching__actions">
          {showModeToggle && onModeChange ? (
            <>
              <button
                type="button"
                className={`jitsi-teaching__mode${mode === 'webcam' ? ' jitsi-teaching__mode--active' : ''}`}
                onClick={() => onModeChange('webcam')}
                title="Webcam mode"
                aria-pressed={mode === 'webcam'}
              >
                <Video size={14} aria-hidden />
                <span className="jitsi-teaching__mode-label">Webcam</span>
              </button>
              <button
                type="button"
                className={`jitsi-teaching__mode${mode === 'screenshare' ? ' jitsi-teaching__mode--active' : ''}`}
                onClick={() => onModeChange('screenshare')}
                title="Screen share focus"
                aria-pressed={mode === 'screenshare'}
              >
                <Monitor size={14} aria-hidden />
                <span className="jitsi-teaching__mode-label">Screen</span>
              </button>
            </>
          ) : null}
          <button
            type="button"
            className="jitsi-teaching__fullscreen"
            onClick={() => setFullscreen((v) => !v)}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="jitsi-teaching__stage">
        {state === 'loading' ? (
          <div className="jitsi-teaching__loading">
            <Loader2 className="animate-spin" size={28} />
            <p>Joining live class…</p>
          </div>
        ) : null}
        {state === 'error' ? (
          <div className="jitsi-teaching__error">
            <p>{error ?? 'Could not connect to Jitsi'}</p>
          </div>
        ) : null}
        <div ref={containerRef} className="jitsi-teaching__api-host" aria-label="Jitsi live classroom" />
      </div>
    </div>
  )
}
