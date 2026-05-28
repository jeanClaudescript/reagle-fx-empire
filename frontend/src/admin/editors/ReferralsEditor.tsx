import { useCallback, useEffect, useState } from 'react'
import { paymentApi, type ReferralRewardRecord } from '@/services/api'
import { AdminCard } from '@/components/admin/AdminCard'
import { useAdminToast } from '@/admin/toast'

export function ReferralsEditor() {
  const { push } = useAdminToast()
  const [items, setItems] = useState<ReferralRewardRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await paymentApi.adminReferrals()
      setItems(res.data)
    } catch {
      setItems([])
      push('Could not load referral rewards', 'error')
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <AdminCard>
      <div className="admin-card-body">
        <h3 className="font-display text-base font-bold text-theme-primary">Referral rewards</h3>
        <p className="admin-editor-card-intro mt-1">
          When a referred student pays for the first time, the referrer wallet is credited automatically
          (amount set in Payment settings).
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-theme-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-theme-muted">No referral rewards yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {items.map((r) => (
              <li key={r.id} className="admin-editor-row flex-col gap-1 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold text-theme-primary">
                    +{r.rewardAmount.toLocaleString()} {r.currency}
                  </p>
                  <p className="text-xs text-theme-muted">
                    {r.referrerName ?? `Referrer …${r.referrerId.slice(-6)}`} →{' '}
                    {r.referredName ?? `Student …${r.referredUserId.slice(-6)}`}
                  </p>
                </div>
                <span
                  className={`manage-badge ${r.status === 'CREDITED' ? 'manage-badge--paid' : 'manage-badge--unpaid'}`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminCard>
  )
}
