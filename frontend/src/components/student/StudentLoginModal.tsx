import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { StudentLoginPanel, type StudentAuthMode } from '@/components/auth/StudentLoginPanel'
import { AdminLoginPanel } from '@/components/auth/AdminLoginPanel'

export function StudentLoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage()
  const [studentMode, setStudentMode] = useState<StudentAuthMode>('login')
  const [adminOpen, setAdminOpen] = useState(false)
  const logoTaps = useRef({ count: 0, lastAt: 0 })

  const onLogoTap = () => {
    const now = Date.now()
    if (now - logoTaps.current.lastAt > 900) logoTaps.current.count = 1
    else logoTaps.current.count += 1
    logoTaps.current.lastAt = now
    if (logoTaps.current.count >= 5) {
      setAdminOpen(true)
      logoTaps.current.count = 0
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="auth-modal-root">
          <motion.button
            type="button"
            className="auth-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-label="Close"
          />
          <motion.div
            className="auth-modal-panel"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            role="dialog"
            aria-modal
          >
            <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </button>

            {adminOpen ? (
              <div className="auth-modal-panel__scroll">
                <AdminLoginPanel showLogo onLogoTap={onLogoTap} />
                <button
                  type="button"
                  className="auth-text-link mx-auto mt-4 block"
                  onClick={() => setAdminOpen(false)}
                >
                  ← {t.authPage.backToStudent}
                </button>
              </div>
            ) : (
              <>
                <div className="auth-tabs auth-tabs--modal">
                  <button
                    type="button"
                    className={`auth-tab ${studentMode === 'login' ? 'auth-tab--active' : ''}`}
                    onClick={() => setStudentMode('login')}
                  >
                    {t.authPage.tabLogin}
                  </button>
                  <button
                    type="button"
                    className={`auth-tab ${studentMode === 'signup' ? 'auth-tab--active' : ''}`}
                    onClick={() => setStudentMode('signup')}
                  >
                    {t.authPage.tabSignup}
                  </button>
                </div>

                <div className="auth-modal-panel__scroll">
                  <StudentLoginPanel
                    mode={studentMode}
                    onSwitchMode={setStudentMode}
                    showLogo
                    onLogoTap={onLogoTap}
                    onDone={onClose}
                  />
                </div>
              </>
            )}

            <p className="auth-modal-fullpage">
              <button
                type="button"
                className="text-sm font-medium text-theme-accent hover:underline"
                onClick={() => {
                  onClose()
                  const q = studentMode === 'signup' ? '?mode=signup' : ''
                  window.history.pushState({}, '', `/login${q}`)
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
              >
                {t.authPage.openFullPage}
              </button>
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
