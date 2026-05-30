import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, X } from 'lucide-react'
import { classroomApi, type ClassroomReplayData, type ClassroomReplayEvent } from '@/services/api'
import { SharedChart } from '@/classroom/chart/SharedChart'
import { DrawingOverlay } from '@/classroom/drawing/DrawingOverlay'
import type { DrawingObject } from '@/classroom/types'
import { useClassroomStore } from '@/classroom/store/useClassroomStore'

type Props = {
  recordingId: string
  title: string
  onClose: () => void
}

function formatEventLabel(event: ClassroomReplayEvent) {
  const p = event.payload
  switch (event.eventType) {
    case 'chart:symbol':
      return `Symbol → ${String(p.symbol ?? '—')}`
    case 'chart:timeframe':
      return `Timeframe → ${String(p.timeframe ?? '—')}m`
    case 'chart:range':
      return 'Chart range updated'
    case 'chart:crosshair':
      return 'Crosshair moved'
    case 'drawing:add':
      return `Drawing added (${String(p.tool ?? 'shape')})`
    case 'drawing:update':
      return `Drawing updated (${String(p.tool ?? 'shape')})`
    case 'drawing:delete':
      return 'Drawing removed'
    case 'chat:send':
      return `Chat: ${String(p.message ?? '').slice(0, 48)}`
    default:
      return event.eventType.replace(':', ' · ')
  }
}

function applyReplayEvent(
  event: ClassroomReplayEvent,
  drawings: Map<string, DrawingObject>,
): { symbol?: string; timeframe?: string } {
  const p = event.payload
  const patch: { symbol?: string; timeframe?: string } = {}

  if (event.eventType === 'chart:symbol' && typeof p.symbol === 'string') {
    patch.symbol = p.symbol
    useClassroomStore.getState().setSymbol(p.symbol)
  } else if (event.eventType === 'chart:timeframe' && typeof p.timeframe === 'string') {
    patch.timeframe = p.timeframe
    useClassroomStore.getState().setTimeframe(p.timeframe)
  } else if (event.eventType === 'drawing:add' || event.eventType === 'drawing:update') {
    const id = String(p.id ?? '')
    if (id) {
      const drawing = p as unknown as DrawingObject
      drawings.set(id, drawing)
      useClassroomStore.getState().upsertDrawing(drawing)
    }
  } else if (event.eventType === 'drawing:delete') {
    const id = String(p.id ?? '')
    if (id) {
      drawings.delete(id)
      useClassroomStore.getState().removeDrawing(id)
    }
  }

  return patch
}

export function ClassroomReplayModal({ recordingId, title, onClose }: Props) {
  const [data, setData] = useState<ClassroomReplayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [index, setIndex] = useState(0)
  const [speed, setSpeed] = useState(2)
  const timerRef = useRef<number | null>(null)
  const drawingsRef = useRef(new Map<string, DrawingObject>())

  const events = data?.events ?? []
  const progress = events.length > 0 ? Math.round((index / events.length) * 100) : 0

  const resetStore = useCallback(() => {
    drawingsRef.current = new Map()
    useClassroomStore.setState({
      role: 'teacher',
      symbol: 'EURUSD',
      timeframe: '15',
      drawings: [],
    })
  }, [])

  const applyUpTo = useCallback(
    (targetIndex: number) => {
      resetStore()
      const map = drawingsRef.current
      for (let i = 0; i < targetIndex && i < events.length; i++) {
        applyReplayEvent(events[i], map)
      }
      setIndex(targetIndex)
    },
    [events, resetStore],
  )

  useEffect(() => {
    setLoading(true)
    classroomApi
      .adminRecordingReplay(recordingId)
      .then((res) => setData(res.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [recordingId])

  useEffect(() => {
    if (!data) return
    resetStore()
    return () => resetStore()
  }, [data, resetStore])

  useEffect(() => {
    if (!playing || events.length === 0) return

    const tick = () => {
      setIndex((prev) => {
        if (prev >= events.length) {
          setPlaying(false)
          return prev
        }
        applyReplayEvent(events[prev], drawingsRef.current)
        return prev + 1
      })
    }

    timerRef.current = window.setInterval(tick, 1000 / speed)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [playing, events, speed])

  const currentEvent = events[index - 1] ?? null

  const timeline = useMemo(
    () =>
      events.map((event, i) => ({
        event,
        label: formatEventLabel(event),
        active: i < index,
        current: i === index - 1,
      })),
    [events, index],
  )

  return (
    <div className="admin-classroom-replay" role="dialog" aria-modal="true" aria-label="Session replay">
      <button type="button" className="admin-classroom-replay__backdrop" onClick={onClose} aria-label="Close" />
      <div className="admin-classroom-replay__panel">
        <header className="admin-classroom-replay__header">
          <div>
            <p className="admin-classroom-replay__eyebrow">Session replay</p>
            <h3>{title}</h3>
            {data ? (
              <p className="admin-classroom-replay__meta">
                {events.length} events
                {data.startedAt ? ` · ${new Date(data.startedAt).toLocaleString()}` : ''}
              </p>
            ) : null}
          </div>
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        {loading ? (
          <p className="admin-classroom-replay__status">Loading recording…</p>
        ) : error ? (
          <p className="admin-classroom-replay__status admin-classroom-replay__status--error">{error}</p>
        ) : (
          <div className="admin-classroom-replay__body">
            <div className="admin-classroom-replay__chart">
              <div className="classroom-chart-wrap">
                <SharedChart readOnly />
                <DrawingOverlay readOnly />
              </div>
              {currentEvent ? (
                <div className="admin-classroom-replay__toast">{formatEventLabel(currentEvent)}</div>
              ) : null}
            </div>

            <aside className="admin-classroom-replay__sidebar">
              <div className="admin-classroom-replay__controls">
                <button
                  type="button"
                  className="admin-btn admin-btn--primary admin-btn--sm"
                  onClick={() => setPlaying((p) => !p)}
                  disabled={events.length === 0 || index >= events.length}
                >
                  {playing ? <Pause size={14} /> : <Play size={14} />}
                  {playing ? 'Pause' : index >= events.length ? 'Done' : 'Play'}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                  onClick={() => {
                    setPlaying(false)
                    applyUpTo(0)
                  }}
                >
                  <RotateCcw size={14} /> Reset
                </button>
                <select
                  className="admin-input admin-classroom-replay__speed"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                >
                  <option value={1}>1×</option>
                  <option value={2}>2×</option>
                  <option value={4}>4×</option>
                  <option value={8}>8×</option>
                </select>
              </div>

              <input
                type="range"
                min={0}
                max={events.length}
                value={index}
                className="admin-classroom-replay__scrubber"
                onChange={(e) => {
                  setPlaying(false)
                  applyUpTo(Number(e.target.value))
                }}
              />
              <p className="admin-classroom-replay__progress">{progress}% · event {index} / {events.length}</p>

              <ul className="admin-classroom-replay__timeline">
                {timeline.length === 0 ? (
                  <li className="admin-classroom-replay__timeline-empty">No chart events in this recording.</li>
                ) : (
                  timeline.map(({ event, label, active, current }, i) => (
                    <li key={`${event.createdAt}-${i}`}>
                      <button
                        type="button"
                        className={`admin-classroom-replay__timeline-item${active ? ' is-done' : ''}${current ? ' is-current' : ''}`}
                        onClick={() => {
                          setPlaying(false)
                          applyUpTo(i + 1)
                        }}
                      >
                        <span className="admin-classroom-replay__timeline-time">
                          {new Date(event.createdAt).toLocaleTimeString()}
                        </span>
                        <span>{label}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
