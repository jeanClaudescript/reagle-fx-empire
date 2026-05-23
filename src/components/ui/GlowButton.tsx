import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface GlowButtonProps {
  href?: string
  onClick?: () => void
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'whatsapp'
  className?: string
  external?: boolean
}

export function GlowButton({
  href,
  onClick,
  children,
  variant = 'primary',
  className = '',
  external = true,
}: GlowButtonProps) {
  const base =
    'relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-300 sm:px-8 sm:py-4 sm:text-base'

  const variants = {
    primary:
      'bg-gradient-to-r from-empire-purple to-empire-blue text-white shadow-glow hover:shadow-glow-blue hover:scale-[1.02]',
    secondary:
      'border border-theme bg-theme-elevated/60 text-theme-primary backdrop-blur-sm hover:border-theme-accent/50 hover:bg-theme-accent/10',
    whatsapp:
      'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:scale-[1.02]',
  }

  const classes = `${base} ${variants[variant]} ${className}`

  const motionProps = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
  }

  if (href) {
    return (
      <motion.a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={classes}
        {...motionProps}
      >
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button type="button" onClick={onClick} className={classes} {...motionProps}>
      {children}
    </motion.button>
  )
}
