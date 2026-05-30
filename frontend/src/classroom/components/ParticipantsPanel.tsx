import { Mic, MicOff, Volume2 } from 'lucide-react'
import { useClassroomStore } from '../store/useClassroomStore'
import { emitAudioGrant } from '../socket/classroomSocket'

type Props = {
  micOn: boolean
  listening: boolean
  onToggleMic: () => void
  onToggleListen: () => void
  hideWebRtcAudio?: boolean
}

export function ParticipantsPanel({ micOn, listening, onToggleMic, onToggleListen, hideWebRtcAudio = false }: Props) {
  const participants = useClassroomStore((s) => s.participants)
  const role = useClassroomStore((s) => s.role)
  const connected = useClassroomStore((s) => s.connected)

  const isTeacher = role === 'teacher'

  return (
    <div className="classroom-participants">
      <div className="classroom-participants__header">
        <span>Participants ({participants.length})</span>
        <span className={`classroom-participants__status${connected ? ' classroom-participants__status--on' : ''}`}>
          {connected ? 'Connected' : 'Reconnecting…'}
        </span>
      </div>

      <div className="classroom-participants__audio">
        {hideWebRtcAudio ? (
          <p className="text-xs text-theme-muted px-1">
            Audio/video via Jitsi live class — chart sync uses the existing trading engine.
          </p>
        ) : isTeacher ? (
          <button type="button" className="classroom-btn" onClick={onToggleMic}>
            {micOn ? <Mic size={16} /> : <MicOff size={16} />}
            {micOn ? 'Mic on' : 'Mic off'}
          </button>
        ) : (
          <button type="button" className="classroom-btn" onClick={onToggleListen}>
            <Volume2 size={16} />
            {listening ? 'Listening' : 'Muted'}
          </button>
        )}
      </div>

      <ul className="classroom-participants__list">
        {participants.map((p) => (
          <li key={p.id} className="classroom-participants__item">
            <div>
              <strong>{p.userName}</strong>
              <span className="classroom-participants__role">{p.role}</span>
              {p.canSpeak && <span className="classroom-participants__speak">🎤</span>}
            </div>
            {isTeacher && p.role === 'student' && (
              <button
                type="button"
                className="classroom-btn classroom-btn--sm"
                onClick={() => emitAudioGrant(p.userId, !p.canSpeak)}
              >
                {p.canSpeak ? 'Revoke' : 'Allow speak'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
