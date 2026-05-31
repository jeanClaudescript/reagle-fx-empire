import { useEffect, useState } from 'react'
import { Shield, Trash2, UserPlus } from 'lucide-react'
import {
  addAdminAccount,
  getCurrentAdminEmail,
  listAdminAccounts,
  removeAdminAccount,
  type AdminAccount,
} from '@/admin/auth'
import { AdminCard } from '@/components/admin/AdminCard'
import { useAdminToast } from '@/admin/toast'
import { useAdminConfirm } from '@/admin/confirm'

export function AdminsEditor() {
  const { push } = useAdminToast()
  const { confirm } = useAdminConfirm()
  const [admins, setAdmins] = useState<AdminAccount[]>([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const currentEmail = getCurrentAdminEmail()

  const refresh = async () => {
    setLoading(true)
    try {
      setAdmins(await listAdminAccounts())
    } catch {
      setAdmins([])
      push('Could not load admin accounts', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const onAdd = async () => {
    setBusy(true)
    try {
      await addAdminAccount({ email, password, name })
      setEmail('')
      setName('')
      setPassword('')
      await refresh()
      push('Admin added — share the password securely.', 'success')
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not add admin', 'error')
    } finally {
      setBusy(false)
    }
  }

  const onRemove = async (id: string, label: string) => {
    const ok = await confirm({
      title: 'Remove admin?',
      message: `${label} will no longer access the dashboard.`,
      confirmLabel: 'Remove',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await removeAdminAccount(id)
      await refresh()
      push('Admin removed', 'success')
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not remove', 'error')
    }
  }

  return (
    <div className="admin-form-stack">
      <AdminCard>
        <div className="admin-card-body">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-theme-accent" />
            <h3 className="font-display text-lg font-bold text-theme-primary">Admin accounts</h3>
          </div>
          <p className="admin-editor-card-intro mt-2">
            Admins are stored in MongoDB with role <strong>admin</strong> (students use role{' '}
            <strong>student</strong>). First sign-in creates the main admin.
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-theme-muted">Loading…</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {admins.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-theme bg-theme-surface/60 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-theme-primary">
                      {a.name || a.email}
                      {a.isPrimary ? (
                        <span className="ml-2 rounded-full bg-theme-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase text-theme-accent">
                          Main
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-theme-muted">{a.email}</p>
                  </div>
                  {a.email !== currentEmail ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger text-xs"
                      onClick={() => void onRemove(a.id, a.email)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  ) : (
                    <span className="text-xs text-theme-muted">You</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-theme-accent" />
            <h3 className="font-display text-lg font-bold text-theme-primary">Add another admin</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-theme-muted sm:col-span-2">
              Name (optional)
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2.5 text-sm text-theme-primary"
                placeholder="Coach Peter"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-theme-muted">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2.5 text-sm text-theme-primary"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-theme-muted">
              Password (min 6)
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2.5 text-sm text-theme-primary"
                minLength={6}
                required
              />
            </label>
          </div>
          <button
            type="button"
            disabled={busy || !email.trim() || password.length < 6}
            className="admin-btn admin-btn--primary mt-4"
            onClick={() => void onAdd()}
          >
            {busy ? 'Adding…' : 'Add admin'}
          </button>
        </div>
      </AdminCard>
    </div>
  )
}
