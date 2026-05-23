import { motion } from 'framer-motion'

const candles = [
  { x: 8, h: 45, body: 28, bullish: true },
  { x: 16, h: 60, body: 20, bullish: false },
  { x: 24, h: 35, body: 32, bullish: true },
  { x: 32, h: 70, body: 25, bullish: true },
  { x: 40, h: 50, body: 18, bullish: false },
  { x: 48, h: 80, body: 40, bullish: true },
  { x: 56, h: 55, body: 22, bullish: false },
  { x: 64, h: 65, body: 35, bullish: true },
  { x: 72, h: 40, body: 28, bullish: true },
  { x: 80, h: 75, body: 30, bullish: false },
  { x: 88, h: 58, body: 38, bullish: true },
  { x: 96, h: 48, body: 24, bullish: true },
]

export function CandlestickChart({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-full w-full opacity-30 ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="chartGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0,70 Q25,50 50,55 T100,40"
        fill="none"
        stroke="url(#chartGlow)"
        strokeWidth="0.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      />
      {candles.map((c, i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          style={{ transformOrigin: `${c.x}% 100%` }}
        >
          <line
            x1={c.x}
            y1={100 - c.h}
            x2={c.x}
            y2={100 - c.h + c.body}
            stroke={c.bullish ? '#10b981' : '#ef4444'}
            strokeWidth="0.3"
            opacity="0.6"
          />
          <rect
            x={c.x - 1.5}
            y={100 - c.h + (c.h - c.body) / 2}
            width="3"
            height={c.body * 0.4}
            fill={c.bullish ? '#10b981' : '#ef4444'}
            opacity="0.8"
            rx="0.5"
          />
        </motion.g>
      ))}
    </svg>
  )
}
