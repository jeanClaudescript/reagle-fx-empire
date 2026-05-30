export type JitsiTeachingMode = 'webcam' | 'screenshare'

export type JitsiConferenceState = 'idle' | 'loading' | 'joined' | 'left' | 'error'

/** Minimal surface of JitsiMeetExternalAPI used by this app */
export type JitsiMeetExternalAPIInstance = {
  dispose: () => void
  executeCommand: (command: string, ...args: unknown[]) => void
  addListener: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void
}

export type JitsiMeetExternalAPIConstructor = new (
  domain: string,
  options: Record<string, unknown>,
) => JitsiMeetExternalAPIInstance

declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiMeetExternalAPIConstructor
  }
}
