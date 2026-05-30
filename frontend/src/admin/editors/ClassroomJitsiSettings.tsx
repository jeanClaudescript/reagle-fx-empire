import { useState } from 'react'
import { Save } from 'lucide-react'
import { classroomApi, type ClassroomRoom } from '@/services/api'
import { useAdminToast } from '@/admin/toast'
import { sanitizeJitsiRoomName } from '@/jitsi/buildJitsiConfig'

type Props = {
  room: ClassroomRoom
  onSaved: () => void
}

export function ClassroomJitsiSettings({ room, onSaved }: Props) {
  const { push } = useAdminToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    enableLiveTeaching: room.enableLiveTeaching ?? false,
    jitsiRoomName: room.jitsiRoomName || sanitizeJitsiRoomName(room.title),
    teachingSessionTitle: room.teachingSessionTitle || room.title,
    teachingScheduledAt: room.teachingScheduledAt?.slice(0, 16) ?? '',
    jitsiMode: room.jitsiMode ?? 'webcam',
  })

  const save = async () => {
    setSaving(true)
    try {
      await classroomApi.adminUpdate(room.id, {
        enableLiveTeaching: form.enableLiveTeaching,
        jitsiRoomName: form.jitsiRoomName,
        teachingSessionTitle: form.teachingSessionTitle,
        teachingScheduledAt: form.teachingScheduledAt || undefined,
        jitsiMode: form.jitsiMode as 'webcam' | 'screenshare',
      })
      push('Teaching room settings saved', 'success')
      onSaved()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="classroom-jitsi-settings">
      <label className="classroom-jitsi-settings__toggle">
        <input
          type="checkbox"
          checked={form.enableLiveTeaching}
          onChange={(e) => setForm((f) => ({ ...f, enableLiveTeaching: e.target.checked }))}
        />
        <span>Enable Live Teaching Room (Jitsi)</span>
      </label>

      {form.enableLiveTeaching && (
        <div className="classroom-jitsi-settings__fields">
          <input
            className="admin-input"
            placeholder="Jitsi room name"
            value={form.jitsiRoomName}
            onChange={(e) => setForm((f) => ({ ...f, jitsiRoomName: e.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="Session title (shown to students)"
            value={form.teachingSessionTitle}
            onChange={(e) => setForm((f) => ({ ...f, teachingSessionTitle: e.target.value }))}
          />
          <input
            type="datetime-local"
            className="admin-input"
            value={form.teachingScheduledAt}
            onChange={(e) => setForm((f) => ({ ...f, teachingScheduledAt: e.target.value }))}
          />
          <select
            className="admin-input"
            value={form.jitsiMode}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                jitsiMode: e.target.value as 'webcam' | 'screenshare',
              }))
            }
          >
            <option value="webcam">Default — webcam mode</option>
            <option value="screenshare">Screen share focus (teacher)</option>
          </select>
          <p className="text-xs text-theme-muted">
            Room URL: https://meet.jit.si/{sanitizeJitsiRoomName(form.jitsiRoomName || 'room')}
          </p>
        </div>
      )}

      <button type="button" className="admin-btn admin-btn--sm mt-2" onClick={save} disabled={saving}>
        <Save size={14} /> Save teaching settings
      </button>
    </div>
  )
}
