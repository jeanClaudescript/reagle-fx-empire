import type { ReactNode } from 'react'
import { AdminCardHeader } from '@/components/admin/AdminField'

export function AdminCard({
  children,
  className = '',
  title,
  description,
  action,
}: {
  children: ReactNode
  className?: string
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className={`admin-card glass-card-glow min-w-0 ${className}`}>
      {title ? <AdminCardHeader title={title} description={description} action={action} /> : null}
      {children}
    </div>
  )
}
