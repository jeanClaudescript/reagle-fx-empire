import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { GlowButton } from '@/components/ui/GlowButton'
import { clearFreeAccountCreated, peekFreeAccountCreated } from '@/student/accountCreatedCelebration'

/** Shown once after a new free student account is created (signup or pay flow). */
export function AccountCreatedPopup() {
  const { t } = useLanguage()
  const sl = t.studentLogin
  const { loading, hasVipSession, accessMode } = useStudentAccess()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (loading || !hasVipSession) return
    if (accessMode === 'paid' || accessMode === 'promo') return
    if (!peekFreeAccountCreated()) return

    const id = window.setTimeout(() => setOpen(true), 400)
    return () => window.clearTimeout(id)
  }, [loading, hasVipSession, accessMode])

  const dismiss = () => {
    clearFreeAccountCreated()
    setOpen(false)
  }

  const goDesk = (hash?: string) => {
    dismiss()
    const path = hash ? `/desk${hash}` : '/desk'
    window.history.pushState({ freePanel: hash ? hash.replace('#panel=', '') : 'overview' }, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  if (!hasVipSession || accessMode === 'paid' || accessMode === 'promo') return null

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
            className="student-popup student-popup--celebrate"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            role="dialog"
            aria-modal
            aria-labelledby="account-created-title"
          >
            <span className="student-popup__confetti" aria-hidden />
            <button type="button" className="student-popup__close" onClick={dismiss} aria-label="Close">
              <X className="h-5 w-5" />
            </button>

            <div className="student-popup__glow student-popup__glow--celebrate" aria-hidden />

            <motion.span
              className="student-popup__badge student-popup__badge--new"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {sl.accountCreatedBadge}
            </motion.span>

            <motion.div
              className="student-popup__icon student-popup__icon--created"
              initial={{ scale: 0.6, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.05 }}
            >
              <span className="student-popup__icon-ring" aria-hidden />
              <Sparkles className="h-10 w-10" />
            </motion.div>

            <motion.h3
              id="account-created-title"
              className="font-display text-2xl font-bold text-theme-primary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              {sl.accountCreatedTitle}
            </motion.h3>
            <motion.p
              className="mt-2 text-sm leading-relaxed text-theme-muted"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              {sl.accountCreatedBody}
            </motion.p>

            <motion.ul
              className="student-popup__perks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.24 }}
            >
              {sl.accountCreatedPerks.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </motion.ul>

            <motion.div
              className="mt-6 flex flex-col gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlowButton variant="primary" external={false} className="w-full" onClick={() => goDesk()}>
                {sl.accountCreatedDeskCta}
              </GlowButton>
              <GlowButton
                variant="secondary"
                external={false}
                className="w-full"
                onClick={() => goDesk('#panel=community-chat')}
              >
                <MessageCircle className="h-4 w-4" />
                {sl.accountCreatedChatCta}
              </GlowButton>
              <button type="button" className="student-popup__later" onClick={dismiss}>
                {sl.accountCreatedLater}
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
