import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  push: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
    setItems((prev) => [...prev, { id, kind, message }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  const icon = (kind: ToastKind) => {
    if (kind === 'success') return <CheckCircle2 className="h-5 w-5 text-emerald-400" />
    if (kind === 'error') return <AlertCircle className="h-5 w-5 text-rose-400" />
    return <Info className="h-5 w-5 text-theme-accent" />
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-3 right-3 z-[200] flex flex-col items-stretch gap-2 pb-safe sm:left-auto sm:right-6 sm:items-end sm:max-w-sm">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl border border-theme bg-theme-surface/95 px-4 py-3 shadow-glass backdrop-blur-xl sm:max-w-sm"
            >
              {icon(t.kind)}
              <p className="text-sm font-medium text-theme-primary">{t.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useAdminToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useAdminToast must be used within AdminToastProvider')
  return ctx
}
