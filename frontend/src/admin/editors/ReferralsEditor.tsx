import { useCallback, useEffect, useState } from 'react'
import { paymentApi, type ReferralRelationshipRecord, type ReferralRewardRecord } from '@/services/api'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminCard } from '@/components/admin/AdminCard'
import { useAdminToast } from '@/admin/toast'

function formatContact(row: ReferralRelationshipRecord) {
  return row.referredPhone || row.referredEmail || row.referredName
}

export function ReferralsEditor() {
  const { push } = useAdminToast()
  const [rewards, setRewards] = useState<ReferralRewardRecord[]>([])
  const [relationships, setRelationships] = useState<ReferralRelationshipRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rewardsRes, relRes] = await Promise.all([
        paymentApi.adminReferrals(),
        paymentApi.adminReferralRelationships(),
      ])
      setRewards(rewardsRes.data)
      setRelationships(relRes.data)
    } catch {
      setRewards([])
      setRelationships([])
      push('Could not load referral data', 'error')
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="admin-form-stack">
      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-base font-bold text-theme-primary">Who invited whom</h3>
          <p className="admin-editor-card-intro mt-1">
            Referral credit is granted only after a referred student&apos;s first payment is confirmed.
            Paying without an invite code does not count. Self-referrals are blocked.
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-theme-muted">Loading…</p>
          ) : relationships.length === 0 ? (
            <AdminEmptyState
              title="No referrals yet"
              description="When a student signs up with a friend's invite code and pays, they appear here automatically."
            />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="pb-2 pr-3 font-semibold text-theme-muted">Invited by</th>
                    <th className="pb-2 pr-3 font-semibold text-theme-muted">New student</th>
                    <th className="pb-2 pr-3 font-semibold text-theme-muted">Code used</th>
                    <th className="pb-2 pr-3 font-semibold text-theme-muted">Payment</th>
                    <th className="pb-2 font-semibold text-theme-muted">Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {relationships.map((row) => (
                    <tr key={row.id} className="border-t border-theme">
                      <td className="py-2.5 pr-3 align-top">
                        <p className="font-semibold text-theme-primary">
                          {row.referrerName ?? 'Unknown'}
                        </p>
                        <p className="text-xs text-theme-muted">
                          {row.referrerPhone ?? row.referrerCode ?? row.referrerId?.slice(-6)}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3 align-top">
                        <p className="font-semibold text-theme-primary">{formatContact(row)}</p>
                        <p className="text-xs text-theme-muted">{row.membershipStatus}</p>
                      </td>
                      <td className="py-2.5 pr-3 align-top font-mono text-xs">{row.referredByCode ?? '—'}</td>
                      <td className="py-2.5 pr-3 align-top">
                        {row.hasPaidPayment ? (
                          <span className="manage-badge manage-badge--paid">Paid</span>
                        ) : (
                          <span className="manage-badge manage-badge--unpaid">Not paid</span>
                        )}
                        {row.paymentReference ? (
                          <p className="mt-1 font-mono text-[10px] text-theme-muted">{row.paymentReference}</p>
                        ) : null}
                      </td>
                      <td className="py-2.5 align-top">
                        {row.reward ? (
                          <div>
                            <span className="manage-badge manage-badge--paid">{row.reward.status}</span>
                            <p className="mt-1 text-xs font-semibold text-emerald-400">
                              +{row.reward.amount.toLocaleString()} {row.reward.currency}
                            </p>
                          </div>
                        ) : row.hasPaidPayment ? (
                          <span className="text-xs text-amber-400">Pending review</span>
                        ) : (
                          <span className="text-xs text-theme-muted">—</span>
                        )}
                        {row.suspicious ? (
                          <p className="mt-1 text-[10px] font-semibold text-rose-400">Suspicious</p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-base font-bold text-theme-primary">Reward payouts</h3>
          <p className="admin-editor-card-intro mt-1">
            Wallet credits issued after confirmed first payments (amount set in MoMo settings).
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-theme-muted">Loading…</p>
          ) : rewards.length === 0 ? (
            <AdminEmptyState
              title="No rewards issued yet"
              description="Rewards appear after a referred student's first payment is approved in Payments."
            />
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {rewards.map((r) => (
                <li key={r.id} className="admin-editor-row flex-col gap-1 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-theme-primary">
                      +{r.rewardAmount.toLocaleString()} {r.currency}
                    </p>
                    <p className="text-xs text-theme-muted">
                      {r.referrerName ?? `Referrer …${r.referrerId.slice(-6)}`}
                      {r.referrerCode ? ` (${r.referrerCode})` : ''} invited{' '}
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
    </div>
  )
}
