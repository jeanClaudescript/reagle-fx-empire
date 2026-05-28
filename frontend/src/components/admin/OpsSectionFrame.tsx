import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, X } from 'lucide-react'
import { getAdminNavLabel } from '@/admin/layout/adminNav'
import type { AdminTab } from '@/admin/layout/adminNav'

export function OpsSectionFrame({
  tab,
  onBack,
  children,
  hint,
}: {
  tab: AdminTab
  onBack: () => void
  children: ReactNode
  hint?: string
}) {
  const title = getAdminNavLabel(tab)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="admin-section-frame"
    >
      <header className="admin-section-toolbar mb-4">
        <div className="admin-section-toolbar-top">
          <button type="button" onClick={onBack} className="admin-header-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-base font-bold text-theme-primary sm:text-lg">{title}</h2>
            <p className="text-xs text-theme-muted">{hint ?? 'Changes save immediately to the server.'}</p>
          </div>
          <button type="button" onClick={onBack} className="admin-header-icon-btn shrink-0" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>
      {children}
    </motion.div>
  )
}
