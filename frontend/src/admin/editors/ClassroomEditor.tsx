import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Play, Square, Video } from 'lucide-react'
import { classroomApi, type ClassroomRoom } from '@/services/api'
import { useAdminToast } from '@/admin/toast'
import { ClassroomJitsiSettings } from '@/admin/editors/ClassroomJitsiSettings'
import { sanitizeJitsiRoomName } from '@/jitsi/buildJitsiConfig'

export function ClassroomEditor() {
  const { push } = useAdminToast()
  const [rooms, setRooms] = useState<ClassroomRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    symbol: 'EURUSD',
    timeframe: '15',
    enableLiveTeaching: false,
    jitsiRoomName: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await classroomApi.adminList()
      setRooms(res.data)
    } catch {
      push('Could not load classrooms', 'error')
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => {
    void load()
  }, [load])

  const create = async () => {
    if (!form.title.trim()) {
      push('Title is required', 'error')
      return
    }
    try {
      await classroomApi.adminCreate({
        title: form.title,
        description: form.description,
        symbol: form.symbol,
        timeframe: form.timeframe,
        enableLiveTeaching: form.enableLiveTeaching,
        jitsiRoomName: form.jitsiRoomName || sanitizeJitsiRoomName(form.title),
        teachingSessionTitle: form.title,
      })
      setForm({
        title: '',
        description: '',
        symbol: 'EURUSD',
        timeframe: '15',
        enableLiveTeaching: false,
        jitsiRoomName: '',
      })
      push('Classroom created', 'success')
      await load()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Create failed', 'error')
    }
  }

  const start = async (id: string) => {
    try {
      await classroomApi.adminStart(id)
      push('Classroom is LIVE', 'success')
      await load()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Start failed', 'error')
    }
  }

  const end = async (id: string) => {
    try {
      await classroomApi.adminEnd(id)
      push('Classroom ended — recording saved', 'success')
      await load()
    } catch (e) {
      push(e instanceof Error ? e.message : 'End failed', 'error')
    }
  }

  const openTeacher = (id: string) => {
    window.open(`/classroom/${id}/teacher`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="admin-editor">
      <div className="admin-editor__header">
        <div>
          <h3 className="font-display text-base font-bold text-theme-primary">Live Trading Classroom</h3>
          <p className="text-sm text-theme-muted">
            Shared chart + optional Jitsi teaching layer. WebSocket chart sync and WebRTC voice stay independent.
          </p>
        </div>
      </div>

      <div className="admin-card admin-card--padded" style={{ marginBottom: '1rem' }}>
        <h4 className="font-semibold mb-3">Create room</h4>
        <div className="admin-form-grid">
          <input
            className="admin-input"
            placeholder="Session title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <select
            className="admin-input"
            value={form.symbol}
            onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
          >
            {['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'XAUUSD', 'BTCUSD'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="classroom-jitsi-settings__toggle admin-input">
            <input
              type="checkbox"
              checked={form.enableLiveTeaching}
              onChange={(e) => setForm((f) => ({ ...f, enableLiveTeaching: e.target.checked }))}
            />
            <span>Enable Jitsi teaching room</span>
          </label>
          {form.enableLiveTeaching && (
            <input
              className="admin-input sm:col-span-2"
              placeholder="Jitsi room name (optional)"
              value={form.jitsiRoomName}
              onChange={(e) => setForm((f) => ({ ...f, jitsiRoomName: e.target.value }))}
            />
          )}
          <button type="button" className="admin-btn admin-btn--primary" onClick={create}>
            <Video size={16} /> Create
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-theme-muted text-sm">Loading…</p>
      ) : rooms.length === 0 ? (
        <p className="text-theme-muted text-sm">No classrooms yet.</p>
      ) : (
        <ul className="admin-list">
          {rooms.map((room) => (
            <li key={room.id} className="admin-list__item admin-list__item--stack">
              <div className="flex flex-wrap items-start justify-between gap-3 w-full">
                <div>
                  <strong>{room.title}</strong>
                  <span className={`admin-badge admin-badge--${room.status}`}>{room.status}</span>
                  {room.enableLiveTeaching ? (
                    <span className="admin-badge admin-badge--live ml-1">Jitsi</span>
                  ) : null}
                  <p className="text-sm text-theme-muted">
                    {room.symbol} · {room.timeframe}m
                    {room.jitsiRoomName ? ` · meet.jit.si/${room.jitsiRoomName}` : ''}
                  </p>
                </div>
                <div className="admin-list__actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    onClick={() => setExpandedId((id) => (id === room.id ? null : room.id))}
                  >
                    Teaching settings
                  </button>
                  {room.status !== 'live' && (
                    <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => start(room.id)}>
                      <Play size={14} /> Start
                    </button>
                  )}
                  {room.status === 'live' && (
                    <>
                      <button type="button" className="admin-btn admin-btn--sm" onClick={() => openTeacher(room.id)}>
                        <ExternalLink size={14} /> Enter as teacher
                      </button>
                      <button type="button" className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => end(room.id)}>
                        <Square size={14} /> End
                      </button>
                    </>
                  )}
                </div>
              </div>
              {expandedId === room.id && (
                <ClassroomJitsiSettings room={room} onSaved={load} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
