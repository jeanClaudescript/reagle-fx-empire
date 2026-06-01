import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import type { ContentSectionId } from '@/cms/validation'
import { useCmsValidation } from '@/admin/CmsValidationContext'

interface AdminSectionFrameProps {
  section: ContentSectionId
  onBack: () => void
  children: ReactNode
}

export function AdminSectionFrame({ section, onBack, children }: AdminSectionFrameProps) {
  const { issuesForSection } = useCmsValidation()
  const issues = issuesForSection(section)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="admin-section-frame admin-section-frame--minimal"
    >
      <motion.button
        type="button"
        onClick={onBack}
        className="admin-section-back-fab"
        aria-label="Back to dashboard"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.94 }}
      >
        <motion.span
          className="admin-section-back-fab__icon"
          animate={{ x: [0, -4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </motion.span>
      </motion.button>

      <div className="admin-section-body admin-section-body--minimal">
        {issues.length > 0 ? (
          <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <ul className="list-disc space-y-1 pl-4 text-sm text-theme-muted">
                {issues.map((issue) => (
                  <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
        {children}
      </div>
    </motion.div>
  )
}
