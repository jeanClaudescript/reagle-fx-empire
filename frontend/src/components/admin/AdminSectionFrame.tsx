import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, X } from 'lucide-react'
import type { ContentSectionId } from '@/cms/validation'
import { getAdminNavLabel } from '@/admin/layout/adminNav'
import { useCms } from '@/cms/CmsProvider'
import { AdminModeBanner } from '@/components/admin/AdminModeBanner'
import { SectionEditorActions } from '@/components/admin/SectionEditorActions'
import { EditorValidationAlert } from '@/components/admin/EditorValidationAlert'

interface AdminSectionFrameProps {
  section: ContentSectionId
  onBack: () => void
  children: ReactNode
}

export function AdminSectionFrame({ section, onBack, children }: AdminSectionFrameProps) {
  const title = getAdminNavLabel(section)
  const { sectionStates } = useCms()
  const state = sectionStates[section]
  const bannerMode = state?.status === 'draft' ? 'draft' : 'live-sync'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="admin-section-frame"
    >
      <header className="admin-section-toolbar">
        <div className="admin-section-toolbar-top">
          <button
            type="button"
            onClick={onBack}
            className="admin-header-icon-btn shrink-0"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-base font-bold text-theme-primary sm:text-lg">
              {title}
            </h2>
            <p className="text-xs text-theme-muted">Website content · draft until you publish</p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="admin-header-icon-btn shrink-0"
            aria-label="Close section"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="admin-section-toolbar-actions">
          <SectionEditorActions section={section} />
        </div>

        <div className="admin-section-toolbar-meta">
          <EditorValidationAlert section={section} />
        </div>
      </header>

      <AdminModeBanner mode={bannerMode} />

      <div className="admin-section-body">{children}</div>
    </motion.div>
  )
}
