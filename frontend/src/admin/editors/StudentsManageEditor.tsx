import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  Clock,
  Copy,
  CreditCard,
  Share2,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import {
  paymentApi,
  studentApi,
  type PaymentSettings,
  type ReferralRewardRecord,
  type StudentRecord,
  type StudentStats,
} from '@/services/api'
import { AdminCard } from '@/components/admin/AdminCard'
import { PaymentsEditor } from '@/admin/editors/PaymentsEditor'
import { useAdminToast } from '@/admin/toast'

type Panel = 'paid' | 'unpaid' | 'pending' | 'referrals'

type CreateFormState = {
  name: string
  phone: string
  email: string
  referrerCode: string
  notes: string
  membershipStatus: 'paid' | 'unpaid'
}

function daysSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

function payLink(student: StudentRecord) {
  const params = new URLSearchParams()
  if (student.phone) params.set('phone', student.displayPhone ?? student.phone)
  if (student.email) params.set('email', student.email)
  if (student.referredByCode) params.set('ref', student.referredByCode)
  const qs = params.toString()
  return `${window.location.origin}/pay${qs ? `?${qs}` : ''}`
}

export function StudentsManageEditor() {
  const { push } = useAdminToast()
  const [panel, setPanel] = useState<Panel>('paid')
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [paid, setPaid] = useState<StudentRecord[]>([])
  const [unpaid, setUnpaid] = useState<StudentRecord[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [referrals, setReferrals] = useState<ReferralRewardRecord[]>([])
  const [paySettings, setPaySettings] = useState<PaymentSettings | null>(null)
  const [rewardDraft, setRewardDraft] = useState<number | ''>('')
  const [savingReward, setSavingReward] = useState(false)
  const [form, setForm] = useState<CreateFormState>({
    name: '',
    phone: '',
    email: '',
    referrerCode: '',
    notes: '',
    membershipStatus: 'unpaid',
  })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, paidRes, unpaidRes, refRes, settingsRes] = await Promise.all([
        studentApi.getStats(),
        studentApi.list({ status: 'paid', q }),
        studentApi.list({ status: 'unpaid', q }),
        paymentApi.adminReferrals(),
        paymentApi.adminGetSettings(),
      ])
      setStats(statsRes.data)
      setPaid(paidRes.data)
      setUnpaid(unpaidRes.data)
      setReferrals(refRes.data)
      setPaySettings(settingsRes.data)
      setRewardDraft(settingsRes.data.referralRewardAmount)
    } catch {
      push('Could not load students (check API & admin key)', 'error')
    } finally {
      setLoading(false)
    }
  }, [q, push])

  useEffect(() => {
    void load()
  }, [load])

  const lateUnpaid = useMemo(
    () => unpaid.filter((s) => s.pendingPayment && daysSince(s.pendingPayment.createdAt) >= 1),
    [unpaid],
  )

  const create = async () => {
    if (!form.phone.trim() && !form.email.trim()) {
      push('Enter phone and/or email', 'error')
      return
    }
    setSaving(true)
    try {
      await studentApi.create({
        name: form.name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        referrerCode: form.referrerCode.trim() || undefined,
        notes: form.notes.trim() || undefined,
        membershipStatus: form.membershipStatus,
      })
      push('Student created', 'success')
      setForm({ name: '', phone: '', email: '', referrerCode: '', notes: '', membershipStatus: 'unpaid' })
      setShowCreate(false)
      void load()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Create failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveReferralReward = async () => {
    if (!paySettings || rewardDraft === '') return
    setSavingReward(true)
    try {
      const res = await paymentApi.adminUpdateSettings({
        ...paySettings,
        referralRewardAmount: Number(rewardDraft),
      })
      setPaySettings(res.data)
      push('Referral reward amount updated', 'success')
      void load()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setSavingReward(false)
    }
  }

  const panels: { id: Panel; label: string; count?: number; tone?: string }[] = [
    { id: 'paid', label: 'Paid students', count: stats?.paidStudents, tone: 'emerald' },
    { id: 'unpaid', label: 'Unpaid students', count: stats?.unpaidStudents, tone: 'amber' },
    {
      id: 'pending',
      label: 'Pending / late pay',
      count: stats?.pendingPayments,
      tone: 'rose',
    },
    { id: 'referrals', label: 'Referrals & rewards', count: referrals.length },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatChip
          icon={BadgeCheck}
          label="Paid access"
          value={stats?.paidStudents ?? '—'}
          hint="Full toolkit + live room"
          tone="emerald"
        />
        <StatChip
          icon={Users}
          label="Unpaid"
          value={stats?.unpaidStudents ?? '—'}
          hint="Need payment or manual grant"
          tone="amber"
        />
        <StatChip
          icon={Clock}
          label="Pending MoMo"
          value={stats?.pendingPayments ?? '—'}
          hint={lateUnpaid.length ? `${lateUnpaid.length} waiting 24h+` : 'Awaiting approval'}
          tone="rose"
        />
        <StatChip
          icon={Wallet}
          label="Referral reward"
          value={
            stats
              ? `${stats.referralRewardAmount.toLocaleString()} ${stats.currency}`
              : '—'
          }
          hint="Per first paid referral"
          tone="purple"
        />
      </div>

      <AdminCard>
        <div className="admin-card-body">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-theme-primary">Student access control</h3>
              <p className="admin-editor-card-intro mt-1">
                Two groups: <strong className="text-emerald-400">paid</strong> (full access) and{' '}
                <strong className="text-amber-400">unpaid</strong> (marketing only). Approve payments or grant
                access manually.
              </p>
            </div>
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => setShowCreate((v) => !v)}>
              <UserPlus className="h-4 w-4" />
              {showCreate ? 'Close' : 'New student'}
            </button>
          </div>

          {showCreate && (
            <CreateStudentForm
              form={form}
              setForm={setForm}
              saving={saving}
              onCreate={create}
            />
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {panels.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`admin-hub-filter ${panel === p.id ? 'admin-hub-filter--active' : ''}`}
                onClick={() => setPanel(p.id)}
              >
                {p.label}
                {p.count != null ? ` (${p.count})` : ''}
              </button>
            ))}
          </div>

          {panel !== 'pending' && panel !== 'referrals' && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-theme-muted">Search</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Name, phone, email, referral code"
                  className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                />
              </div>
              <button type="button" className="admin-btn admin-btn--secondary" onClick={load}>
                Refresh
              </button>
            </div>
          )}
        </div>
      </AdminCard>

      {loading && panel !== 'pending' ? (
        <p className="text-sm text-theme-muted">Loading…</p>
      ) : null}

      {panel === 'paid' && !loading && (
        <StudentList
          emptyLabel="No paid students yet."
          students={paid}
          variant="paid"
          onChanged={load}
        />
      )}

      {panel === 'unpaid' && !loading && (
        <>
          {lateUnpaid.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
              <strong>{lateUnpaid.length}</strong> unpaid student(s) have a pending payment older than 24h — check{' '}
              <button type="button" className="font-bold underline" onClick={() => setPanel('pending')}>
                Pending / late pay
              </button>
              .
            </div>
          )}
          <StudentList
            emptyLabel="No unpaid students."
            students={unpaid}
            variant="unpaid"
            onChanged={load}
          />
        </>
      )}

      {panel === 'pending' && <PaymentsEditor embedded initialStatus="PENDING" />}

      {panel === 'referrals' && (
        <div className="flex flex-col gap-4">
          <AdminCard>
            <div className="admin-card-body">
              <div className="flex items-start gap-3">
                <Share2 className="h-5 w-5 shrink-0 text-theme-accent" />
                <div className="flex-1">
                  <h3 className="font-display font-bold text-theme-primary">Referral reward amount</h3>
                  <p className="mt-1 text-sm text-theme-muted">
                    Credited to referrer wallet when a referred student pays for the first time.
                  </p>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <label className="text-xs font-semibold text-theme-muted">
                      Amount ({paySettings?.currency ?? 'RWF'})
                      <input
                        type="number"
                        min={0}
                        value={rewardDraft}
                        onChange={(e) =>
                          setRewardDraft(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="mt-1 block w-36 rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={savingReward}
                      className="admin-btn admin-btn--primary"
                      onClick={saveReferralReward}
                    >
                      {savingReward ? 'Saving…' : 'Save reward amount'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <div className="admin-card-body">
              <h3 className="font-display font-bold text-theme-primary">Reward history</h3>
              {referrals.length === 0 ? (
                <p className="mt-3 text-sm text-theme-muted">No referral rewards yet.</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-2">
                  {referrals.map((r) => (
                    <li key={r.id} className="admin-editor-row flex-col gap-1 sm:flex-row sm:items-center">
                      <div className="text-sm">
                        <p className="font-semibold text-emerald-400">
                          +{r.rewardAmount.toLocaleString()} {r.currency}
                        </p>
                        <p className="text-xs text-theme-muted">
                          {r.referrerName ?? `Referrer …${r.referrerId.slice(-6)}`} →{' '}
                          {r.referredName ?? `Student …${r.referredUserId.slice(-6)}`} ·{' '}
                          {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="manage-badge manage-badge--paid">{r.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </AdminCard>

          <AdminCard>
            <div className="admin-card-body">
              <h3 className="font-display font-bold text-theme-primary">Top referrers (wallet)</h3>
              <p className="mt-1 text-sm text-theme-muted">Paid students with referral earnings.</p>
              <ul className="mt-4 flex flex-col gap-2">
                {[...paid]
                  .filter((s) => s.walletBalance > 0)
                  .sort((a, b) => b.walletBalance - a.walletBalance)
                  .slice(0, 15)
                  .map((s) => (
                    <li key={s.id} className="manage-student-mini">
                      <div>
                        <p className="text-sm font-semibold text-theme-primary">{s.name || 'Student'}</p>
                        <p className="text-xs text-theme-muted">Code {s.referralCode}</p>
                      </div>
                      <span className="font-mono text-sm font-bold text-theme-accent">
                        {s.walletBalance.toLocaleString()} {stats?.currency}
                      </span>
                    </li>
                  ))}
                {paid.every((s) => s.walletBalance <= 0) && (
                  <p className="text-sm text-theme-muted">No wallet balances yet.</p>
                )}
              </ul>
            </div>
          </AdminCard>
        </div>
      )}
    </div>
  )
}

function StatChip({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Users
  label: string
  value: string | number
  hint: string
  tone: 'emerald' | 'amber' | 'rose' | 'purple'
}) {
  const ring =
    tone === 'emerald'
      ? 'border-emerald-500/30 from-emerald-500/10'
      : tone === 'amber'
        ? 'border-amber-500/30 from-amber-500/10'
        : tone === 'rose'
          ? 'border-rose-500/30 from-rose-500/10'
          : 'border-empire-purple/30 from-empire-purple/10'
  return (
    <div className={`admin-stat-tile border bg-gradient-to-br to-transparent ${ring}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-theme-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-theme-primary">{value}</p>
          <p className="mt-1 text-xs text-theme-muted">{hint}</p>
        </div>
        <Icon className="h-8 w-8 shrink-0 opacity-70 text-theme-accent" />
      </div>
    </div>
  )
}

function CreateStudentForm({
  form,
  setForm,
  saving,
  onCreate,
}: {
  form: CreateFormState
  setForm: (value: CreateFormState | ((prev: CreateFormState) => CreateFormState)) => void
  saving: boolean
  onCreate: () => void
}) {
  return (
    <div className="mt-5 grid gap-3 rounded-2xl border border-theme bg-theme-surface/50 p-4 sm:grid-cols-2">
      <input
        placeholder="Full name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
      />
      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
      />
      <input
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
      />
      <input
        placeholder="Referral code used"
        value={form.referrerCode}
        onChange={(e) => setForm((f) => ({ ...f, referrerCode: e.target.value.toUpperCase() }))}
        className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
      />
      <textarea
        placeholder="Notes"
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        rows={2}
        className="sm:col-span-2 rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
      />
      <label className="sm:col-span-2 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.membershipStatus === 'paid'}
          onChange={(e) =>
            setForm((f) => ({ ...f, membershipStatus: e.target.checked ? 'paid' : 'unpaid' }))
          }
        />
        Create as paid (grant access immediately)
      </label>
      <button type="button" disabled={saving} className="admin-btn admin-btn--primary sm:col-span-2" onClick={onCreate}>
        {saving ? 'Creating…' : 'Create student'}
      </button>
    </div>
  )
}

function StudentList({
  students,
  variant,
  emptyLabel,
  onChanged,
}: {
  students: StudentRecord[]
  variant: 'paid' | 'unpaid'
  emptyLabel: string
  onChanged: () => void
}) {
  if (students.length === 0) {
    return (
      <AdminCard>
        <div className="admin-card-body">
          <p className="text-sm text-theme-muted">{emptyLabel}</p>
        </div>
      </AdminCard>
    )
  }

  return (
    <AdminCard>
      <div className="admin-card-body flex flex-col gap-3">
        {students.map((s) => (
          <StudentRow key={s.id} student={s} variant={variant} onChanged={onChanged} />
        ))}
      </div>
    </AdminCard>
  )
}

function StudentRow({
  student,
  variant,
  onChanged,
}: {
  student: StudentRecord
  variant: 'paid' | 'unpaid'
  onChanged: () => void
}) {
  const { push } = useAdminToast()
  const [editing, setEditing] = useState(false)
  const [walletEdit, setWalletEdit] = useState(String(student.walletBalance))
  const [name, setName] = useState(student.name ?? '')
  const [phone, setPhone] = useState(student.displayPhone ?? student.phone ?? '')
  const [email, setEmail] = useState(student.email ?? '')
  const [notes, setNotes] = useState(student.notes ?? '')

  const pending = student.pendingPayment
  const pendingDays = pending ? daysSince(pending.createdAt) : 0

  const copyPayLink = async () => {
    try {
      await navigator.clipboard.writeText(payLink(student))
      push('Pay link copied', 'success')
    } catch {
      push('Could not copy', 'error')
    }
  }

  const approvePending = async () => {
    if (!pending) return
    try {
      await paymentApi.adminApprove(pending.id, pending.transactionId ? { transactionId: pending.transactionId } : undefined)
      push('Payment approved — student is now paid', 'success')
      onChanged()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Approve failed', 'error')
    }
  }

  const saveWallet = async () => {
    const bal = Number(walletEdit)
    if (!Number.isFinite(bal) || bal < 0) {
      push('Invalid wallet amount', 'error')
      return
    }
    try {
      await studentApi.update(student.id, { walletBalance: bal })
      push('Wallet updated', 'success')
      onChanged()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Update failed', 'error')
    }
  }

  const saveProfile = async () => {
    try {
      await studentApi.update(student.id, { name, phone: phone.trim() || undefined, email: email.trim() || undefined, notes })
      push('Saved', 'success')
      setEditing(false)
      onChanged()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Save failed', 'error')
    }
  }

  return (
    <div
      className={`manage-student-row flex-col gap-3 lg:flex-row lg:items-start ${
        variant === 'paid' ? 'border-l-4 border-l-emerald-500/50' : 'border-l-4 border-l-amber-500/50'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-theme-primary">{student.name || 'Unnamed'}</p>
          <span
            className={`manage-badge ${variant === 'paid' ? 'manage-badge--paid' : 'manage-badge--unpaid'}`}
          >
            {variant === 'paid' ? 'PAID ACCESS' : 'UNPAID'}
          </span>
          {pending && variant === 'unpaid' && (
            <span className={`manage-badge ${pendingDays >= 1 ? 'manage-badge--unpaid' : ''} bg-amber-500/20 text-amber-300`}>
              PENDING {pendingDays}d
            </span>
          )}
        </div>

        {!editing ? (
          <>
            <p className="mt-1 text-sm text-theme-muted">
              {[student.displayPhone, student.email].filter(Boolean).join(' · ') || 'No contact'}
            </p>
            <p className="mt-1 text-xs text-theme-muted">
              Share code: <span className="font-mono text-theme-accent">{student.referralCode}</span>
              {student.referredByCode ? (
                <>
                  {' '}
                  · Invited by {student.referrerName ?? student.referredByCode} ({student.referredByCode})
                </>
              ) : null}
            </p>
            {variant === 'paid' && (
              <p className="mt-1 text-xs text-emerald-400/90">
                Paid {student.totalPaid.toLocaleString()} ({student.paymentCount} payment
                {student.paymentCount === 1 ? '' : 's'})
                {student.paidAt ? ` · since ${new Date(student.paidAt).toLocaleDateString()}` : ''}
              </p>
            )}
            {pending && variant === 'unpaid' && (
              <p className="mt-2 rounded-lg bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200/90">
                <CreditCard className="mr-1 inline h-3.5 w-3.5" />
                Pending {pending.amount.toLocaleString()} {pending.currency} · ref{' '}
                <span className="font-mono">{pending.referenceCode}</span>
                {pending.transactionId ? ` · TX ${pending.transactionId}` : ' · no TX yet'}
              </p>
            )}
            {student.notes ? <p className="mt-1 text-xs text-theme-muted">Note: {student.notes}</p> : null}
          </>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-lg border border-theme bg-theme-elevated/60 px-2 py-1.5 text-sm" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="rounded-lg border border-theme bg-theme-elevated/60 px-2 py-1.5 text-sm" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-theme bg-theme-elevated/60 px-2 py-1.5 text-sm sm:col-span-2" />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={2} className="sm:col-span-2 rounded-lg border border-theme bg-theme-elevated/60 px-2 py-1.5 text-sm" />
          </div>
        )}

        {variant === 'paid' && !editing && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-theme-muted">Referral wallet:</span>
            <input
              value={walletEdit}
              onChange={(e) => setWalletEdit(e.target.value)}
              className="w-24 rounded-lg border border-theme bg-theme-elevated/60 px-2 py-1 font-mono text-sm"
            />
            <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={saveWallet}>
              Set wallet
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
        {editing ? (
          <>
            <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" onClick={saveProfile}>
              Save
            </button>
            <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => setEditing(true)}>
              Edit
            </button>
            {variant === 'unpaid' && (
              <>
                <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={copyPayLink}>
                  <Copy className="h-3.5 w-3.5" />
                  Pay link
                </button>
                {pending && (
                  <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" onClick={approvePending}>
                    Approve payment
                  </button>
                )}
                <button
                  type="button"
                  className="admin-btn admin-btn--primary admin-btn--sm"
                  onClick={async () => {
                    try {
                      await studentApi.grantAccess(student.id)
                      push('Paid access granted (manual)', 'success')
                      onChanged()
                    } catch (e) {
                      push(e instanceof Error ? e.message : 'Failed', 'error')
                    }
                  }}
                >
                  Grant access
                </button>
              </>
            )}
            {variant === 'paid' && (
              <button
                type="button"
                className="admin-btn admin-btn--danger admin-btn--sm"
                onClick={async () => {
                  try {
                    await studentApi.revokeAccess(student.id)
                    push('Access revoked — now unpaid', 'info')
                    onChanged()
                  } catch (e) {
                    push(e instanceof Error ? e.message : 'Failed', 'error')
                  }
                }}
              >
                Revoke access
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
