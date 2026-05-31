import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useEngagement } from '@/engagement/EngagementProvider'
import type { VipPanelId } from '@/components/student/vip/VipDeskShell'

type Props = {
  onNavigate?: (panel: VipPanelId) => void
}

export function LiveToastNotifications({ onNavigate }: Props) {
  const { toasts, dismissToast } = useEngagement()

  return (
    <div className="engagement-toasts">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            type="button"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            className="engagement-toast"
            onClick={() => {
              if (toast.panelId && onNavigate) onNavigate(toast.panelId)
              dismissToast(toast.id)
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-left">
                <p className="font-semibold text-theme-primary">{toast.title}</p>
                <p className="mt-1 text-xs text-theme-muted line-clamp-2">{toast.body}</p>
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  dismissToast(toast.id)
                }}
                onKeyDown={() => dismissToast(toast.id)}
              >
                <X className="h-4 w-4 text-theme-muted" />
              </span>
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
