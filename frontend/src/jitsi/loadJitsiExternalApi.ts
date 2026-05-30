import type { JitsiMeetExternalAPIConstructor } from './types'

const loadedDomains = new Set<string>()

export function getJitsiDomain() {
  return (import.meta.env.VITE_JITSI_DOMAIN as string | undefined)?.trim() || 'meet.jit.si'
}

/**
 * Loads Jitsi External API script once per domain.
 * https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe
 */
export function loadJitsiExternalApi(domain = getJitsiDomain()): Promise<JitsiMeetExternalAPIConstructor> {
  if (window.JitsiMeetExternalAPI) {
    return Promise.resolve(window.JitsiMeetExternalAPI)
  }

  if (loadedDomains.has(domain)) {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + 15000
      const tick = () => {
        if (window.JitsiMeetExternalAPI) {
          resolve(window.JitsiMeetExternalAPI)
          return
        }
        if (Date.now() > deadline) {
          reject(new Error('Jitsi External API load timeout'))
          return
        }
        window.setTimeout(tick, 100)
      }
      tick()
    })
  }

  loadedDomains.add(domain)

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://${domain}/external_api.js`
    script.async = true
    script.onload = () => {
      if (window.JitsiMeetExternalAPI) {
        resolve(window.JitsiMeetExternalAPI)
        return
      }
      reject(new Error('Jitsi External API unavailable after script load'))
    }
    script.onerror = () => reject(new Error('Failed to load Jitsi External API'))
    document.head.appendChild(script)
  })
}
