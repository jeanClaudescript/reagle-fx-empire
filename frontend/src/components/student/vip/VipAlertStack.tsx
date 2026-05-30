import { BookOpen, MessageCircle, Target, X } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import type { VipToast } from '@/vip/useVipActivityFeed'
import type { VipPanelId } from '@/components/student/vip/VipDeskShell'

function iconFor(kind: VipToast['kind']) {
  switch (kind) {
    case 'signal':
      return Target
    case 'coach':
      return MessageCircle
    case 'book':
      return BookOpen
    default:
      return MessageCircle
  }
}

export function VipAlertStack({
  toasts,
  onDismiss,
  onOpen,
}: {
  toasts: VipToast[]
  onDismiss: (id: string) => void
  onOpen: (panelId: VipPanelId) => void
}) {
  const { t } = useLanguage()
  if (toasts.length === 0) return null

  return (
    <div className="vip-alert-stack" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = iconFor(toast.kind)
        return (
          <div key={toast.id} className={`vip-alert ${toast.kind === 'signal' ? 'vip-alert--signal' : ''}`}>
            <span className="vip-alert__icon">
              <Icon className="h-4 w-4" />
            </span>
            <button type="button" className="vip-alert__body" onClick={() => onOpen(toast.panelId)}>
              <p className="vip-alert__title">{toast.title}</p>
              <p className="vip-alert__preview">{toast.preview}</p>
              <span className="vip-alert__cta">{t.vip.alertTapOpen}</span>
            </button>
            <button type="button" className="vip-alert__close" onClick={() => onDismiss(toast.id)} aria-label={t.vip.dismissAlert}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
