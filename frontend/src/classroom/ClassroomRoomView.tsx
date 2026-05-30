import { useEffect, useState } from 'react'
import { ArrowLeft, Radio } from 'lucide-react'
import { getAdminAuthToken } from '@/admin/adminSession'
import { getStudentAuthToken } from '@/student/studentSession'
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

type Props = {
  roomId: string
  mode: 'teacher' | 'student'
  onBack?: () => void
}

export function ClassroomRoomView({ roomId, mode, onBack }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
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

  const isController = role === 'teacher' || role === 'moderator'
  const useJitsiForAv = enableLiveTeaching && Boolean(jitsiRoomName)

  // WebRTC audio module stays intact — only activated when Jitsi teaching layer is off
  useClassroomAudio({
    micOn: !useJitsiForAv && mode === 'teacher' && micOn,
    canSpeak: !useJitsiForAv && canSpeak,
    listening: !useJitsiForAv && listening,
  })

  useEffect(() => {
    const token = mode === 'teacher' ? getAdminAuthToken() : getStudentAuthToken()
    if (!token) {
      setError(mode === 'teacher' ? 'Sign in as admin first' : 'Sign in to VIP desk first')
      setLoading(false)
      return
    }

    connectClassroomSocket(token, mode)
    joinClassroomRoom(roomId)
      .then(() => setLoading(false))
      .catch((e: Error) => {
        setError(e.message)
        setLoading(false)
      })

    return () => {
      leaveClassroomRoom()
      disconnectClassroomSocket()
    }
  }, [roomId, mode])

  const handleJitsiModeChange = (next: 'webcam' | 'screenshare') => {
    setJitsiMode(next)
    emitJitsiMode(next)
  }

  if (loading) {
    return (
      <div className="classroom-page classroom-page--loading">
        <Radio className="animate-pulse" />
        <p>Joining classroom…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="classroom-page classroom-page--error">
        <p>{error}</p>
        {onBack && (
          <button type="button" className="classroom-btn" onClick={onBack}>
            Go back
          </button>
        )}
      </div>
    )
  }

  const chartPane = (
    <>
      {isController && <DrawingToolbar />}
      <div className="classroom-chart-wrap">
        <SharedChart readOnly={!isController} />
        <DrawingOverlay readOnly={!isController} />
        <CursorLayer />
      </div>
    </>
  )

  const jitsiPane =
    useJitsiForAv ? (
      <JitsiTeachingEmbed
        roomName={jitsiRoomName}
        sessionTitle={teachingSessionTitle}
        mode={jitsiMode}
        displayName={selfName}
        isModerator={isController}
        showModeToggle={isController}
        onModeChange={handleJitsiModeChange}
      />
    ) : null

  return (
    <div className="classroom-page">
      <header className="classroom-header">
        <div className="classroom-header__left">
          {onBack && (
            <button type="button" className="classroom-btn classroom-btn--ghost" onClick={onBack}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1>Live Trading Classroom</h1>
            <p>
              {symbol} · {timeframe}m · {connected ? 'Live' : 'Reconnecting…'}
              {useJitsiForAv ? ' · Jitsi class active' : ''}
            </p>
          </div>
        </div>
        {isController && (
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
        )}
      </header>

      <div className={`classroom-layout${useJitsiForAv ? ' classroom-layout--split-jitsi' : ''}`}>
        <div className="classroom-main">
          <LiveTeachingSplitLayout
            teachingEnabled={useJitsiForAv}
            chart={chartPane}
            teaching={jitsiPane}
            chat={
              useJitsiForAv ? (
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

        <aside className={`classroom-sidebar${useJitsiForAv ? ' classroom-sidebar--desktop-only' : ''}`}>
          <ParticipantsPanel
            micOn={micOn}
            listening={listening}
            onToggleMic={() => setMicOn((v) => !v)}
            onToggleListen={() => setListening((v) => !v)}
            hideWebRtcAudio={useJitsiForAv}
          />
          <ClassroomChat />
        </aside>
      </div>
    </div>
  )
}
