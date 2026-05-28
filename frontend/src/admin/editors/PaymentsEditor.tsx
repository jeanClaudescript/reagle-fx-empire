import { useCallback, useEffect, useState } from 'react'
import { paymentApi, type PaymentRecord } from '@/services/api'
import { AdminCard } from '@/components/admin/AdminCard'
import { useAdminToast } from '@/admin/toast'

const statuses = ['ALL', 'PENDING', 'PAID', 'FAILED'] as const

function statusClass(status: PaymentRecord['status']) {
  if (status === 'PAID') return 'manage-badge--paid'
  if (status === 'FAILED' || status === 'EXPIRED') return 'manage-badge--unpaid'
  return 'manage-badge--unpaid'
}

export function PaymentsEditor({
  embedded = false,
  initialStatus = 'PENDING',
}: {
  embedded?: boolean
  initialStatus?: (typeof statuses)[number]
}) {
  const { push } = useAdminToast()
  const [items, setItems] = useState<PaymentRecord[]>([])
  const [status, setStatus] = useState<(typeof statuses)[number]>(initialStatus)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await paymentApi.adminList({ status, q })
      setItems(res.data)
    } catch {
      setItems([])
      push('Could not load payments (check API & admin key)', 'error')
    } finally {
      setLoading(false)
    }
  }, [status, q, push])

  useEffect(() => {
    void load()
  }, [load])

  const approve = async (p: PaymentRecord) => {
    let tx = p.transactionId
    if (!tx) {
      const entered = window.prompt('Transaction ID (optional but recommended):', '')
      if (entered === null) return
      tx = entered.trim() || undefined
    }
    try {
      await paymentApi.adminApprove(p.id, tx ? { transactionId: tx } : undefined)
      push('Payment approved — student access granted, referrer credited if applicable', 'success')
      void load()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Approve failed', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!embedded && (
        <AdminCard>
          <div className="admin-card-body">
            <p className="admin-editor-card-intro">Open the Settings tab for MoMo number and amounts.</p>
          </div>
        </AdminCard>
      )}

      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-base font-bold text-theme-primary">Payment queue</h3>
          <p className="admin-editor-card-intro mt-1">
            Match by <strong>reference code</strong>, phone, and amount. Users pay via USSD dial or manual
            MoMo transfer, then submit a transaction ID. Approve when verified — or use webhook{' '}
            <code className="text-xs">POST /api/payments/webhook/momo</code> for API confirmation.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label className="mb-1 block text-xs font-semibold text-theme-muted">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as (typeof statuses)[number])}
                className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-theme-muted">Search</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Phone, reference, transaction ID"
                className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
              />
            </div>
            <button type="button" className="admin-btn admin-btn--secondary" onClick={load}>
              Refresh
            </button>
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          {loading ? (
            <p className="text-sm text-theme-muted">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-theme-muted">No payments found.</p>
          ) : (
            <div className="mt-2 flex flex-col gap-3">
              {items.map((p) => (
                <div key={p.id} className="admin-editor-row flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-bold text-theme-accent">{p.referenceCode}</p>
                      <span className={`manage-badge ${statusClass(p.status)}`}>{p.status}</span>
                      {p.provider ? (
                        <span className="text-[10px] font-bold uppercase text-theme-muted">{p.provider}</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-theme-primary">
                      {p.displayPhone} · {p.amount.toLocaleString()} {p.currency}
                    </p>
                    <p className="text-xs text-theme-muted">
                      {p.transactionId ? `TX: ${p.transactionId}` : 'No transaction ID yet'}
                      {p.confirmedBy ? ` · confirmed by ${p.confirmedBy}` : ''}
                    </p>
                  </div>
                  {p.status === 'PENDING' && (
                    <div className="flex flex-col gap-2 sm:items-end">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="text-xs text-theme-muted">Amount</label>
                        <input
                          type="number"
                          min={100}
                          defaultValue={p.amount}
                          key={`${p.id}-${p.amount}`}
                          className="w-28 rounded-lg border border-theme bg-theme-elevated/60 px-2 py-1 text-sm"
                          onBlur={async (e) => {
                            const next = Number(e.target.value)
                            if (!Number.isFinite(next) || next === p.amount) return
                            try {
                              await paymentApi.adminUpdatePayment(p.id, { amount: next })
                              push('Amount updated', 'success')
                              void load()
                            } catch (err) {
                              push(err instanceof Error ? err.message : 'Update failed', 'error')
                            }
                          }}
                        />
                        <span className="text-xs text-theme-muted">{p.currency}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="admin-btn admin-btn--primary admin-btn--sm"
                          onClick={() => approve(p)}
                        >
                          Approve (manual)
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger admin-btn--sm"
                          onClick={async () => {
                            try {
                              await paymentApi.adminReject(p.id)
                              push('Payment rejected', 'info')
                              void load()
                            } catch {
                              push('Reject failed', 'error')
                            }
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  )
}
