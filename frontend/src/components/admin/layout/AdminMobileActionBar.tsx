import { Eye, EyeOff, Upload } from 'lucide-react'
import { motion } from 'framer-motion'

interface AdminMobileActionBarProps {
  isHydrated: boolean
  showPreview: boolean
  publishLabel?: string
  onTogglePreview: () => void
  onSaveDraft?: () => void
  onPublish: () => void
}

/** Sticky thumb-friendly actions for phones — Preview + Publish only (Save stays in header menu). */
export function AdminMobileActionBar({
  isHydrated,
  showPreview,
  publishLabel = 'Publish',
  onTogglePreview,
  onPublish,
}: AdminMobileActionBarProps) {
  return (
    <div className="admin-mobile-action-bar lg:hidden">
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        className={`admin-btn admin-btn--secondary flex-1 ${showPreview ? 'border-theme-accent/40 text-theme-accent' : ''}`}
        onClick={onTogglePreview}
      >
        {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        Preview
      </motion.button>
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
