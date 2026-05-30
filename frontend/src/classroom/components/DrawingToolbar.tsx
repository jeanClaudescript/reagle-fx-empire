import {
  ArrowUpRight,
  Circle,
  Hash,
  Minus,
  MousePointer2,
  MoveHorizontal,
  MoveVertical,
  Square,
  TrendingUp,
  Type,
} from 'lucide-react'
import type { DrawingTool } from '../types'
import { useClassroomStore } from '../store/useClassroomStore'

const TOOLS: { id: DrawingTool; label: string; icon: typeof TrendingUp }[] = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'trendline', label: 'Trend', icon: TrendingUp },
  { id: 'hline', label: 'H-Line', icon: Minus },
  { id: 'vline', label: 'V-Line', icon: MoveVertical },
  { id: 'rectangle', label: 'Zone', icon: Square },
  { id: 'support', label: 'Support', icon: MoveHorizontal },
  { id: 'resistance', label: 'Resistance', icon: MoveHorizontal },
  { id: 'fibonacci', label: 'Fib', icon: Hash },
  { id: 'arrow', label: 'Arrow', icon: ArrowUpRight },
  { id: 'text', label: 'Text', icon: Type },
]

export function DrawingToolbar() {
  const activeTool = useClassroomStore((s) => s.activeTool)
  const setActiveTool = useClassroomStore((s) => s.setActiveTool)

  return (
    <div className="classroom-toolbar">
      {TOOLS.map((t) => {
        const Icon = t.icon
        return (
          <button
            key={t.id}
            type="button"
            className={`classroom-toolbar__btn${activeTool === t.id ? ' classroom-toolbar__btn--active' : ''}`}
            onClick={() => setActiveTool(t.id)}
            title={t.label}
          >
            <Icon size={16} />
          </button>
        )
      })}
      <span className="classroom-toolbar__hint">
        <Circle size={8} className="text-emerald-400" /> Live sync
      </span>
    </div>
  )
}
