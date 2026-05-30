import { useCallback, useRef, useState } from 'react'
import type { DrawingObject, DrawingTool } from '../types'
import { useClassroomStore } from '../store/useClassroomStore'
import { emitDrawingAdd, emitDrawingDelete, emitDrawingUpdate } from '../socket/classroomSocket'

const TOOL_COLORS: Partial<Record<DrawingTool, string>> = {
  support: '#22c55e',
  resistance: '#ef4444',
  trendline: '#38bdf8',
  hline: '#a78bfa',
  vline: '#a78bfa',
  rectangle: '#f59e0b',
  fibonacci: '#ec4899',
  arrow: '#f97316',
  text: '#e2e8f0',
}

function uid() {
  return `d-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function renderDrawing(d: DrawingObject) {
  const pts = d.points
  if (pts.length < 1) return null

  const color = d.color || TOOL_COLORS[d.tool] || '#38bdf8'

  if (d.tool === 'hline' && pts[0]) {
    return (
      <line
        key={d.id}
        x1="0%"
        y1={`${pts[0].y ?? 50}%`}
        x2="100%"
        y2={`${pts[0].y ?? 50}%`}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="6 4"
      />
    )
  }

  if (d.tool === 'vline' && pts[0]) {
    return (
      <line
        key={d.id}
        x1={`${pts[0].x ?? 50}%`}
        y1="0%"
        x2={`${pts[0].x ?? 50}%`}
        y2="100%"
        stroke={color}
        strokeWidth={2}
        strokeDasharray="6 4"
      />
    )
  }

  if ((d.tool === 'trendline' || d.tool === 'support' || d.tool === 'resistance' || d.tool === 'arrow') && pts.length >= 2) {
    const p1 = pts[0]
    const p2 = pts[1]
    return (
      <g key={d.id}>
        <line
          x1={`${p1.x ?? 0}%`}
          y1={`${p1.y ?? 0}%`}
          x2={`${p2.x ?? 0}%`}
          y2={`${p2.y ?? 0}%`}
          stroke={color}
          strokeWidth={d.tool === 'support' || d.tool === 'resistance' ? 3 : 2}
        />
        {d.tool === 'arrow' && (
          <polygon
            points={`${p2.x ?? 0},${p2.y ?? 0} ${(p2.x ?? 0) - 1},${(p2.y ?? 0) - 2} ${(p2.x ?? 0) - 1},${(p2.y ?? 0) + 2}`}
            fill={color}
          />
        )}
      </g>
    )
  }

  if (d.tool === 'rectangle' && pts.length >= 2) {
    const p1 = pts[0]
    const p2 = pts[1]
    const x = Math.min(p1.x ?? 0, p2.x ?? 0)
    const y = Math.min(p1.y ?? 0, p2.y ?? 0)
    const w = Math.abs((p2.x ?? 0) - (p1.x ?? 0))
    const h = Math.abs((p2.y ?? 0) - (p1.y ?? 0))
    return (
      <rect
        key={d.id}
        x={`${x}%`}
        y={`${y}%`}
        width={`${w}%`}
        height={`${h}%`}
        fill={`${color}22`}
        stroke={color}
        strokeWidth={2}
      />
    )
  }

  if (d.tool === 'fibonacci' && pts.length >= 2) {
    const p1 = pts[0]
    const p2 = pts[1]
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
    const yStart = p1.y ?? 0
    const yEnd = p2.y ?? 0
    return (
      <g key={d.id}>
        {levels.map((lvl) => {
          const y = yStart + (yEnd - yStart) * lvl
          return (
            <line
              key={`${d.id}-${lvl}`}
              x1={`${p1.x ?? 0}%`}
              y1={`${y}%`}
              x2={`${p2.x ?? 100}%`}
              y2={`${y}%`}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.85}
            />
          )
        })}
      </g>
    )
  }

  if (d.tool === 'text' && pts[0]) {
    return (
      <text
        key={d.id}
        x={`${pts[0].x ?? 10}%`}
        y={`${pts[0].y ?? 10}%`}
        fill={color}
        fontSize={14}
        fontWeight={600}
      >
        {d.text ?? 'Note'}
      </text>
    )
  }

  return null
}

type Props = {
  readOnly?: boolean
}

export function DrawingOverlay({ readOnly = false }: Props) {
  const drawings = useClassroomStore((s) => s.drawings)
  const activeTool = useClassroomStore((s) => s.activeTool)
  const role = useClassroomStore((s) => s.role)
  const upsertDrawing = useClassroomStore((s) => s.upsertDrawing)
  const removeDrawing = useClassroomStore((s) => s.removeDrawing)

  const isController = !readOnly && (role === 'teacher' || role === 'moderator')
  const draftRef = useRef<DrawingObject | null>(null)
  const [draftTick, setDraftTick] = useState(0)

  const pct = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    }
  }, [])

  const finishDrawing = (obj: DrawingObject) => {
    upsertDrawing(obj)
    emitDrawingAdd(obj)
    draftRef.current = null
    setDraftTick((n) => n + 1)
  }

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isController || activeTool === 'select') return
    const p = pct(e)
    const tool = activeTool
    const oneClick = tool === 'hline' || tool === 'vline' || tool === 'text'

    if (oneClick) {
      const obj: DrawingObject = {
        id: uid(),
        tool,
        color: TOOL_COLORS[tool] ?? '#38bdf8',
        points: [p],
        text: tool === 'text' ? 'Note' : undefined,
      }
      finishDrawing(obj)
      return
    }

    draftRef.current = {
      id: uid(),
      tool,
      color: TOOL_COLORS[tool] ?? '#38bdf8',
      points: [p],
    }
    setDraftTick((n) => n + 1)
  }

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draftRef.current) return
    const p = pct(e)
    if (draftRef.current.points.length === 1) {
      draftRef.current.points.push(p)
    } else {
      draftRef.current.points[1] = p
    }
    setDraftTick((n) => n + 1)
  }

  const onMouseUp = () => {
    if (!draftRef.current) return
    if (draftRef.current.points.length >= 2) {
      finishDrawing(draftRef.current)
    } else {
      draftRef.current = null
    }
  }

  const onDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isController) return
    const target = (e.target as SVGElement).closest('[data-id]')
    const id = target?.getAttribute('data-id')
    if (id) {
      removeDrawing(id)
      emitDrawingDelete(id)
    }
  }

  const allDrawings = draftRef.current ? [...drawings, draftRef.current] : drawings

  return (
    <svg
      className="classroom-drawing-overlay"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onDoubleClick={onDoubleClick}
      style={{ pointerEvents: isController && activeTool !== 'select' ? 'auto' : 'none' }}
    >
      {allDrawings.map((d) => (
        <g key={`${d.id}-${draftTick}`} data-id={d.id}>
          {renderDrawing(d)}
        </g>
      ))}
    </svg>
  )
}

export function updateDrawingOnCanvas(d: DrawingObject) {
  emitDrawingUpdate(d)
  useClassroomStore.getState().upsertDrawing(d)
}
