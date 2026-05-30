import { useEffect, useRef, useState } from 'react'
import { GraduationCap, Radio, Sparkles, Video } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { classroomApi, type ClassroomRoom } from '@/services/api'
import { onClassroomUpdated } from '@/realtime/appSocket'
import { ClassroomRoomView } from '@/classroom/ClassroomRoomView'

export function VipClassroomPanel() {
  const { t } = useLanguage()
  const [active, setActive] = useState<ClassroomRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [justLive, setJustLive] = useState(false)
  const prevActiveRef = useRef<ClassroomRoom | null>(null)

  useEffect(() => {
    classroomApi
      .getActive()
      .then((res) => {
        setActive(res.data)
        prevActiveRef.current = res.data
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))

    return onClassroomUpdated((payload) => {
      const next = payload.data
      const prev = prevActiveRef.current
      if (next && (!prev || prev.id !== next.id || prev.status !== 'live') && next.status === 'live') {
        setJustLive(true)
        window.setTimeout(() => setJustLive(false), 5000)
      }
      prevActiveRef.current = next
      setActive(next)
    })
  }, [])

  useEffect(() => {
    if (!active && joinedRoomId) {
      setJoinedRoomId(null)
    }
  }, [active, joinedRoomId])

  if (joinedRoomId) {
    return (
      <div className="vip-classroom-shell vip-classroom-shell--joined">
        <ClassroomRoomView
          roomId={joinedRoomId}
          mode="student"
          embedded
          onBack={() => setJoinedRoomId(null)}
          onSessionEnded={() => setJoinedRoomId(null)}
        />
      </div>
    )
  }

  return (
    <div className="vip-classroom-shell">
      <div className="vip-classroom-lobby">
        <div className="vip-classroom-lobby__head">
          <div>
            <p className="vip-classroom-lobby__eyebrow">
              <GraduationCap size={14} /> {t.classroom.navTitle}
            </p>
            <h2 className="vip-classroom-lobby__title">{t.classroom.liveNow}</h2>
            <p className="vip-classroom-lobby__subtitle">{t.classroom.lobbyHint}</p>
          </div>
          {active?.status === 'live' ? (
            <span className="vip-classroom-live-badge">
              <Radio size={12} className="vip-classroom-live-badge__dot" />
              {t.chat.liveRealtime}
            </span>
          ) : null}
        </div>

        <div className="vip-classroom-lobby__stage">
          {loading ? (
            <div className="vip-classroom-lobby__placeholder">
              <div className="vip-classroom-lobby__skeleton" />
              <p>{t.classroom.loading}</p>
            </div>
          ) : error ? (
            <div className="vip-classroom-lobby__empty">
              <p className="text-red-400">{error}</p>
            </div>
          ) : !active ? (
            <div className="vip-classroom-lobby__empty">
              <Radio className="text-theme-muted" size={36} />
              <p>{t.classroom.noLiveSession}</p>
              <p className="vip-classroom-lobby__hint">{t.classroom.waitRealtime}</p>
            </div>
          ) : (
            <div className={`vip-classroom-session-card${justLive ? ' vip-classroom-session-card--new' : ''}`}>
              {justLive ? (
                <span className="vip-classroom-session-card__new">
                  <Sparkles size={12} /> {t.classroom.newSession}
                </span>
              ) : null}
              <div className="vip-classroom-session-card__icon">
                <Video size={22} />
              </div>
              <div className="vip-classroom-session-card__body">
                <h3>{active.title}</h3>
                <p>{active.description || t.classroom.liveNow}</p>
                <p className="vip-classroom-session-card__meta">
                  {active.symbol} · {active.timeframe}m
                  {active.enableLiveTeaching ? ` · ${t.classroom.videoClass}` : ''}
                </p>
              </div>
              <button
                type="button"
                className="vip-btn vip-btn--primary vip-classroom-session-card__cta"
                onClick={() => setJoinedRoomId(active.id)}
              >
                {active.enableLiveTeaching ? t.jitsi.joinLiveClass : t.classroom.joinRoom}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
