import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { getAdminAuthToken } from '@/admin/adminSession'
import { getStudentAuthToken } from '@/student/studentSession'
import { onClassroomUpdated } from '@/realtime/appSocket'
import { SharedChart } from './chart/SharedChart'
import { DrawingOverlay } from './drawing/DrawingOverlay'
import { DrawingToolbar } from './components/DrawingToolbar'
import { CursorLayer } from './components/CursorLayer'
import { ClassroomChat } from './components/ClassroomChat'
import { ParticipantsPanel } from './components/ParticipantsPanel'
import { useClassroomStore } from './store/useClassroomStore'
import {
  connectClassroomSocket,
  disconnectClassroomSocket,
  emitChartSymbol,
  emitChartTimeframe,
  emitJitsiMode,
  joinClassroomRoom,
  leaveClassroomRoom,
} from './socket/classroomSocket'
import { CLASSROOM_SYMBOLS, CLASSROOM_TIMEFRAMES } from './types'
import { useClassroomAudio } from './audio/useClassroomAudio'
import { LiveTeachingSplitLayout } from '@/jitsi/LiveTeachingSplitLayout'
import { JitsiTeachingEmbed } from '@/jitsi/JitsiTeachingEmbed'
import { JitsiTeachingPlaceholder } from '@/jitsi/JitsiTeachingPlaceholder'

type Props = {
  roomId: string
  mode: 'teacher' | 'student'
  embedded?: boolean
  onBack?: () => void
  onSessionEnded?: () => void
}

export function ClassroomRoomView({ roomId, mode, embedded = false, onBack, onSessionEnded }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(true)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [listening, setListening] = useState(true)

  const role = useClassroomStore((s) => s.role)
  const symbol = useClassroomStore((s) => s.symbol)
  const timeframe = useClassroomStore((s) => s.timeframe)
  const canSpeak = useClassroomStore((s) => s.canSpeak)
  const connected = useClassroomStore((s) => s.connected)
  const selfName = useClassroomStore((s) => s.selfName)
  const enableLiveTeaching = useClassroomStore((s) => s.enableLiveTeaching)
  const jitsiRoomName = useClassroomStore((s) => s.jitsiRoomName)
  const teachingSessionTitle = useClassroomStore((s) => s.teachingSessionTitle)
  const jitsiMode = useClassroomStore((s) => s.jitsiMode)
  const setJitsiMode = useClassroomStore((s) => s.setJitsiMode)
  const applyRoomSettings = useClassroomStore((s) => s.applyRoomSettings)

  const isController = role === 'teacher' || role === 'moderator'
  const hasJitsiLayer = enableLiveTeaching && Boolean(jitsiRoomName)
  const useJitsiForAv = hasJitsiLayer

  useClassroomAudio({
    micOn: !useJitsiForAv && mode === 'teacher' && micOn,
    canSpeak: !useJitsiForAv && canSpeak,
    listening: !useJitsiForAv && listening,
  })

  useEffect(() => {
    const token = mode === 'teacher' ? getAdminAuthToken() : getStudentAuthToken()
    if (!token) {
      setError(mode === 'teacher' ? 'Sign in as admin first' : 'Sign in to VIP desk first')
      setConnecting(false)
      return
    }

    setConnecting(true)
    setError(null)
    setSessionEnded(false)

    connectClassroomSocket(token, mode)
    joinClassroomRoom(roomId)
      .then(() => setConnecting(false))
      .catch((e: Error) => {
        setError(e.message)
        setConnecting(false)
      })

    return () => {
      leaveClassroomRoom()
      disconnectClassroomSocket()
    }
  }, [roomId, mode])

  useEffect(() => {
    return onClassroomUpdated((payload) => {
      const room = payload.data
      if (!room || room.id !== roomId) {
        if (room === null && !connecting) {
          setSessionEnded(true)
        }
        return
      }

      applyRoomSettings(room)

      if (room.status !== 'live') {
        setSessionEnded(true)
        onSessionEnded?.()
      }
    })
  }, [roomId, connecting, applyRoomSettings, onSessionEnded])

  const handleJitsiModeChange = (next: 'webcam' | 'screenshare') => {
    setJitsiMode(next)
    emitJitsiMode(next)
  }

  const handleSessionEndedBack = () => {
    leaveClassroomRoom()
    disconnectClassroomSocket()
    onBack?.()
  }

  const chartPane = (
    <>
      {isController && !connecting ? <DrawingToolbar /> : null}
      <div className="classroom-chart-wrap">
        {connecting ? <div className="classroom-chart-skeleton" aria-hidden /> : null}
        <SharedChart readOnly={!isController || connecting} />
        <DrawingOverlay readOnly={!isController || connecting} />
        {!connecting ? <CursorLayer /> : null}
      </div>
    </>
  )

  const jitsiPane =
    hasJitsiLayer ? (
      connecting ? (
        <JitsiTeachingPlaceholder />
      ) : (
        <JitsiTeachingEmbed
          roomName={jitsiRoomName}
          sessionTitle={teachingSessionTitle}
          mode={jitsiMode}
          displayName={selfName}
          isModerator={isController}
          showModeToggle={isController}
          onModeChange={handleJitsiModeChange}
        />
      )
    ) : null

  if (error && !connecting) {
    return (
      <div className={`classroom-page classroom-page--error${embedded ? ' classroom-page--embedded' : ''}`}>
        <p>{error}</p>
        {onBack ? (
          <button type="button" className="classroom-btn" onClick={onBack}>
            Go back
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className={`classroom-page${embedded ? ' classroom-page--embedded' : ''}`}>
      <header className="classroom-header">
        <div className="classroom-header__left">
          {onBack ? (
            <button type="button" className="classroom-btn classroom-btn--ghost" onClick={onBack}>
              <ArrowLeft size={18} />
            </button>
          ) : null}
          <div>
            <h1>Live Trading Classroom</h1>
            <p>
              {symbol} · {timeframe === 'D' ? 'Daily' : `${timeframe}m`} ·{' '}
              {connecting ? 'Connecting…' : connected ? 'Live' : 'Reconnecting…'}
              {hasJitsiLayer ? ' · Video class' : ''}
            </p>
          </div>
        </div>
        {isController && !connecting ? (
          <div className="classroom-header__controls">
            <select
              value={symbol}
              onChange={(e) => {
                emitChartSymbol(e.target.value)
                useClassroomStore.getState().setSymbol(e.target.value)
              }}
            >
              {CLASSROOM_SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={timeframe}
              onChange={(e) => {
                emitChartTimeframe(e.target.value)
                useClassroomStore.getState().setTimeframe(e.target.value)
              }}
            >
              {CLASSROOM_TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>
                  {tf === 'D' ? 'Daily' : `${tf}m`}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </header>

      <div className={`classroom-layout${hasJitsiLayer ? ' classroom-layout--split-jitsi' : ''}`}>
        <div className="classroom-main">
          <LiveTeachingSplitLayout
            teachingEnabled={hasJitsiLayer}
            chart={chartPane}
            teaching={jitsiPane}
            chat={
              hasJitsiLayer ? (
                <div className="classroom-mobile-chat">
                  <ParticipantsPanel
                    micOn={micOn}
                    listening={listening}
                    onToggleMic={() => setMicOn((v) => !v)}
                    onToggleListen={() => setListening((v) => !v)}
                    hideWebRtcAudio
                  />
                  <ClassroomChat />
                </div>
              ) : undefined
            }
          />
        </div>

        <aside className={`classroom-sidebar${hasJitsiLayer ? ' classroom-sidebar--desktop-only' : ''}`}>
          <ParticipantsPanel
            micOn={micOn}
            listening={listening}
            onToggleMic={() => setMicOn((v) => !v)}
            onToggleListen={() => setListening((v) => !v)}
            hideWebRtcAudio={hasJitsiLayer}
          />
          <ClassroomChat />
        </aside>
      </div>

      {connecting ? (
        <div className="classroom-connecting-overlay" aria-live="polite">
          <Loader2 className="animate-spin" size={32} />
          <p>Joining classroom…</p>
        </div>
      ) : null}

      {sessionEnded ? (
        <div className="classroom-ended-overlay">
          <Sparkles size={28} className="text-theme-accent" />
          <h2>Session ended</h2>
          <p>Coach closed this classroom. Chart replay is saved for admin review.</p>
          {onBack ? (
            <button type="button" className="classroom-btn classroom-btn--primary" onClick={handleSessionEndedBack}>
              Back to desk
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
