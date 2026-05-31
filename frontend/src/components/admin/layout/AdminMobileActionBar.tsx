import { Eye, EyeOff, Save, Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import type { AdminMobileBarMode } from '@/admin/layout/adminPageMode'

interface AdminMobileActionBarProps {
  mode: AdminMobileBarMode
  isHydrated: boolean
  showPreview: boolean
  publishLabel?: string
  onTogglePreview: () => void
  onSaveDraft?: () => void
  onPublish: () => void
}

/** Sticky thumb-friendly actions — context-aware by page type. */
export function AdminMobileActionBar({
  mode,
  isHydrated,
  showPreview,
  publishLabel = 'Publish website',
  onTogglePreview,
  onSaveDraft,
  onPublish,
}: AdminMobileActionBarProps) {
  if (mode === 'hidden') return null

  return (
    <div className="admin-mobile-action-bar lg:hidden">
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        className={`admin-btn admin-btn--secondary flex-1 ${showPreview ? 'border-theme-accent/40 text-theme-accent' : ''}`}
        onClick={onTogglePreview}
      >
        {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        Preview draft
      </motion.button>
      {mode === 'cms' && onSaveDraft ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          className="admin-btn admin-btn--secondary flex-1"
          onClick={onSaveDraft}
          disabled={!isHydrated}
        >
          <Save className="h-4 w-4" />
          Save
        </motion.button>
      ) : null}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        className="admin-btn admin-btn--primary flex-[1.15]"
        onClick={onPublish}
        disabled={!isHydrated}
      >
        <Upload className="h-4 w-4" />
        {publishLabel}
      </motion.button>
    </div>
  )
}
