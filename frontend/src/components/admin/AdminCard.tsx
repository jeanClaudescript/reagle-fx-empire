import type { ReactNode } from 'react'

export function AdminCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`glass-card-glow neon-border min-w-0 ${className}`}>{children}</div>
}

