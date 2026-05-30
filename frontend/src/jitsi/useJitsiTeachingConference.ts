import { useEffect, useRef, useState } from 'react'
import { buildJitsiApiOptions } from './buildJitsiConfig'
import { getJitsiDomain, loadJitsiExternalApi } from './loadJitsiExternalApi'
import type { JitsiConferenceState, JitsiMeetExternalAPIInstance, JitsiTeachingMode } from './types'

type Options = {
  roomName: string
  displayName?: string
  isModerator?: boolean
  mode: JitsiTeachingMode
  enabled: boolean
}

export function useJitsiTeachingConference({
  roomName,
  displayName,
  isModerator = false,
  mode,
  enabled,
}: Options) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<JitsiMeetExternalAPIInstance | null>(null)
  const modeRef = useRef(mode)
  const [state, setState] = useState<JitsiConferenceState>('idle')
  const [error, setError] = useState<string | null>(null)

  // Mount / remount only when room or identity changes — NOT on mode (avoids disconnecting chart socket)
  useEffect(() => {
    if (!enabled || !roomName || !containerRef.current) {
      setState('idle')
      return
    }

    let cancelled = false
    const parentNode = containerRef.current
    setState('loading')
    setError(null)

    const boot = async () => {
      try {
        const domain = getJitsiDomain()
        const JitsiMeetExternalAPI = await loadJitsiExternalApi(domain)
        if (cancelled) return

        apiRef.current?.dispose()
        parentNode.innerHTML = ''

        const options = buildJitsiApiOptions({
          roomName,
          displayName,
          isModerator,
          mode,
          parentNode,
        })

        const api = new JitsiMeetExternalAPI(domain, options)
        apiRef.current = api
        modeRef.current = mode

        api.addListener('videoConferenceJoined', () => {
          if (!cancelled) setState('joined')
          // Fallback if startScreenSharing config did not trigger on first join
          if (mode === 'screenshare' && isModerator) {
            window.setTimeout(() => api.executeCommand('toggleShareScreen'), 400)
          }
        })
        api.addListener('videoConferenceLeft', () => {
          if (!cancelled) setState('left')
        })
        api.addListener('readyToClose', () => {
          api.dispose()
          apiRef.current = null
          if (!cancelled) setState('left')
        })
      } catch (e) {
        if (!cancelled) {
          setState('error')
          setError(e instanceof Error ? e.message : 'Jitsi failed to start')
        }
      }
    }

    void boot()

    return () => {
      cancelled = true
      apiRef.current?.dispose()
      apiRef.current = null
      if (parentNode) parentNode.innerHTML = ''
      setState('idle')
    }
  }, [enabled, roomName, displayName, isModerator])

  // Mode switch via API commands — no iframe remount, WebSocket chart stays connected
  useEffect(() => {
    const api = apiRef.current
    if (!api || !isModerator || mode === modeRef.current) return

    if (mode === 'screenshare') {
      api.executeCommand('toggleShareScreen')
    }
    modeRef.current = mode
  }, [mode, isModerator])

  return { containerRef, state, error }
}
