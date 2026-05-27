import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

export type ConfirmVariant = 'default' | 'danger'

export type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
}

type ConfirmState = ConfirmOptions & {
  open: boolean
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function AdminConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setState({ ...options, open: true })
    })
  }, [])

  const close = useCallback((result: boolean) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setState((prev) => (prev ? { ...prev, open: false } : null))
    window.setTimeout(() => setState(null), 280)
  }, [])

  const value = useMemo(() => ({ confirm }), [confirm])

  const variant = state?.variant ?? 'default'
  const isDanger = variant === 'danger'

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {state?.open && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="admin-confirm-backdrop fixed inset-0 z-[300]"
              onClick={() => close(false)}
              aria-label="Close dialog"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-confirm-title"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="admin-confirm-panel fixed left-1/2 top-1/2 z-[310] w-[min(100%-2rem,420px)] -translate-x-1/2 -translate-y-1/2 p-6 sm:p-7"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                  isDanger ? 'bg-rose-500/15' : 'bg-theme-accent/15'
                }`}
              >
                <AlertTriangle
                  className={`h-6 w-6 ${isDanger ? 'text-rose-400' : 'text-theme-accent'}`}
                />
              </div>
              <h2
                id="admin-confirm-title"
                className="font-display text-xl font-bold text-theme-primary"
              >
                {state.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-theme-muted">{state.message}</p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="admin-btn-secondary min-h-11 w-full sm:w-auto"
                >
                  {state.cancelLabel ?? 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => close(true)}
                  className={`min-h-11 w-full rounded-xl px-5 text-sm font-semibold sm:w-auto ${
                    isDanger
                      ? 'bg-rose-500 text-white shadow-[0_0_24px_rgba(244,63,94,0.35)]'
                      : 'admin-btn-primary'
                  }`}
                >
                  {state.confirmLabel ?? 'Confirm'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}

export function useAdminConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useAdminConfirm must be used within AdminConfirmProvider')
  return ctx
}
