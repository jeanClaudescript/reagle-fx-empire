import { Eye, EyeOff, Upload } from 'lucide-react'
import { motion } from 'framer-motion'

interface AdminMobileActionBarProps {
  isHydrated: boolean
  showPreview: boolean
  publishLabel?: string
  onTogglePreview: () => void
  onSaveDraft: () => void
  onPublish: () => void
}

/** Sticky thumb-friendly actions for phones. */
export function AdminMobileActionBar({
  isHydrated,
  showPreview,
  publishLabel = 'Publish all',
  onTogglePreview,
  onSaveDraft,
  onPublish,
}: AdminMobileActionBarProps) {
  return (
    <div className="admin-mobile-action-bar lg:hidden">
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        className={`admin-mobile-bar-icon ${showPreview ? 'admin-mobile-bar-icon--active' : ''}`}
        onClick={onTogglePreview}
        aria-label={showPreview ? 'Hide preview' : 'Show preview'}
      >
        {showPreview ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </motion.button>
      <button
        type="button"
        className="admin-btn admin-btn--secondary flex-1"
        onClick={onSaveDraft}
        disabled={!isHydrated}
      >
        Save
      </button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        className="admin-btn admin-btn--primary flex-[1.2]"
        onClick={onPublish}
        disabled={!isHydrated}
      >
        <Upload className="h-4 w-4" />
        {publishLabel}
      </motion.button>
    </div>
  )
}
