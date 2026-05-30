import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown, Radio, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { GlowButton } from '@/components/ui/GlowButton'

const DISMISS_KEY = 'rfx_paid_popup_dismissed'

/** Welcome popup for paid students only — no upsell on the public homepage. */
export function PaidStudentPopup() {
  const { t } = useLanguage()
  const { isPaid, loading } = useStudentAccess()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (loading || !isPaid) return
    if (sessionStorage.getItem(DISMISS_KEY)) return
    const id = window.setTimeout(() => setOpen(true), 2200)
    return () => window.clearTimeout(id)
  }, [loading, isPaid])

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setOpen(false)
  }

  if (!isPaid) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="student-popup-shell" role="presentation">
          <motion.div
            className="student-popup-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />
          <motion.div
            className="student-popup fintech-card fintech-card--glow border-0"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            role="dialog"
            aria-modal
          >
            <button type="button" className="student-popup__close" onClick={dismiss} aria-label="Close">
              <X className="h-5 w-5" />
            </button>

            <div className="student-popup__glow" aria-hidden />

            <div className="student-popup__icon student-popup__icon--paid">
              <Crown className="h-10 w-10" />
            </div>
            <h3 className="font-display text-2xl font-bold text-theme-primary">{t.live.paidPopupTitle}</h3>
            <p className="mt-2 text-sm text-theme-muted">{t.live.paidPopupBody}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <GlowButton
                variant="primary"
                external={false}
                className="w-full"
                onClick={() => {
                  dismiss()
                  window.history.pushState({}, '', '/desk')
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
              >
                <Radio className="h-4 w-4" />
                {t.vip.openDesk}
              </GlowButton>
              <GlowButton
                variant="secondary"
                external={false}
                className="w-full"
                onClick={dismiss}
              >
                {t.vip.backToSite}
              </GlowButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
