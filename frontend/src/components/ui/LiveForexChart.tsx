import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { useLiveCandles, type OHLC } from '@/hooks/useLiveCandles'

/** TradingView / MT5-style palette */
interface ChartTheme {
  bg: string
  grid: string
  gridBold: string
  text: string
  bull: string
  bullBorder: string
  bear: string
  bearBorder: string
  priceLine: string
  priceLabelBg: string
  priceLabelText: string
  toolbar: string
  volume: string
}

function getChartTheme(isDark: boolean): ChartTheme {
  if (isDark) {
    return {
      bg: '#0d1117',
      grid: '#1c2128',
      gridBold: '#30363d',
      text: '#8b949e',
      bull: '#26a69a',
      bullBorder: '#2dd4bf',
      bear: '#ef5350',
      bearBorder: '#f87171',
      priceLine: '#2962ff',
      priceLabelBg: '#2962ff',
      priceLabelText: '#ffffff',
      toolbar: '#161b22',
      volume: 'rgba(38, 166, 154, 0.35)',
    }
  }
  return {
    bg: '#ffffff',
    grid: '#f0f3fa',
    gridBold: '#e0e3eb',
    text: '#787b86',
    bull: '#089981',
    bullBorder: '#089981',
    bear: '#f23645',
    bearBorder: '#f23645',
    priceLine: '#2962ff',
    priceLabelBg: '#2962ff',
    priceLabelText: '#ffffff',
    toolbar: '#f8f9fd',
    volume: 'rgba(8, 153, 129, 0.25)',
  }
}

function drawForexCandle(
  ctx: CanvasRenderingContext2D,
  c: OHLC,
  slotX: number,
  slotW: number,
  y: (p: number) => number,
  theme: ChartTheme,
  forming = 1,
) {
  const gap = slotW * 0.28
  const bodyW = Math.max(slotW - gap, 2)
  const cx = slotX + slotW / 2
  const bx = slotX + gap / 2

  const open = c.open
  const close = c.open + (c.close - c.open) * forming
  const isBull = close >= open

  const highY = y(c.high)
  const lowY = y(c.low)
  const openY = y(open)
  const closeY = y(close)

  const color = isBull ? theme.bull : theme.bear
  const border = isBull ? theme.bullBorder : theme.bearBorder

  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cx, highY)
  ctx.lineTo(cx, lowY)
  ctx.stroke()

  const top = Math.min(openY, closeY)
  const bottom = Math.max(openY, closeY)
  const height = Math.max(bottom - top, 1)

  ctx.fillStyle = color
  ctx.strokeStyle = border
  ctx.lineWidth = isBull ? 0 : 1

  if (isBull) {
    ctx.fillRect(bx, top, bodyW, height)
  } else {
    ctx.fillRect(bx, top, bodyW, height)
    if (height > 1.5) {
      ctx.strokeRect(bx + 0.5, top + 0.5, bodyW - 1, height - 1)
    }
  }
}

function pseudoVolume(c: OHLC) {
  return Math.abs(c.close - c.open) + (c.high - c.low) * 0.5
}

interface LiveForexChartProps {
  className?: string
  compact?: boolean
  showHud?: boolean
}

export function LiveForexChart({
  className = '',
  compact = false,
  showHud = true,
}: LiveForexChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { isDark } = useTheme()
  const { candles, live, formProgress, pair, lastPrice, change, isBullish } = useLiveCandles()

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const visibleCount = compact ? 28 : 36

    const draw = () => {
      const rect = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = rect.width
      const h = rect.height

      if (w <= 0 || h <= 0) {
        raf = requestAnimationFrame(draw)
        return
      }

      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const theme = getChartTheme(isDark)
      const toolbarH = showHud ? (compact ? 36 : 40) : 8
      const priceAxisW = compact ? 52 : 58
      const timeAxisH = compact ? 18 : 22
      const volH = compact ? 28 : 36

      const pad = {
        t: toolbarH + 4,
        r: priceAxisW,
        b: timeAxisH + volH,
        l: 6,
      }

      const chartW = w - pad.l - pad.r
      const priceH = h - pad.t - pad.b
      const volTop = h - pad.b + 4

      const allCandles = [...candles, live]
      const slice = allCandles.slice(-visibleCount)
      const forming = 0.12 + formProgress * 0.88

      let min = Infinity
      let max = -Infinity
      for (const c of slice) {
        min = Math.min(min, c.low)
        max = Math.max(max, c.high)
      }
      const range = max - min || 0.0005
      min -= range * 0.06
      max += range * 0.06

      const yPrice = (p: number) => pad.t + priceH - volH - ((p - min) / (max - min)) * (priceH - volH)

      ctx.fillStyle = theme.bg
      ctx.fillRect(0, 0, w, h)

      if (showHud) {
        ctx.fillStyle = theme.toolbar
        ctx.fillRect(0, 0, w, toolbarH)
        ctx.strokeStyle = theme.gridBold
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, toolbarH)
        ctx.lineTo(w, toolbarH)
        ctx.stroke()
      }

      const gridN = compact ? 5 : 6
      for (let i = 0; i <= gridN; i++) {
        const y = pad.t + ((priceH - volH) / gridN) * i
        ctx.strokeStyle = i === gridN ? theme.gridBold : theme.grid
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(pad.l, y)
        ctx.lineTo(w - pad.r, y)
        ctx.stroke()

        const price = max - ((max - min) / gridN) * i
        ctx.fillStyle = theme.text
        ctx.font = `500 ${compact ? 9 : 10}px ui-monospace, monospace`
        ctx.textAlign = 'left'
        ctx.fillText(price.toFixed(5), w - pad.r + 6, y + 3)
      }

      const slotW = chartW / slice.length
      const maxVol = Math.max(...slice.map(pseudoVolume), 0.00001)

      slice.forEach((c, i) => {
        const slotX = pad.l + i * slotW
        const isLive = i === slice.length - 1
        drawForexCandle(ctx, c, slotX, slotW, yPrice, theme, isLive ? forming : 1)

        const vol = pseudoVolume(c)
        const volBarH = (vol / maxVol) * (volH - 6)
        const vx = slotX + slotW * 0.2
        const vw = slotW * 0.6
        const bullish = c.close >= c.open
        ctx.fillStyle = bullish ? theme.volume : 'rgba(239, 83, 80, 0.35)'
        ctx.fillRect(vx, volTop + volH - volBarH, vw, volBarH)
      })

      const lastY = yPrice(live.close)
      ctx.strokeStyle = theme.priceLine
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(pad.l, lastY)
      ctx.lineTo(w - pad.r, lastY)
      ctx.stroke()
      ctx.setLineDash([])

      const label = lastPrice.toFixed(5)
      ctx.font = `600 ${compact ? 9 : 10}px ui-monospace, monospace`
      const lw = ctx.measureText(label).width + 10
      ctx.fillStyle = theme.priceLabelBg
      const lx = w - pad.r + 2
      const ly = lastY - 9
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath()
        ctx.roundRect(lx, ly, lw, 18, 3)
        ctx.fill()
      } else {
        ctx.fillRect(lx, ly, lw, 18)
      }
      ctx.fillStyle = theme.priceLabelText
      ctx.textAlign = 'left'
      ctx.fillText(label, w - pad.r + 7, lastY + 4)

      ctx.strokeStyle = theme.gridBold
      ctx.beginPath()
      ctx.moveTo(pad.l, h - pad.b)
      ctx.lineTo(w - pad.r, h - pad.b)
      ctx.stroke()

      const timeLabels = ['09:00', '12:00', '15:00', '18:00']
      ctx.fillStyle = theme.text
      ctx.font = `400 ${compact ? 8 : 9}px ui-monospace, monospace`
      ctx.textAlign = 'center'
      timeLabels.forEach((lbl, i) => {
        const x = pad.l + (chartW / (timeLabels.length - 1)) * i
        ctx.fillText(lbl, x, h - 6)
      })

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [candles, live, formProgress, isDark, compact, showHud, isBullish, lastPrice])

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`chart-terminal-forex relative overflow-hidden ${className}`}
    >
      {showHud && (
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#26a69a] sm:h-2 sm:w-2" />
            <span className="font-mono text-[11px] font-bold text-theme-primary sm:text-xs">
              {pair}
            </span>
            <span className="rounded border border-theme bg-theme-elevated/80 px-1.5 py-0.5 font-mono text-[9px] font-medium text-theme-muted">
              M1
            </span>
          </div>
          <div className="hidden items-center gap-1.5 font-mono text-[10px] sm:flex sm:text-xs">
            <span className="text-theme-muted">O</span>
            <span className="font-semibold text-theme-primary">{live.open.toFixed(5)}</span>
            <span className="text-[#089981] dark:text-[#26a69a]">H {live.high.toFixed(5)}</span>
            <span className="text-[#f23645] dark:text-[#ef5350]">L {live.low.toFixed(5)}</span>
          </div>
          <span
            className={`font-mono text-[11px] font-bold tabular-nums sm:text-xs ${
              isBullish ? 'text-[#089981] dark:text-[#26a69a]' : 'text-[#f23645] dark:text-[#ef5350]'
            }`}
          >
            {lastPrice.toFixed(5)}
            <span className="ml-1 text-[10px] opacity-80">
              ({isBullish ? '+' : ''}
              {change.toFixed(2)}%)
            </span>
          </span>
        </div>
      )}
      <canvas ref={canvasRef} className="block h-full w-full" aria-label={`${pair} live chart`} />
    </motion.div>
  )
}
