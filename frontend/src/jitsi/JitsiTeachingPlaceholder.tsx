import { Loader2 } from 'lucide-react'

/** Reserves Jitsi pane height so layout does not jump when the conference connects */
export function JitsiTeachingPlaceholder() {
  return (
    <div className="jitsi-teaching jitsi-teaching--placeholder">
      <div className="jitsi-teaching__bar">
        <div>
          <p className="jitsi-teaching__label">Live class</p>
          <p className="jitsi-teaching__title">Preparing video room…</p>
        </div>
      </div>
      <div className="jitsi-teaching__stage jitsi-teaching__stage--placeholder">
        <Loader2 className="animate-spin" size={28} />
        <p>Connecting to Jitsi…</p>
      </div>
    </div>
  )
}
