import { useEffect, useRef } from 'react'
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { CLASSROOM_SYMBOLS, CLASSROOM_TIMEFRAMES } from '@/classroom/types'
import { generateCandles, timeframeToMinutes } from '@/classroom/chart/generateCandles'
import { marketApi } from '@/services/api'

type Props = {
  symbol: string
  timeframe: string
  onSymbolChange: (symbol: string) => void
  onTimeframeChange: (timeframe: string) => void
  className?: string
}

function tfLabel(tf: string, t: ReturnType<typeof useLanguage>['t']) {
  if (tf === 'D') return t.tools.chartTfDaily
  return t.tools.chartTfMinutes.replace('{n}', tf)
}

export function DeskChart({ symbol, timeframe, onSymbolChange, onTimeframeChange, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const { isDark } = useTheme()
  const { t } = useLanguage()

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#0d1117' : '#ffffff' },
        textColor: isDark ? '#8b949e' : '#787b86',
      },
      grid: {
        vertLines: { color: isDark ? '#1c2128' : '#f0f3fa' },
        horzLines: { color: isDark ? '#1c2128' : '#f0f3fa' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: isDark ? '#30363d' : '#e0e3eb' },
      timeScale: { borderColor: isDark ? '#30363d' : '#e0e3eb', timeVisible: true },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: isDark ? '#26a69a' : '#089981',
      downColor: isDark ? '#ef5350' : '#f23645',
      borderVisible: false,
      wickUpColor: isDark ? '#26a69a' : '#089981',
      wickDownColor: isDark ? '#ef5350' : '#f23645',
    })

    chartRef.current = chart
    seriesRef.current = series

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
  }, [isDark])

  useEffect(() => {
    const series = seriesRef.current
    const chart = chartRef.current
    if (!series || !chart) return

    let cancelled = false
    const minutes = timeframeToMinutes(timeframe)
    const resolution = minutes >= 1440 ? 'D' : String(minutes)

    const load = async () => {
      try {
        const res = await marketApi.candles(symbol, resolution, 300)
        if (cancelled || res.data.length === 0) throw new Error('empty')
        const data = res.data.map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
        series.setData(data)
        chart.timeScale().fitContent()
      } catch {
        if (cancelled) return
        const data = generateCandles(symbol, 300, minutes) as CandlestickData<UTCTimestamp>[]
        series.setData(data)
        chart.timeScale().fitContent()
      }
    }

    void load()
    const poll = window.setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(poll)
    }
  }, [symbol, timeframe])

  return (
    <div className={`desk-chart ${className}`}>
      <div className="desk-chart__toolbar">
        <span className="live-dot h-2 w-2 rounded-full bg-emerald-400" />
        <select
          className="desk-chart__select"
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          aria-label={t.tools.pair}
        >
          {CLASSROOM_SYMBOLS.map((s) => (
            <option key={s} value={s}>
              {s.slice(0, 3)}/{s.slice(3)}
            </option>
          ))}
        </select>
        <select
          className="desk-chart__select"
          value={timeframe}
          onChange={(e) => onTimeframeChange(e.target.value)}
          aria-label={t.tools.chartTitle}
        >
          {CLASSROOM_TIMEFRAMES.map((tf) => (
            <option key={tf} value={tf}>
              {tfLabel(tf, t)}
            </option>
          ))}
        </select>
      </div>
      <div ref={containerRef} className="desk-chart__canvas" />
    </div>
  )
}
