import { motion } from 'framer-motion'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { GripVertical, RotateCcw } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { LiveForexChart } from '@/components/ui/LiveForexChart'
import { GlowButton } from '@/components/ui/GlowButton'
import { MarketWatch } from '@/components/forex/tools/MarketWatch'
import { SessionClock } from '@/components/forex/tools/SessionClock'
import { PipCalculator } from '@/components/forex/tools/PipCalculator'
import { PositionSizeCalculator } from '@/components/forex/tools/PositionSizeCalculator'
import { RiskRewardCalculator } from '@/components/forex/tools/RiskRewardCalculator'
import { MarginCalculator } from '@/components/forex/tools/MarginCalculator'
import { BreakEvenCalculator } from '@/components/forex/tools/BreakEvenCalculator'
import { CompoundingCalculator } from '@/components/forex/tools/CompoundingCalculator'
import { PaperTradingDesk } from '@/components/forex/tools/PaperTradingDesk'
import { LiveSignalBoard } from '@/components/forex/tools/LiveSignalBoard'
import { PivotCalculator } from '@/components/forex/tools/PivotCalculator'
import { FibonacciCalculator } from '@/components/forex/tools/FibonacciCalculator'
import { LotConverter } from '@/components/forex/tools/LotConverter'
import { TradeJournal } from '@/components/forex/tools/TradeJournal'
import { EconomicCalendar } from '@/components/forex/tools/EconomicCalendar'

export type ToolId =
  | 'watch'
  | 'signals'
  | 'session'
  | 'calendar'
  | 'chart'
  | 'pip'
  | 'position'
  | 'rr'
  | 'margin'
  | 'breakeven'
  | 'compound'
  | 'lots'
  | 'pivot'
  | 'fib'
  | 'journal'
  | 'paper'

export type ToolCategory = 'all' | 'market' | 'risk' | 'analysis' | 'live'

const DEFAULT_ORDER: ToolId[] = [
  'watch',
  'signals',
  'session',
  'calendar',
  'chart',
  'position',
  'rr',
  'pip',
  'margin',
  'breakeven',
  'compound',
  'lots',
  'pivot',
  'fib',
  'journal',
  'paper',
]

const STORAGE_KEY = 'rfx_tool_layout_v3'

const TOOL_CATEGORY: Record<ToolId, Exclude<ToolCategory, 'all'>> = {
  watch: 'market',
  session: 'market',
  calendar: 'market',
  signals: 'live',
  chart: 'live',
  paper: 'live',
  pip: 'risk',
  position: 'risk',
  rr: 'risk',
  margin: 'risk',
  breakeven: 'risk',
  compound: 'risk',
  lots: 'risk',
  pivot: 'analysis',
  fib: 'analysis',
  journal: 'analysis',
}

const SPAN: Record<ToolId, string> = {
  watch: 'forex-bento__watch',
  signals: 'forex-bento__signals',
  session: 'forex-bento__session',
  calendar: 'forex-bento__calendar',
  chart: 'forex-bento__chart',
  pip: 'forex-bento__pip',
  position: 'forex-bento__position',
  rr: 'forex-bento__rr',
  margin: 'forex-bento__margin',
  breakeven: 'forex-bento__breakeven',
  compound: 'forex-bento__compound',
  lots: 'forex-bento__lots',
  pivot: 'forex-bento__pivot',
  fib: 'forex-bento__fib',
  journal: 'forex-bento__journal',
  paper: 'forex-bento__paper',
}

function ChartWidget() {
  const { t } = useLanguage()
  return (
    <div className="forex-tool-card flex h-full min-h-[280px] flex-col">
      <h3 className="forex-tool-card__title">{t.tools.chartTitle}</h3>
      <p className="forex-tool-card__desc">{t.tools.chartDesc}</p>
      <div className="mt-4 min-h-0 flex-1">
        <LiveForexChart className="h-full min-h-[200px] w-full rounded-xl" compact />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <GlowButton href="/pay" variant="primary" external={false} className="text-sm">
          {t.tools.ctaPay}
        </GlowButton>
        <GlowButton
          variant="secondary"
          external={false}
          className="text-sm"
          onClick={() => document.getElementById('live')?.scrollIntoView({ behavior: 'smooth' })}
        >
          {t.live.joinLive}
        </GlowButton>
      </div>
    </div>
  )
}

function buildWidgets(): Record<ToolId, ReactNode> {
  return {
    watch: <MarketWatch />,
    signals: <LiveSignalBoard />,
    session: <SessionClock />,
    calendar: <EconomicCalendar />,
    chart: <ChartWidget />,
    pip: <PipCalculator />,
    position: <PositionSizeCalculator />,
    rr: <RiskRewardCalculator />,
    margin: <MarginCalculator />,
    breakeven: <BreakEvenCalculator />,
    compound: <CompoundingCalculator />,
    lots: <LotConverter />,
    pivot: <PivotCalculator />,
    fib: <FibonacciCalculator />,
    journal: <TradeJournal />,
    paper: <PaperTradingDesk />,
  }
}

const VALID_IDS = new Set<ToolId>(DEFAULT_ORDER)

export function ArrangeableToolsGrid({ category = 'all' }: { category?: ToolCategory }) {
  const { t } = useLanguage()
  const [order, setOrder] = useState<ToolId[]>(DEFAULT_ORDER)
  const [dragId, setDragId] = useState<ToolId | null>(null)
  const widgets = buildWidgets()

  const visibleOrder =
    category === 'all' ? order : order.filter((id) => TOOL_CATEGORY[id] === category)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as ToolId[]
      if (Array.isArray(parsed) && parsed.every((id) => VALID_IDS.has(id))) {
        const missing = DEFAULT_ORDER.filter((id) => !parsed.includes(id))
        setOrder([...parsed, ...missing])
      }
    } catch {
      /* ignore */
    }
  }, [])

  const persist = useCallback((next: ToolId[]) => {
    setOrder(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const onDrop = (targetId: ToolId) => {
    if (!dragId || dragId === targetId) return
    const next = [...order]
    const from = next.indexOf(dragId)
    const to = next.indexOf(targetId)
    next.splice(from, 1)
    next.splice(to, 0, dragId)
    persist(next)
    setDragId(null)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-theme-muted">{t.tools.dragHint}</p>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl border border-theme px-3 py-1.5 text-xs font-semibold text-theme-primary"
          onClick={() => persist(DEFAULT_ORDER)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t.tools.resetLayout}
        </button>
      </div>

      <div className="forex-bento forex-bento--arrangeable">
        {visibleOrder.length === 0 ? (
          <p className="col-span-full rounded-2xl border border-dashed border-theme px-6 py-12 text-center text-sm text-theme-muted">
            {t.tools.catEmpty}
          </p>
        ) : null}
        {visibleOrder.map((id) => (
          <motion.div
            key={id}
            layout
            whileHover={dragId ? undefined : { y: -4 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className={`forex-bento-item ${SPAN[id]} ${dragId === id ? 'forex-bento-item--dragging' : ''}`}
            draggable
            onDragStart={() => setDragId(id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(id)}
          >
            <div className="forex-bento-item__handle" title={t.tools.dragHandle}>
              <GripVertical className="h-4 w-4" />
            </div>
            {widgets[id]}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
