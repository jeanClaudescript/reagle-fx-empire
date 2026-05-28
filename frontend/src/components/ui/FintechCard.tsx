import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type FintechCardProps = {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  href?: string
  target?: string
  rel?: string
}

const motionProps = {
  whileHover: { y: -6, scale: 1.01 } as const,
  whileTap: { scale: 0.99 } as const,
  transition: { type: 'spring' as const, stiffness: 400, damping: 28 },
}

export function FintechCard({
  children,
  className = '',
  hover = true,
  glow = false,
  href,
  target,
  rel,
}: FintechCardProps) {
  const cardClass = `fintech-card ${glow ? 'fintech-card--glow' : ''} ${className}`
  const hoverMotion = hover ? motionProps : {}

  const inner = (
    <>
      <div className="fintech-card__shine" aria-hidden />
      {children}
    </>
  )

  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={rel}
        {...hoverMotion}
        className={`${cardClass} block no-underline`}
      >
        {inner}
      </motion.a>
    )
  }

  return (
    <motion.div {...hoverMotion} className={cardClass}>
      {inner}
    </motion.div>
  )
}
