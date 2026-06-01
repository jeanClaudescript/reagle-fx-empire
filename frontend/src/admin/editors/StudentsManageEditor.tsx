import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Copy,
  CreditCard,
  Download,
  Share2,
  Trash2,
  UserPlus,
} from 'lucide-react'
import {
  paymentApi,
  studentApi,
  type PaymentSettings,
  type ReferralRewardRecord,
  type StudentRecord,
  type StudentStats,
} from '@/services/api'
import { programPlanLabel } from '@/utils/paymentPriceLabel'
import { AdminCard } from '@/components/admin/AdminCard'
import { PaymentsEditor } from '@/admin/editors/PaymentsEditor'
import { useAdminToast } from '@/admin/toast'
import { useAdminConfirm } from '@/admin/confirm'

type Panel = 'all' | 'paid' | 'unpaid' | 'regular' | 'pending' | 'referrals'
type ExportStatus = 'all' | 'paid' | 'unpaid' | 'regular'

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

function studentLabel(student: StudentRecord) {
  return student.name || student.displayPhone || student.email || 'this student'
}

function isRegularStudent(student: StudentRecord) {
  return student.membershipStatus === 'unpaid' && !student.pendingPayment && student.paymentCount === 0
}

function matchesStudentSearch(student: StudentRecord, q: string) {
  const term = q.trim().toLowerCase()
  if (!term) return true
  const digits = term.replace(/\D/g, '')
  return (
    (student.name?.toLowerCase().includes(term) ?? false) ||
    (student.email?.toLowerCase().includes(term) ?? false) ||
    student.referralCode.toLowerCase().includes(term) ||
    (digits.length >= 3 &&
      ((student.phone?.includes(digits) ?? false) ||
        (student.displayPhone?.includes(digits) ?? false)))
  )
}

function sortStudentsByDate(list: StudentRecord[]) {
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function upsertStudent(list: StudentRecord[], student: StudentRecord, include: boolean) {
  const without = list.filter((row) => row.id !== student.id)
  if (!include) return without
  return sortStudentsByDate([student, ...without])
}

type StudentListSync = {
  applyStudent: (student: StudentRecord) => void
  removeStudent: (id: string) => void
  refreshStats: () => Promise<void>
}

export function StudentsManageEditor() {
  const { push } = useAdminToast()
  const { confirm } = useAdminConfirm()
  const [panel, setPanel] = useState<Panel>('all')
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [allStudents, setAllStudents] = useState<StudentRecord[]>([])
  const [paid, setPaid] = useState<StudentRecord[]>([])
  const [unpaid, setUnpaid] = useState<StudentRecord[]>([])
  const [regular, setRegular] = useState<StudentRecord[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [referrals, setReferrals] = useState<ReferralRewardRecord[]>([])
  const [paySettings, setPaySettings] = useState<PaymentSettings | null>(null)
  const [rewardDraft, setRewardDraft] = useState<number | ''>('')
  const [pointsDraft, setPointsDraft] = useState<number | ''>('')
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
  const searchReady = useRef(false)

  const applyStudent = useCallback(
    (student: StudentRecord) => {
      const isPaid = student.membershipStatus === 'paid'
      const regular = isRegularStudent(student)
      const unpaid = !isPaid && !regular
      const inSearch = matchesStudentSearch(student, q)
      setAllStudents((prev) => upsertStudent(prev, student, inSearch))
      setPaid((prev) => upsertStudent(prev, student, isPaid && inSearch))
      setRegular((prev) => upsertStudent(prev, student, regular && inSearch))
      setUnpaid((prev) => upsertStudent(prev, student, unpaid && inSearch))
    },
    [q],
  )

  const removeStudentFromLists = useCallback((id: string) => {
    const drop = (prev: StudentRecord[]) => prev.filter((row) => row.id !== id)
    setAllStudents(drop)
    setPaid(drop)
    setRegular(drop)
    setUnpaid(drop)
  }, [])

  const refreshStats = useCallback(async () => {
    try {
      const statsRes = await studentApi.getStats()
      setStats(statsRes.data)
    } catch {
      /* keep previous counts */
    }
  }, [])

  const listSync = useMemo<StudentListSync>(
    () => ({ applyStudent, removeStudent: removeStudentFromLists, refreshStats }),
    [applyStudent, removeStudentFromLists, refreshStats],
  )

  const reloadListsQuiet = useCallback(async () => {
    try {
      const [statsRes, allRes, paidRes, unpaidRes, regularRes] = await Promise.all([
        studentApi.getStats(),
        studentApi.list({ status: 'all', q }),
        studentApi.list({ status: 'paid', q }),
        studentApi.list({ status: 'unpaid', q }),
        studentApi.list({ status: 'regular', q }),
      ])
      setStats(statsRes.data)
      setAllStudents(allRes.data)
      setPaid(paidRes.data)
      setUnpaid(unpaidRes.data)
      setRegular(regularRes.data)
    } catch {
      push('Could not refresh students', 'error')
    }
  }, [q, push])

  const loadInitial = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, allRes, paidRes, unpaidRes, regularRes, refRes, settingsRes] = await Promise.all([
        studentApi.getStats(),
        studentApi.list({ status: 'all', q }),
        studentApi.list({ status: 'paid', q }),
        studentApi.list({ status: 'unpaid', q }),
        studentApi.list({ status: 'regular', q }),
        paymentApi.adminReferrals(),
        paymentApi.adminGetSettings(),
      ])
      setStats(statsRes.data)
      setAllStudents(allRes.data)
      setPaid(paidRes.data)
      setUnpaid(unpaidRes.data)
      setRegular(regularRes.data)
      setReferrals(refRes.data)
      setPaySettings(settingsRes.data)
      setRewardDraft(settingsRes.data.referralRewardAmount)
      setPointsDraft(settingsRes.data.referralPointsPerSignup ?? 25)
    } catch {
      push('Could not load students (check API & admin key)', 'error')
    } finally {
      setLoading(false)
    }
  }, [q, push])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  useEffect(() => {
    if (loading) return
    if (!searchReady.current) {
      searchReady.current = true
      return
    }
    const timer = window.setTimeout(() => void reloadListsQuiet(), 320)
    return () => window.clearTimeout(timer)
  }, [q, loading, reloadListsQuiet])

  const lateUnpaid = useMemo(
    () => unpaid.filter((s) => s.pendingPayment && daysSince(s.pendingPayment.createdAt) >= 1),
    [unpaid],
  )

  const create = async () => {
    if (!form.phone.trim() && !form.email.trim()) {
      push('Enter phone and/or email', 'error')
      return
    }
    const ok = await confirm({
      title: 'Create student',
      message: `Add ${form.name.trim() || form.phone.trim() || form.email.trim() || 'new student'} to the database?`,
      confirmLabel: 'Create',
    })
    if (!ok) return

    setSaving(true)
    try {
      const res = await studentApi.create({
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
      applyStudent(res.data)
      void refreshStats()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Create failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const downloadReport = async (status: ExportStatus) => {
    try {
      await studentApi.downloadExport({ status, q })
      push(`Downloaded ${status} students CSV`, 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Download failed', 'error')
    }
  }

  const saveReferralReward = async () => {
    if (!paySettings || rewardDraft === '' || pointsDraft === '') return
    setSavingReward(true)
    try {
      const res = await paymentApi.adminUpdateSettings({
        ...paySettings,
        referralRewardAmount: Number(rewardDraft),
        referralPointsPerSignup: Number(pointsDraft),
      })
      setPaySettings(res.data)
      push('Referral reward amount updated', 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setSavingReward(false)
    }
  }

  const panels: { id: Panel; label: string; count?: number; tone?: string }[] = [
    { id: 'all', label: 'All students', count: stats?.totalStudents },
    { id: 'paid', label: 'Paid', count: stats?.paidStudents, tone: 'emerald' },
    { id: 'unpaid', label: 'Not paid', count: stats?.unpaidStudents, tone: 'amber' },
    { id: 'regular', label: 'Regular (free)', count: stats?.regularStudents, tone: 'sky' },
    {
      id: 'pending',
      label: 'Pending MoMo',
      count: stats?.pendingPayments,
      tone: 'rose',
    },
    { id: 'referrals', label: 'Referrals & rewards', count: referrals.length },
  ]

  return (
    <div className="admin-form-stack">
      <div className="admin-stat-grid">
        <StatChip
          label="Paid access"
          value={stats?.paidStudents ?? '—'}
          tone="emerald"
        />
        <StatChip
          label="Unpaid"
          value={stats?.unpaidStudents ?? '—'}
          tone="amber"
        />
        <StatChip
          label="Pending MoMo"
          value={stats?.pendingPayments ?? '—'}
          tone="rose"
        />
        <StatChip
          label="Referral reward"
          value={
            stats
              ? `${stats.referralRewardAmount.toLocaleString()} ${stats.currency}`
              : '—'
          }
          tone="purple"
        />
      </div>

      <AdminCard>
        <div className="admin-card-body">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-theme-primary">Student access control</h3>
              <p className="admin-editor-card-intro mt-1">
                <strong className="text-emerald-400">Paid</strong> = VIP desk ·{' '}
                <strong className="text-sky-400">Regular</strong> = free account (referrer earns points) ·{' '}
                <strong className="text-amber-400">Not paid</strong> = started MoMo but not approved yet.
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
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {(['all', 'paid', 'unpaid', 'regular'] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    className="admin-btn admin-btn--secondary admin-btn--sm"
                    onClick={() => void downloadReport(kind)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download {kind}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-theme-muted">Search</label>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Name, phone, email, referral code"
                    className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => void reloadListsQuiet()}
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </AdminCard>

      {loading && panel !== 'pending' ? (
        <p className="text-sm text-theme-muted">Loading…</p>
      ) : null}

      {panel === 'all' && !loading && (
        <StudentList
          emptyLabel="No students yet."
          students={allStudents}
          variant="unpaid"
          sync={listSync}
          membershipDays={paySettings?.membershipDays ?? 60}
          autoTrialDays={paySettings?.autoTrialDays ?? 7}
        />
      )}

      {panel === 'regular' && !loading && (
        <StudentList
          emptyLabel="No regular (free) students yet."
          students={regular}
          variant="unpaid"
          sync={listSync}
          membershipDays={paySettings?.membershipDays ?? 60}
          autoTrialDays={paySettings?.autoTrialDays ?? 7}
        />
      )}

      {panel === 'paid' && !loading && (
        <StudentList
          emptyLabel="No paid students yet."
          students={paid}
          variant="paid"
          sync={listSync}
          membershipDays={paySettings?.membershipDays ?? 60}
          autoTrialDays={paySettings?.autoTrialDays ?? 7}
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
            sync={listSync}
            membershipDays={paySettings?.membershipDays ?? 60}
            autoTrialDays={paySettings?.autoTrialDays ?? 7}
          />
        </>
      )}

      {panel === 'pending' && <PaymentsEditor embedded initialStatus="PENDING" />}

      {panel === 'referrals' && (
        <div className="admin-form-stack">
          <AdminCard>
            <div className="admin-card-body">
              <div className="flex items-start gap-3">
                <Share2 className="h-5 w-5 shrink-0 text-theme-accent" />
                <div className="flex-1">
                  <h3 className="font-display font-bold text-theme-primary">Referral reward amount</h3>
                  <p className="mt-1 text-sm text-theme-muted">
                    <strong>Regular signup:</strong> referrer earns points (coins).{' '}
                    <strong>First VIP payment:</strong> referrer gets cash in wallet — no cash for free-only invites.
                  </p>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <label className="text-xs font-semibold text-theme-muted">
                      Points per free signup
                      <input
                        type="number"
                        min={0}
                        value={pointsDraft}
                        onChange={(e) =>
                          setPointsDraft(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="mt-1 block w-36 rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-semibold text-theme-muted">
                      Cash when they pay ({paySettings?.currency ?? 'RWF'})
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
                      {savingReward ? 'Saving…' : 'Save referral rules'}
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
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
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
    <div className={`admin-stat-tile admin-stat-tile--compact border bg-gradient-to-br to-transparent ${ring}`}>
      <p className="admin-stat-tile__label">{label}</p>
      <p className="admin-stat-tile__value">{value}</p>
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
  sync,
  membershipDays,
  autoTrialDays,
}: {
  students: StudentRecord[]
  variant: 'paid' | 'unpaid'
  emptyLabel: string
  sync: StudentListSync
  membershipDays: number
  autoTrialDays: number
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
          <StudentRow
            key={s.id}
            student={s}
            variant={variant}
            sync={sync}
            membershipDays={membershipDays}
            autoTrialDays={autoTrialDays}
          />
        ))}
      </div>
    </AdminCard>
  )
}

function GrantAccessPanel({
  student,
  membershipDays,
  autoTrialDays,
  sync,
  onClose,
}: {
  student: StudentRecord
  membershipDays: number
  autoTrialDays: number
  sync: StudentListSync
  onClose: () => void
}) {
  const { push } = useAdminToast()
  const { confirm } = useAdminConfirm()
  const [customDays, setCustomDays] = useState(String(autoTrialDays || 7))
  const [busy, setBusy] = useState(false)

  const grant = async (days: number) => {
    const ok = await confirm({
      title: 'Grant VIP access',
      message: `Give ${studentLabel(student)} ${days} day${days === 1 ? '' : 's'} of VIP desk access?`,
      confirmLabel: `Grant ${days} days`,
    })
    if (!ok) return

    setBusy(true)
    try {
      const res = await studentApi.grantAccess(student.id, { days })
      push(`Access granted for ${days} days`, 'success')
      sync.applyStudent(res.data)
      void sync.refreshStats()
      onClose()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-2 flex w-full flex-col gap-2 rounded-xl border border-theme bg-theme-elevated/40 p-3">
      <p className="text-xs font-semibold text-theme-muted">Grant VIP access</p>
      <div className="admin-student-actions">
        {[autoTrialDays || 7, 14, 30, membershipDays].filter((d, i, a) => a.indexOf(d) === i).map((d) => (
          <button
            key={d}
            type="button"
            disabled={busy}
            className="admin-btn admin-btn--secondary"
            onClick={() => void grant(d)}
          >
            {d}d{d === membershipDays ? ' full' : ''}
          </button>
        ))}
      </div>
      <div className="admin-student-actions">
        <input
          type="number"
          min={1}
          max={365}
          value={customDays}
          onChange={(e) => setCustomDays(e.target.value)}
          className="admin-student-actions__wallet flex-1"
          aria-label="Custom days"
        />
        <button
          type="button"
          disabled={busy}
          className="admin-btn admin-btn--primary"
          onClick={() => {
            const d = Number(customDays)
            if (!Number.isFinite(d) || d < 1) {
              push('Enter valid days (1–365)', 'error')
              return
            }
            void grant(d)
          }}
        >
          Custom days
        </button>
        <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

function StudentRow({
  student,
  variant,
  sync,
  membershipDays,
  autoTrialDays,
}: {
  student: StudentRecord
  variant: 'paid' | 'unpaid'
  sync: StudentListSync
  membershipDays: number
  autoTrialDays: number
}) {
  const { push } = useAdminToast()
  const { confirm } = useAdminConfirm()
  const [editing, setEditing] = useState(false)
  const [grantOpen, setGrantOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [walletEdit, setWalletEdit] = useState(String(student.walletBalance))
  const [name, setName] = useState(student.name ?? '')
  const [phone, setPhone] = useState(student.displayPhone ?? student.phone ?? '')
  const [email, setEmail] = useState(student.email ?? '')
  const [notes, setNotes] = useState(student.notes ?? '')

  useEffect(() => {
    setName(student.name ?? '')
    setPhone(student.displayPhone ?? student.phone ?? '')
    setEmail(student.email ?? '')
    setNotes(student.notes ?? '')
    setWalletEdit(String(student.walletBalance))
  }, [student])

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
    const ok = await confirm({
      title: 'Approve payment',
      message: `Approve ${pending.amount.toLocaleString()} ${pending.currency} for ${studentLabel(student)}? They will get VIP access.`,
      confirmLabel: 'Approve payment',
    })
    if (!ok) return
    try {
      await paymentApi.adminApprove(
        pending.id,
        pending.transactionId ? { transactionId: pending.transactionId } : undefined,
      )
      const refreshed = await studentApi.get(student.id)
      sync.applyStudent(refreshed.data)
      void sync.refreshStats()
      push('Payment approved — student is now paid', 'success')
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
    const ok = await confirm({
      title: 'Update wallet',
      message: `Set referral wallet for ${studentLabel(student)} to ${bal.toLocaleString()}?`,
      confirmLabel: 'Update wallet',
    })
    if (!ok) return
    try {
      const res = await studentApi.update(student.id, { walletBalance: bal })
      sync.applyStudent(res.data)
      push('Wallet updated', 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Update failed', 'error')
    }
  }

  const saveProfile = async () => {
    const ok = await confirm({
      title: 'Save student',
      message: `Save profile changes for ${studentLabel(student)}?`,
      confirmLabel: 'Save changes',
    })
    if (!ok) return
    try {
      const res = await studentApi.update(student.id, {
        name,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes,
      })
      sync.applyStudent(res.data)
      push('Saved', 'success')
      setEditing(false)
    } catch (e) {
      push(e instanceof Error ? e.message : 'Save failed', 'error')
    }
  }

  const removeStudent = async () => {
    const ok = await confirm({
      title: 'Delete student',
      message: `Delete ${studentLabel(student)}? Sessions, payments, and lesson progress will be removed. This cannot be undone.`,
      confirmLabel: 'Delete student',
      variant: 'danger',
    })
    if (!ok) return
    setDeleting(true)
    try {
      await studentApi.delete(student.id)
      sync.removeStudent(student.id)
      void sync.refreshStats()
      push('Student deleted', 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const revokeAccess = async () => {
    const ok = await confirm({
      title: 'Revoke VIP access',
      message: `Remove paid access for ${studentLabel(student)}? They will return to unpaid / regular desk.`,
      confirmLabel: 'Revoke access',
      variant: 'danger',
    })
    if (!ok) return
    try {
      const res = await studentApi.revokeAccess(student.id)
      sync.applyStudent(res.data)
      void sync.refreshStats()
      push('Access revoked — now unpaid', 'info')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  return (
    <div
      className={`manage-student-row flex-col !items-stretch ${
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
                {programPlanLabel(student.programType) ? (
                  <>
                    Program: <span className="font-semibold">{programPlanLabel(student.programType)}</span>
                    {' · '}
                  </>
                ) : null}
                Paid {student.totalPaid.toLocaleString()} ({student.paymentCount} payment
                {student.paymentCount === 1 ? '' : 's'})
                {student.paidAt ? ` · since ${new Date(student.paidAt).toLocaleDateString()}` : ''}
                {student.paidUntil
                  ? ` · until ${new Date(student.paidUntil).toLocaleDateString()} (${student.daysRemaining ?? '?'}d left)`
                  : ''}
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

      </div>

      <div className="w-full">
        {editing ? (
          <div className="admin-student-actions">
            <button type="button" className="admin-btn admin-btn--primary" onClick={saveProfile}>
              Save
            </button>
            <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button type="button" className="admin-btn admin-btn--danger" disabled={deleting} onClick={() => void removeStudent()}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        ) : (
          <div className="admin-student-actions">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setEditing(true)}>
              Edit
            </button>
            {variant === 'unpaid' && (
              <button type="button" className="admin-btn admin-btn--secondary" onClick={copyPayLink}>
                <Copy className="h-3.5 w-3.5 shrink-0" />
                Pay link
              </button>
            )}
            {variant === 'unpaid' && pending ? (
              <button type="button" className="admin-btn admin-btn--primary" onClick={approvePending}>
                Approve
              </button>
            ) : null}
            {variant === 'paid' ? (
              <>
                <input
                  value={walletEdit}
                  onChange={(e) => setWalletEdit(e.target.value)}
                  className="admin-student-actions__wallet"
                  aria-label="Referral wallet"
                />
                <button type="button" className="admin-btn admin-btn--secondary" onClick={saveWallet}>
                  Wallet
                </button>
                <button type="button" className="admin-btn admin-btn--danger" onClick={() => void revokeAccess()}>
                  Revoke
                </button>
              </>
            ) : null}
            <button
              type="button"
              className={`admin-btn ${grantOpen ? 'admin-btn--primary' : 'admin-btn--secondary'}`}
              onClick={() => setGrantOpen((v) => !v)}
            >
              Grant
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              disabled={deleting}
              onClick={() => void removeStudent()}
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              Delete
            </button>
          </div>
        )}
        {grantOpen && !editing ? (
          <GrantAccessPanel
            student={student}
            membershipDays={membershipDays}
            autoTrialDays={autoTrialDays}
            sync={sync}
            onClose={() => setGrantOpen(false)}
          />
        ) : null}
      </div>
    </div>
  )
}
