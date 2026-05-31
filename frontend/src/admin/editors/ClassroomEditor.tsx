import { useCallback, useEffect, useRef, useState } from 'react'
import { GraduationCap, Plus, Video } from 'lucide-react'
import { classroomApi, type ClassroomRoom } from '@/services/api'
import { useAdminToast } from '@/admin/toast'
import { AdminCard } from '@/components/admin/AdminCard'
import { ClassroomRoomCard } from '@/admin/editors/ClassroomRoomCard'
import { sanitizeJitsiRoomName } from '@/jitsi/buildJitsiConfig'
import { onClassroomUpdated } from '@/realtime/appSocket'

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
  const liveRoomIdsRef = useRef<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await classroomApi.adminList()
      setRooms(res.data)
      liveRoomIdsRef.current = new Set(res.data.filter((r) => r.status === 'live').map((r) => r.id))
    } catch {
      push('Could not load classrooms', 'error')
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    return onClassroomUpdated((payload) => {
      const next = payload.data
      setRooms((prev) => {
        if (!next) {
          return prev.map((r) => (r.status === 'live' ? { ...r, status: 'ended' as const } : r))
        }
        const idx = prev.findIndex((r) => r.id === next.id)
        if (idx >= 0) {
          const copy = [...prev]
          copy[idx] = next
          return copy
        }
        return [next, ...prev]
      })
      if (next?.status === 'live' && !liveRoomIdsRef.current.has(next.id)) {
        liveRoomIdsRef.current.add(next.id)
        push(`Classroom live: ${next.title}`, 'success')
      }
      if (next && next.status !== 'live') {
        liveRoomIdsRef.current.delete(next.id)
      }
      if (!next) {
        liveRoomIdsRef.current.clear()
      }
    })
  }, [push])

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

  const liveCount = rooms.filter((r) => r.status === 'live').length

  return (
    <div className="admin-form-stack">
      <AdminCard>
        <div className="admin-card-body">
          <div className="admin-classroom-header">
            <div>
              <p className="admin-classroom-header__eyebrow">
                <GraduationCap size={14} /> Operations
              </p>
              <h3 className="font-display text-base font-bold text-theme-primary">Live Trading Classroom</h3>
              <p className="admin-editor-card-intro mt-1">
                Control shared chart sessions, optional Jitsi teaching, attendance, and JSON replays.
              </p>
            </div>
            {liveCount > 0 ? (
              <span className="admin-classroom-badge admin-classroom-badge--live">
                {liveCount} live
              </span>
            ) : null}
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <h4 className="font-semibold text-theme-primary">Create room</h4>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm sm:col-span-2"
              placeholder="Session title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm sm:col-span-2"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <select
              className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
              value={form.symbol}
              onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
            >
              {['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'XAUUSD', 'BTCUSD'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
              value={form.timeframe}
              onChange={(e) => setForm((f) => ({ ...f, timeframe: e.target.value }))}
            >
              {['1', '5', '15', '30', '60', '240', 'D'].map((tf) => (
                <option key={tf} value={tf}>
                  {tf === 'D' ? 'Daily' : `${tf}m`}
                </option>
              ))}
            </select>
            <label className="classroom-jitsi-settings__toggle rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.enableLiveTeaching}
                onChange={(e) => setForm((f) => ({ ...f, enableLiveTeaching: e.target.checked }))}
              />
              <span>Enable Jitsi teaching room</span>
            </label>
            {form.enableLiveTeaching ? (
              <input
                className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm sm:col-span-2"
                placeholder="Jitsi room name (optional)"
                value={form.jitsiRoomName}
                onChange={(e) => setForm((f) => ({ ...f, jitsiRoomName: e.target.value }))}
              />
            ) : null}
          </div>
          <button type="button" className="admin-btn admin-btn--primary mt-4" onClick={create}>
            <Plus size={16} /> Create classroom
          </button>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <h4 className="font-semibold text-theme-primary mb-4">Your sessions</h4>
          {loading ? (
            <p className="text-sm text-theme-muted">Loading…</p>
          ) : rooms.length === 0 ? (
            <div className="admin-classroom-empty">
              <Video className="text-theme-muted" size={28} />
              <p>No classrooms yet. Create one above to start teaching.</p>
            </div>
          ) : (
            <div className="admin-classroom-list">
              {rooms.map((room) => (
                <ClassroomRoomCard
                  key={room.id}
                  room={room}
                  expanded={expandedId === room.id}
                  onToggle={() => setExpandedId((id) => (id === room.id ? null : room.id))}
                  onChanged={load}
                />
              ))}
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  )
}
