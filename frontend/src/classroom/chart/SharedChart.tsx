import { useEffect, useRef } from 'react'
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type UTCTimestamp,
} from 'lightweight-charts'
import { generateCandles, timeframeToMinutes } from './generateCandles'
import { useClassroomStore } from '../store/useClassroomStore'
import { emitChartRange, emitCursorMove } from '../socket/classroomSocket'

type Props = {
  readOnly?: boolean
  onChartReady?: (api: IChartApi, series: ISeriesApi<'Candlestick'>) => void
}

export function SharedChart({ readOnly = false, onChartReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const symbol = useClassroomStore((s) => s.symbol)
  const timeframe = useClassroomStore((s) => s.timeframe)
  const role = useClassroomStore((s) => s.role)
  const isController = role === 'teacher' || role === 'moderator'

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f1419' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#334155' },
      timeScale: { borderColor: '#334155', timeVisible: true },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    chartRef.current = chart
    seriesRef.current = series
    onChartReady?.(chart, series)

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [onChartReady])

  useEffect(() => {
    const series = seriesRef.current
    const chart = chartRef.current
    if (!series || !chart) return

    const minutes = timeframeToMinutes(timeframe)
    const data = generateCandles(symbol, 300, minutes) as CandlestickData<UTCTimestamp>[]
    series.setData(data)
    chart.timeScale().fitContent()
  }, [symbol, timeframe])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart || readOnly || !isController) return

    const onMove = () => {
      const range = chart.timeScale().getVisibleLogicalRange()
      if (range) {
        emitChartRange({ from: range.from, to: range.to })
      }
    }

    chart.timeScale().subscribeVisibleLogicalRangeChange(onMove)
    return () => chart.timeScale().unsubscribeVisibleLogicalRangeChange(onMove)
  }, [readOnly, isController])

  useEffect(() => {
    const el = containerRef.current
    if (!el || readOnly || !isController) return

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      emitCursorMove(x, y)
    }

    el.addEventListener('mousemove', onMouseMove)
    return () => el.removeEventListener('mousemove', onMouseMove)
  }, [readOnly, isController])

  return <div ref={containerRef} className="classroom-chart" />
}
