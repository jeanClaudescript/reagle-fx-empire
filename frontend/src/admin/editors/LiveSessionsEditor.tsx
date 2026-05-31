import { useCallback, useEffect, useState } from 'react'
import { liveApi, type LiveSession } from '@/services/api'
import { AdminCard } from '@/components/admin/AdminCard'
import { useAdminToast } from '@/admin/toast'

export function LiveSessionsEditor() {
  const { push } = useAdminToast()
  const [items, setItems] = useState<LiveSession[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    streamUrl: '',
    meetingUrl: '',
    pair: 'EUR/USD',
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await liveApi.adminList()
      setItems(res.data)
    } catch {
      push('Could not load live sessions', 'error')
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => {
    void load()
  }, [load])

  const create = async () => {
    if (!form.title.trim()) {
      push('Title required', 'error')
      return
    }
    try {
      await liveApi.adminCreate(form)
      setForm({ title: '', description: '', streamUrl: '', meetingUrl: '', pair: 'EUR/USD' })
      push('Session created', 'success')
      void load()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Create failed', 'error')
    }
  }

  return (
    <div className="admin-form-stack">
      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-base font-bold text-theme-primary">Teach live</h3>
          <p className="admin-editor-card-intro mt-1">
            Start a live session — paid students see stream, coach signals, and paper trading desk.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Session title"
              className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              value={form.streamUrl}
              onChange={(e) => setForm((f) => ({ ...f, streamUrl: e.target.value }))}
              placeholder="YouTube live URL"
              className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              value={form.meetingUrl}
              onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))}
              placeholder="Zoom / Meet link (optional)"
              className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
            />
            <input
              value={form.pair}
              onChange={(e) => setForm((f) => ({ ...f, pair: e.target.value }))}
              placeholder="Pair e.g. EUR/USD"
              className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description"
              rows={2}
              className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm sm:col-span-2"
            />
          </div>
          <button type="button" className="admin-btn admin-btn--primary mt-4" onClick={create}>
            Create session
          </button>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          {loading ? (
            <p className="text-sm text-theme-muted">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-theme-muted">No sessions yet.</p>
          ) : (
            <div className="admin-form-stack">
              {items.map((s) => (
                <LiveSessionRow key={s.id} session={s} onChanged={load} />
              ))}
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  )
}

function LiveSessionRow({ session, onChanged }: { session: LiveSession; onChanged: () => void }) {
  const { push } = useAdminToast()
  const [note, setNote] = useState(session.coachNote)
  const [side, setSide] = useState(session.signalSide)
  const [entry, setEntry] = useState(session.signalEntry ?? '')
  const [stop, setStop] = useState(session.signalStop ?? '')
  const [target, setTarget] = useState(session.signalTarget ?? '')

  const setStatus = async (status: 'scheduled' | 'live' | 'ended') => {
    try {
      await liveApi.adminSetStatus(session.id, status)
      push(status === 'live' ? 'You are LIVE' : `Status: ${status}`, 'success')
      onChanged()
    } catch {
      push('Status update failed', 'error')
    }
  }

  const saveSignal = async () => {
    try {
      await liveApi.adminUpdate(session.id, {
        coachNote: note,
        signalSide: side,
        signalEntry: entry === '' ? undefined : Number(entry),
        signalStop: stop === '' ? undefined : Number(stop),
        signalTarget: target === '' ? undefined : Number(target),
      })
      push('Signal updated for students', 'success')
      onChanged()
    } catch {
      push('Update failed', 'error')
    }
  }

  return (
    <div className="manage-student-row flex-col items-stretch">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-theme-primary">{session.title}</p>
          <p className="text-xs text-theme-muted">
            {session.pair} · {session.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {session.status !== 'live' && (
            <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => setStatus('live')}>
              Go LIVE
            </button>
          )}
          {session.status === 'live' && (
            <button type="button" className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => setStatus('ended')}>
              End
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Coach note to students"
          rows={2}
          className="rounded-lg border border-theme bg-theme-elevated/60 px-2 py-1.5 text-sm sm:col-span-2"
        />
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as 'buy' | 'sell' | 'neutral')}
          className="rounded-lg border border-theme bg-theme-elevated/60 px-2 py-1.5 text-sm"
        >
          <option value="neutral">Neutral</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
        <input
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Entry"
          className="rounded-lg border border-theme bg-theme-elevated/60 px-2 py-1.5 text-sm"
        />
        <input
          value={stop}
          onChange={(e) => setStop(e.target.value)}
          placeholder="Stop"
          className="rounded-lg border border-theme bg-theme-elevated/60 px-2 py-1.5 text-sm"
        />
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Target"
          className="rounded-lg border border-theme bg-theme-elevated/60 px-2 py-1.5 text-sm"
        />
        <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm sm:col-span-2" onClick={saveSignal}>
          Push signal to students
        </button>
      </div>
    </div>
  )
}
