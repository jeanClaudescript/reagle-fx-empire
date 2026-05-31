import { useCallback, useEffect, useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { paymentApi, type PaymentRecord } from '@/services/api'
import { programPlanLabel } from '@/utils/paymentPriceLabel'
import { PaymentApproveModal } from '@/components/admin/PaymentApproveModal'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminCard } from '@/components/admin/AdminCard'
import { useAdminToast } from '@/admin/toast'

const statuses = ['ALL', 'PENDING', 'PAID', 'FAILED'] as const
const VIEW_KEY = 'reagle-admin-payments-view'

type PaymentsView = 'cards' | 'list'

function readView(): PaymentsView {
  try {
    const v = localStorage.getItem(VIEW_KEY)
    return v === 'list' ? 'list' : 'cards'
  } catch {
    return 'cards'
  }
}

function statusClass(status: PaymentRecord['status']) {
  if (status === 'PAID') return 'manage-badge--paid'
  if (status === 'FAILED' || status === 'EXPIRED') return 'manage-badge--unpaid'
  return 'manage-badge--unpaid'
}

function formatWhen(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function PaymentActions({
  payment: p,
  onApprove,
  onReject,
  onAmountSaved,
  onError,
  compact,
}: {
  payment: PaymentRecord
  onApprove: (p: PaymentRecord) => void
  onReject: (p: PaymentRecord) => void
  onAmountSaved: () => void
  onError: (msg: string) => void
  compact?: boolean
}) {
  if (p.status !== 'PENDING') return null

  return (
    <div className={`flex flex-col gap-2 ${compact ? '' : 'sm:items-end'}`}>
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
              onAmountSaved()
            } catch (err) {
              onError(err instanceof Error ? err.message : 'Update failed')
            }
          }}
        />
        <span className="text-xs text-theme-muted">{p.currency}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => onApprove(p)}>
          Approve
        </button>
        <button type="button" className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => onReject(p)}>
          Reject
        </button>
      </div>
    </div>
  )
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
  const [view, setView] = useState<PaymentsView>(readView)
  const [approveTarget, setApproveTarget] = useState<PaymentRecord | null>(null)

  const setPaymentsView = (next: PaymentsView) => {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      /* ignore */
    }
  }

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

  const approve = async (p: PaymentRecord, transactionId?: string) => {
    try {
      await paymentApi.adminApprove(p.id, transactionId ? { transactionId } : undefined)
      push('Payment approved — student access granted, referrer credited if applicable', 'success')
      setApproveTarget(null)
      void load()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Approve failed', 'error')
    }
  }

  const requestApprove = (p: PaymentRecord) => {
    if (p.transactionId) void approve(p, p.transactionId)
    else setApproveTarget(p)
  }

  const reject = async (p: PaymentRecord) => {
    try {
      await paymentApi.adminReject(p.id)
      push('Payment rejected', 'info')
      void load()
    } catch {
      push('Reject failed', 'error')
    }
  }

  return (
    <div className="admin-form-stack">
      {!embedded && (
        <AdminCard>
          <div className="admin-card-body">
            <p className="admin-editor-card-intro">
              Configure merchant number and plan amounts in <strong>MoMo settings</strong> (sidebar).
            </p>
          </div>
        </AdminCard>
      )}

      <AdminCard>
        <div className="admin-card-body">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-theme-primary">Payment queue</h3>
              <p className="admin-editor-card-intro mt-1">
                Match by <strong>reference code</strong>, phone, and amount. Users pay via USSD dial or manual MoMo
                transfer, then submit a transaction ID. Approve when verified — or use webhook{' '}
                <code className="text-xs">POST /api/payments/webhook/momo</code> for API confirmation.
              </p>
            </div>
            <div className="admin-payments-view-toggle shrink-0" role="group" aria-label="Payment list layout">
              <button
                type="button"
                className={view === 'list' ? 'active' : ''}
                onClick={() => setPaymentsView('list')}
                aria-pressed={view === 'list'}
                title="List view"
              >
                <List size={16} />
                <span>List</span>
              </button>
              <button
                type="button"
                className={view === 'cards' ? 'active' : ''}
                onClick={() => setPaymentsView('cards')}
                aria-pressed={view === 'cards'}
                title="Card view"
              >
                <LayoutGrid size={16} />
                <span>Cards</span>
              </button>
            </div>
          </div>

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
            <AdminEmptyState
              title="No payments in queue"
              description="When students pay via MoMo and submit a transaction ID, they appear here for you to approve."
            />
          ) : view === 'list' ? (
            <div className="mt-2 overflow-x-auto">
              <table className="admin-payments-table w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Status</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Plan</th>
                    <th>Transaction</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <p className="font-mono text-xs font-bold text-theme-accent">{p.referenceCode}</p>
                        {p.provider ? (
                          <p className="mt-0.5 text-[10px] font-bold uppercase text-theme-muted">{p.provider}</p>
                        ) : null}
                      </td>
                      <td>
                        <span className={`manage-badge ${statusClass(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="text-theme-primary">{p.displayPhone}</td>
                      <td className="whitespace-nowrap font-semibold text-theme-primary">
                        {p.amount.toLocaleString()} {p.currency}
                      </td>
                      <td className="text-theme-muted">{programPlanLabel(p.programType) ?? '—'}</td>
                      <td>
                        <p className="font-mono text-xs text-theme-muted">
                          {p.transactionId ?? '—'}
                        </p>
                        {p.confirmedBy ? (
                          <p className="mt-0.5 text-[10px] text-theme-muted">by {p.confirmedBy}</p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap text-xs text-theme-muted">{formatWhen(p.createdAt)}</td>
                      <td>
                        {p.status === 'PENDING' ? (
                          <PaymentActions
                            payment={p}
                            compact
                            onApprove={requestApprove}
                            onReject={(row) => void reject(row)}
                            onAmountSaved={() => {
                              push('Amount updated', 'success')
                              void load()
                            }}
                            onError={(msg) => push(msg, 'error')}
                          />
                        ) : (
                          <span className="text-xs text-theme-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                      {programPlanLabel(p.programType) ? (
                        <span className="text-theme-muted"> · {programPlanLabel(p.programType)}</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-theme-muted">
                      {p.transactionId ? `TX: ${p.transactionId}` : 'No transaction ID yet'}
                      {p.confirmedBy ? ` · confirmed by ${p.confirmedBy}` : ''}
                      {` · ${formatWhen(p.createdAt)}`}
                    </p>
                  </div>
                  <PaymentActions
                    payment={p}
                    onApprove={requestApprove}
                    onReject={(row) => void reject(row)}
                    onAmountSaved={() => {
                      push('Amount updated', 'success')
                      void load()
                    }}
                    onError={(msg) => push(msg, 'error')}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminCard>

      {approveTarget ? (
        <PaymentApproveModal
          payment={approveTarget}
          onClose={() => setApproveTarget(null)}
          onConfirm={(tx) => void approve(approveTarget, tx)}
        />
      ) : null}
    </div>
  )
}
