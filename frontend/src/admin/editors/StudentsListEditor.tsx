import { useCallback, useEffect, useRef, useState } from 'react'
import { studentApi, type StudentRecord } from '@/services/api'
import { AdminCard } from '@/components/admin/AdminCard'
import { useAdminToast } from '@/admin/toast'
import { useAdminConfirm } from '@/admin/confirm'

const filters = ['all', 'paid', 'unpaid'] as const

function studentLabel(student: StudentRecord) {
  return student.name || student.displayPhone || student.email || 'this student'
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

function matchesFilter(student: StudentRecord, filter: (typeof filters)[number]) {
  if (filter === 'all') return true
  return student.membershipStatus === filter
}

function upsertInList(list: StudentRecord[], student: StudentRecord, include: boolean) {
  const without = list.filter((row) => row.id !== student.id)
  if (!include) return without
  return [student, ...without].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function StudentsListEditor() {
  const { push } = useAdminToast()
  const { confirm } = useAdminConfirm()
  const [items, setItems] = useState<StudentRecord[]>([])
  const [filter, setFilter] = useState<(typeof filters)[number]>('all')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    referrerCode: '',
    notes: '',
    membershipStatus: 'unpaid' as 'paid' | 'unpaid',
  })
  const [saving, setSaving] = useState(false)
  const searchReady = useRef(false)

  const applyStudent = useCallback(
    (student: StudentRecord) => {
      const include = matchesFilter(student, filter) && matchesStudentSearch(student, q)
      setItems((prev) => upsertInList(prev, student, include))
    },
    [filter, q],
  )

  const removeStudent = useCallback((id: string) => {
    setItems((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const reloadQuiet = useCallback(async () => {
    try {
      const res = await studentApi.list({ status: filter, q })
      setItems(res.data)
    } catch {
      push('Could not load students', 'error')
    }
  }, [filter, q, push])

  const loadInitial = useCallback(async () => {
    setLoading(true)
    try {
      const res = await studentApi.list({ status: filter, q })
      setItems(res.data)
    } catch {
      setItems([])
      push('Could not load students', 'error')
    } finally {
      setLoading(false)
    }
  }, [filter, q, push])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  useEffect(() => {
    if (loading) return
    if (!searchReady.current) {
      searchReady.current = true
      return
    }
    const timer = window.setTimeout(() => void reloadQuiet(), 320)
    return () => window.clearTimeout(timer)
  }, [q, filter, loading, reloadQuiet])

  const create = async () => {
    if (!form.phone.trim() && !form.email.trim()) {
      push('Enter phone and/or email', 'error')
      return
    }
    const ok = await confirm({
      title: 'Create student',
      message: `Add ${form.name.trim() || form.phone.trim() || form.email.trim() || 'new student'}?`,
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
      push('Student account created', 'success')
      setForm({ name: '', phone: '', email: '', referrerCode: '', notes: '', membershipStatus: 'unpaid' })
      setShowCreate(false)
      applyStudent(res.data)
    } catch (e) {
      push(e instanceof Error ? e.message : 'Create failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const listSync = { applyStudent, removeStudent }

  return (
    <div className="admin-form-stack">
      <AdminCard>
        <div className="admin-card-body">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-theme-primary">Student accounts</h3>
              <p className="admin-editor-card-intro mt-1">
                Create with phone, email, or both. Paid = access granted (payment or manual).
              </p>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => setShowCreate((v) => !v)}
            >
              {showCreate ? 'Close form' : '+ New student'}
            </button>
          </div>

          {showCreate && (
            <div className="mt-5 grid gap-3 rounded-2xl border border-theme bg-theme-surface/50 p-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-muted">Full name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-muted">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="07XXXXXXXX"
                  className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-muted">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="student@email.com"
                  className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-muted">Referral code used</label>
                <input
                  value={form.referrerCode}
                  onChange={(e) => setForm((f) => ({ ...f, referrerCode: e.target.value.toUpperCase() }))}
                  className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-theme-muted">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.membershipStatus === 'paid'}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, membershipStatus: e.target.checked ? 'paid' : 'unpaid' }))
                    }
                  />
                  Mark as paid on create
                </label>
                <button type="button" disabled={saving} className="admin-btn admin-btn--primary" onClick={create}>
                  {saving ? 'Creating…' : 'Create account'}
                </button>
              </div>
              <p className="sm:col-span-2 text-xs text-theme-muted">At least one of phone or email is required.</p>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label className="mb-1 block text-xs font-semibold text-theme-muted">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as (typeof filters)[number])}
                className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
              >
                {filters.map((f) => (
                  <option key={f} value={f}>
                    {f === 'all' ? 'All students' : f === 'paid' ? 'Paid only' : 'Unpaid only'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-theme-muted">Search</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name, phone, email, referral code"
                className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
              />
            </div>
            <button type="button" className="admin-btn admin-btn--secondary" onClick={() => void reloadQuiet()}>
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
            <p className="text-sm text-theme-muted">No students found.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((s) => (
                <StudentRow key={s.id} student={s} sync={listSync} />
              ))}
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  )
}

type ListSync = {
  applyStudent: (student: StudentRecord) => void
  removeStudent: (id: string) => void
}

function StudentRow({ student, sync }: { student: StudentRecord; sync: ListSync }) {
  const { push } = useAdminToast()
  const { confirm } = useAdminConfirm()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(student.name ?? '')
  const [phone, setPhone] = useState(student.displayPhone ?? student.phone ?? '')
  const [email, setEmail] = useState(student.email ?? '')
  const [notes, setNotes] = useState(student.notes ?? '')

  useEffect(() => {
    setName(student.name ?? '')
    setPhone(student.displayPhone ?? student.phone ?? '')
    setEmail(student.email ?? '')
    setNotes(student.notes ?? '')
  }, [student])

  const save = async () => {
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
      push('Student updated', 'success')
      setEditing(false)
    } catch (e) {
      push(e instanceof Error ? e.message : 'Update failed', 'error')
    }
  }

  const grantAccess = async () => {
    const ok = await confirm({
      title: 'Grant VIP access',
      message: `Mark ${studentLabel(student)} as paid with VIP desk access?`,
      confirmLabel: 'Grant access',
    })
    if (!ok) return
    try {
      const res = await studentApi.grantAccess(student.id)
      sync.applyStudent(res.data)
      push('Marked as paid', 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const revokeAccess = async () => {
    const ok = await confirm({
      title: 'Revoke VIP access',
      message: `Remove paid access for ${studentLabel(student)}?`,
      confirmLabel: 'Revoke access',
      variant: 'danger',
    })
    if (!ok) return
    try {
      const res = await studentApi.revokeAccess(student.id)
      sync.applyStudent(res.data)
      push('Marked as unpaid', 'info')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const removeStudent = async () => {
    const ok = await confirm({
      title: 'Delete student',
      message: `Delete ${studentLabel(student)}? This cannot be undone.`,
      confirmLabel: 'Delete student',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await studentApi.delete(student.id)
      sync.removeStudent(student.id)
      push('Student deleted', 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Delete failed', 'error')
    }
  }

  const contact = [student.displayPhone, student.email].filter(Boolean).join(' · ')

  return (
    <div className="manage-student-row">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-theme-primary">{student.name || 'Unnamed student'}</p>
          <span
            className={`manage-badge ${student.membershipStatus === 'paid' ? 'manage-badge--paid' : 'manage-badge--unpaid'}`}
          >
            {student.membershipStatus}
          </span>
        </div>
        {!editing ? (
          <>
            <p className="mt-1 text-sm text-theme-muted">{contact || 'No contact on file'}</p>
            <p className="mt-1 text-xs text-theme-muted">
              Ref {student.referralCode}
              {student.totalPaid > 0
                ? ` · Paid ${student.totalPaid.toLocaleString()} (${student.paymentCount} payment${student.paymentCount === 1 ? '' : 's'})`
                : ''}
            </p>
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

      <div className="admin-student-actions w-full">
        {editing ? (
          <>
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => void save()}>
              Save
            </button>
            <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setEditing(true)}>
              Edit
            </button>
            {student.membershipStatus === 'unpaid' ? (
              <button type="button" className="admin-btn admin-btn--primary" onClick={() => void grantAccess()}>
                Grant
              </button>
            ) : (
              <button type="button" className="admin-btn admin-btn--danger" onClick={() => void revokeAccess()}>
                Revoke
              </button>
            )}
            <button type="button" className="admin-btn admin-btn--danger" onClick={() => void removeStudent()}>
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}
