import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { PaymentRecord } from '@/services/api'

export function PaymentApproveModal({
  payment,
  onClose,
  onConfirm,
}: {
  payment: PaymentRecord
  onClose: () => void
  onConfirm: (transactionId?: string) => void
}) {
  const [tx, setTx] = useState(payment.transactionId ?? '')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="admin-modal"
        role="dialog"
        aria-labelledby="approve-payment-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="approve-payment-title" className="font-display text-lg font-bold text-theme-primary">
              Approve payment
            </h3>
            <p className="mt-1 text-sm text-theme-muted">
              {payment.displayPhone} · {payment.amount.toLocaleString()} {payment.currency}
            </p>
            <p className="mt-0.5 font-mono text-xs text-theme-accent">{payment.referenceCode}</p>
          </div>
          <button type="button" className="admin-sidebar-icon-btn" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-xs font-semibold text-theme-muted">
            Transaction ID (optional but recommended)
          </span>
          <input
            autoFocus
            value={tx}
            onChange={(e) => setTx(e.target.value)}
            placeholder="MoMo transaction reference"
            className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2.5 text-sm"
          />
        </label>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="admin-btn admin-btn--secondary min-h-11" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary min-h-11"
            onClick={() => onConfirm(tx.trim() || undefined)}
          >
            Approve & grant access
          </button>
        </div>
      </div>
    </div>
  )
}
