import { useCallback, useEffect, useState } from 'react'
import {
  Clock,
  ExternalLink,
  History,
  Play,
  Radio,
  Square,
  Users,
  Video,
} from 'lucide-react'
import {
  classroomApi,
  type ClassroomAttendance,
  type ClassroomRecording,
  type ClassroomRoom,
} from '@/services/api'
import { useAdminToast } from '@/admin/toast'
import { ClassroomJitsiSettings } from '@/admin/editors/ClassroomJitsiSettings'
import { ClassroomReplayModal } from '@/admin/editors/ClassroomReplayModal'

type Tab = 'control' | 'teaching' | 'students' | 'recordings'

type Props = {
  room: ClassroomRoom
  expanded: boolean
  onToggle: () => void
  onChanged: () => void
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s ? `${m}m ${s}s` : `${m}m`
}

function statusLabel(status: ClassroomRoom['status']) {
  if (status === 'live') return 'Live now'
  if (status === 'ended') return 'Ended'
  return 'Draft'
}

export function ClassroomRoomCard({ room, expanded, onToggle, onChanged }: Props) {
  const { push } = useAdminToast()
  const [tab, setTab] = useState<Tab>('control')
  const [attendance, setAttendance] = useState<ClassroomAttendance[]>([])
  const [recordings, setRecordings] = useState<ClassroomRecording[]>([])
  const [liveSymbol, setLiveSymbol] = useState(room.symbol)
  const [liveTimeframe, setLiveTimeframe] = useState(room.timeframe)
  const [liveDrawings, setLiveDrawings] = useState(0)
  const [liveChatCount, setLiveChatCount] = useState(0)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [replay, setReplay] = useState<{ id: string; title: string } | null>(null)

  const refreshLiveState = useCallback(async () => {
    if (room.status !== 'live') return
    try {
      const res = await classroomApi.adminGetRoom(room.id)
      setLiveSymbol(res.data.chartState.symbol)
      setLiveTimeframe(res.data.chartState.timeframe)
      setLiveDrawings(res.data.chartState.drawings?.length ?? 0)
      setLiveChatCount(res.data.chat?.length ?? 0)
    } catch {
      /* room may have just ended */
    }
  }, [room.id, room.status])

  const loadDetails = useCallback(async () => {
    setLoadingDetail(true)
    try {
      const [attRes, recRes] = await Promise.all([
        classroomApi.adminAttendance(room.id),
        classroomApi.adminRecordings(room.id),
      ])
      setAttendance(attRes.data)
      setRecordings(recRes.data)
      if (room.status === 'live') await refreshLiveState()
    } catch {
      push('Could not load session details', 'error')
    } finally {
      setLoadingDetail(false)
    }
  }, [room.id, room.status, push, refreshLiveState])

  useEffect(() => {
    if (!expanded) return
    void loadDetails()
  }, [expanded, loadDetails])

  useEffect(() => {
    if (!expanded || room.status !== 'live') return
    void refreshLiveState()
    const id = window.setInterval(() => void refreshLiveState(), 8000)
    return () => window.clearInterval(id)
  }, [expanded, room.status, room.updatedAt, refreshLiveState])

  const start = async () => {
    try {
      await classroomApi.adminStart(room.id)
      push('Classroom is LIVE — opening teacher view', 'success')
      onChanged()
      openTeacher()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Start failed', 'error')
    }
  }

  const end = async () => {
    try {
      await classroomApi.adminEnd(room.id)
      push('Classroom ended — recording saved', 'success')
      onChanged()
    } catch (e) {
      push(e instanceof Error ? e.message : 'End failed', 'error')
    }
  }

  const openTeacher = () => {
    const url = `/classroom/${room.id}/teacher`
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (!opened) window.location.assign(url)
  }

  return (
    <>
      <article
        className={`admin-classroom-card${room.status === 'live' ? ' admin-classroom-card--live' : ''}${expanded ? ' admin-classroom-card--open' : ''}`}
      >
        <button type="button" className="admin-classroom-card__summary" onClick={onToggle}>
          <div className="admin-classroom-card__title-row">
            <div>
              <div className="admin-classroom-card__title-line">
                <strong>{room.title}</strong>
                <span className={`admin-classroom-badge admin-classroom-badge--${room.status}`}>
                  {room.status === 'live' ? <Radio size={12} className="admin-classroom-badge__pulse" /> : null}
                  {statusLabel(room.status)}
                </span>
                {room.enableLiveTeaching ? (
                  <span className="admin-classroom-badge admin-classroom-badge--jitsi">Jitsi</span>
                ) : null}
              </div>
              <p className="admin-classroom-card__meta">
                {room.symbol} · {room.timeframe}m
                {room.startedAt ? ` · started ${new Date(room.startedAt).toLocaleString()}` : ''}
              </p>
            </div>
            <div className="admin-classroom-card__quick-actions" onClick={(e) => e.stopPropagation()}>
              {room.status !== 'live' ? (
                <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" onClick={start}>
                  <Play size={14} /> Start
                </button>
              ) : (
                <>
                  <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={openTeacher}>
                    <ExternalLink size={14} /> Teach
                  </button>
                  <button type="button" className="admin-btn admin-btn--danger admin-btn--sm" onClick={end}>
                    <Square size={14} /> End
                  </button>
                </>
              )}
            </div>
          </div>
        </button>

        {expanded ? (
          <div className="admin-classroom-card__body">
            <div className="admin-classroom-tabs" role="tablist">
              {(
                [
                  ['control', 'Control', Radio],
                  ['teaching', 'Teaching', Video],
                  ['students', 'Students', Users],
                  ['recordings', 'Recordings', History],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  className={tab === id ? 'active' : ''}
                  onClick={() => setTab(id)}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {loadingDetail && tab !== 'teaching' ? (
              <p className="admin-classroom-card__loading">Loading session data…</p>
            ) : null}

            {tab === 'control' ? (
              <div className="admin-classroom-panel">
                {room.status === 'live' ? (
                  <div className="admin-classroom-live-grid">
                    <div className="admin-classroom-stat">
                      <span className="admin-classroom-stat__label">Chart</span>
                      <strong>
                        {liveSymbol} · {liveTimeframe}m
                      </strong>
                    </div>
                    <div className="admin-classroom-stat">
                      <span className="admin-classroom-stat__label">Drawings</span>
                      <strong>{liveDrawings}</strong>
                    </div>
                    <div className="admin-classroom-stat">
                      <span className="admin-classroom-stat__label">Chat loaded</span>
                      <strong>{liveChatCount}</strong>
                    </div>
                    <div className="admin-classroom-stat">
                      <span className="admin-classroom-stat__label">Students joined</span>
                      <strong>{attendance.length}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="admin-classroom-panel__hint">
                    Start the session to open the shared chart. Students join from VIP desk → Trading classroom.
                  </p>
                )}

                <div className="admin-classroom-actions">
                  {room.status !== 'live' ? (
                    <button type="button" className="admin-btn admin-btn--primary" onClick={start}>
                      <Play size={16} /> Start live session
                    </button>
                  ) : (
                    <>
                      <button type="button" className="admin-btn admin-btn--primary" onClick={openTeacher}>
                        <ExternalLink size={16} /> Open teacher controller
                      </button>
                      <button type="button" className="admin-btn admin-btn--danger" onClick={end}>
                        <Square size={16} /> End & save recording
                      </button>
                    </>
                  )}
                  <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => void loadDetails()}>
                    Refresh
                  </button>
                </div>
              </div>
            ) : null}

            {tab === 'teaching' ? (
              <ClassroomJitsiSettings room={room} onSaved={onChanged} />
            ) : null}

            {tab === 'students' ? (
              <div className="admin-classroom-panel">
                {attendance.length === 0 ? (
                  <p className="admin-classroom-panel__hint">No attendance yet for this room.</p>
                ) : (
                  <ul className="admin-classroom-attendance">
                    {attendance.map((row) => (
                      <li key={row.id} className="admin-classroom-attendance__row">
                        <div>
                          <strong>{row.userName}</strong>
                          <span className="admin-classroom-attendance__role">{row.role}</span>
                        </div>
                        <div className="admin-classroom-attendance__times">
                          <span>
                            <Clock size={12} /> {formatDuration(row.durationSeconds)}
                          </span>
                          <span>{new Date(row.joinedAt).toLocaleString()}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {tab === 'recordings' ? (
              <div className="admin-classroom-panel">
                {recordings.length === 0 ? (
                  <p className="admin-classroom-panel__hint">
                    Recordings appear after you end a live session (chart events saved as JSON replay).
                  </p>
                ) : (
                  <ul className="admin-classroom-recordings">
                    {recordings.map((rec) => (
                      <li key={rec.id} className="admin-classroom-recordings__row">
                        <div>
                          <strong>{rec.title}</strong>
                          <p className="admin-classroom-recordings__meta">
                            {rec.eventCount} events
                            {rec.endedAt ? ` · ${new Date(rec.endedAt).toLocaleString()}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="admin-btn admin-btn--secondary admin-btn--sm"
                          onClick={() => setReplay({ id: rec.id, title: rec.title })}
                        >
                          <Play size={14} /> Replay
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </article>

      {replay ? (
        <ClassroomReplayModal
          recordingId={replay.id}
          title={replay.title}
          onClose={() => setReplay(null)}
        />
      ) : null}
    </>
  )
}
