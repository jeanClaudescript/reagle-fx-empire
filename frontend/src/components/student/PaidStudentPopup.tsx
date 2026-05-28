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

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="student-popup-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />
          <motion.div
            className="student-popup fintech-card fintech-card--glow border-0"
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            role="dialog"
            aria-modal
          >
            <button type="button" className="student-popup__close" onClick={dismiss} aria-label="Close">
              <X className="h-5 w-5" />
            </button>

            <div className="student-popup__glow" aria-hidden />

            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="student-popup__icon student-popup__icon--paid"
            >
              <Crown className="h-10 w-10" />
            </motion.div>
            <h3 className="font-display text-2xl font-bold text-theme-primary">{t.live.paidPopupTitle}</h3>
            <p className="mt-2 text-sm text-theme-muted">{t.live.paidPopupBody}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <GlowButton
                variant="primary"
                external={false}
                className="w-full"
                onClick={() => {
                  dismiss()
                  document.getElementById('live')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <Radio className="h-4 w-4" />
                {t.live.joinLive}
              </GlowButton>
              <GlowButton
                variant="secondary"
                external={false}
                className="w-full"
                onClick={() => {
                  dismiss()
                  document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                {t.live.openTools}
              </GlowButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
