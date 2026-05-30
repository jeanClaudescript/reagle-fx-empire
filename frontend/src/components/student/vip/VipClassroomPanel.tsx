import { useEffect, useState } from 'react'
import { Radio, Video } from 'lucide-react'
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

  useEffect(() => {
    classroomApi
      .getActive()
      .then((res) => setActive(res.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))

    return onClassroomUpdated((payload) => setActive(payload.data))
  }, [])

  if (joinedRoomId) {
    return (
      <ClassroomRoomView
        roomId={joinedRoomId}
        mode="student"
        onBack={() => setJoinedRoomId(null)}
      />
    )
  }

  if (loading) {
    return <p className="text-theme-muted text-sm">{t.classroom.loading}</p>
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>
  }

  if (!active) {
    return (
      <div className="vip-tool-card text-center py-8">
        <Radio className="mx-auto mb-3 text-theme-muted" size={32} />
        <p className="text-theme-muted">{t.classroom.noLiveSession}</p>
      </div>
    )
  }

  return (
    <div className="vip-tool-card">
      <div className="flex items-start gap-3 mb-4">
        <Video className="text-emerald-400 shrink-0" size={24} />
        <div>
          <h3 className="font-semibold text-theme-primary">{active.title}</h3>
          <p className="text-sm text-theme-muted">{active.description || t.classroom.liveNow}</p>
          <p className="text-xs text-emerald-400 mt-1">
            {active.symbol} · {active.timeframe}m · LIVE
            {active.enableLiveTeaching ? ' · Jitsi class' : ''}
          </p>
        </div>
      </div>
      <button
        type="button"
        className="vip-btn vip-btn--primary w-full"
        onClick={() => setJoinedRoomId(active.id)}
      >
        {active.enableLiveTeaching ? t.jitsi.joinLiveClass : t.classroom.joinRoom}
      </button>
    </div>
  )
}
