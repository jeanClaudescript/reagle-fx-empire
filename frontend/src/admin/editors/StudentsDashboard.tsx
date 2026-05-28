import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Clock, TrendingUp, UserPlus, Users } from 'lucide-react'
import { studentApi, type StudentRecord, type StudentStats } from '@/services/api'
import { AdminCard } from '@/components/admin/AdminCard'
import type { ManageView } from '@/admin/components/ManageSubNav'

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: string | number
  hint?: string
  icon: typeof Users
  tone: 'purple' | 'green' | 'amber' | 'blue'
}) {
  const tones = {
    purple: 'from-empire-purple/20 to-empire-blue/10 border-empire-purple/30 text-empire-purple-glow',
    green: 'from-emerald-500/15 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/15 to-orange-500/5 border-amber-500/30 text-amber-400',
    blue: 'from-sky-500/15 to-blue-600/5 border-sky-500/30 text-sky-400',
  }
  return (
    <div className={`manage-stat-card bg-gradient-to-br ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-theme-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-theme-primary">{value}</p>
          {hint ? <p className="mt-1 text-xs text-theme-muted">{hint}</p> : null}
        </div>
        <Icon className="h-8 w-8 shrink-0 opacity-80" />
      </div>
    </div>
  )
}

function StudentMiniRow({ student }: { student: StudentRecord }) {
  const contact = [student.displayPhone, student.email].filter(Boolean).join(' · ')
  return (
    <div className="manage-student-mini">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-theme-primary">{student.name || 'Unnamed'}</p>
        <p className="truncate text-xs text-theme-muted">{contact || '—'}</p>
      </div>
      <span
        className={`manage-badge ${student.membershipStatus === 'paid' ? 'manage-badge--paid' : 'manage-badge--unpaid'}`}
      >
        {student.membershipStatus}
      </span>
    </div>
  )
}

export function StudentsDashboard({ onNavigate }: { onNavigate: (view: ManageView) => void }) {
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await studentApi.getStats()
      setStats(res.data)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <p className="text-sm text-theme-muted">Loading dashboard…</p>
  }

  if (!stats) {
    return (
      <AdminCard>
        <div className="admin-card-body">
          <p className="text-sm text-theme-muted">Could not load stats. Check API connection and admin key.</p>
        </div>
      </AdminCard>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total students" value={stats.totalStudents} icon={Users} tone="purple" />
        <StatCard label="Paid students" value={stats.paidStudents} icon={CheckCircle2} tone="green" />
        <StatCard label="Unpaid students" value={stats.unpaidStudents} icon={UserPlus} tone="amber" />
        <StatCard
          label="Pending payments"
          value={stats.pendingPayments}
          icon={Clock}
          tone="blue"
          hint="Awaiting approval"
        />
      </div>

      <AdminCard>
        <div className="admin-card-body">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-theme-accent" />
              <p className="font-display font-bold text-theme-primary">
                Revenue: {stats.totalRevenue.toLocaleString()} {stats.currency}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => onNavigate('students')}>
                Add student
              </button>
              <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => onNavigate('payments')}>
                Review payments
              </button>
            </div>
          </div>
        </div>
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <div className="admin-card-body">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-emerald-400">Recent paid</h3>
              <button type="button" className="text-xs text-theme-accent" onClick={() => onNavigate('students')}>
                View all
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {stats.recentPaid.length === 0 ? (
                <p className="text-sm text-theme-muted">No paid students yet.</p>
              ) : (
                stats.recentPaid.map((s) => <StudentMiniRow key={s.id} student={s} />)
              )}
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="admin-card-body">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-amber-400">Recent unpaid</h3>
              <button type="button" className="text-xs text-theme-accent" onClick={() => onNavigate('students')}>
                View all
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {stats.recentUnpaid.length === 0 ? (
                <p className="text-sm text-theme-muted">No unpaid students.</p>
              ) : (
                stats.recentUnpaid.map((s) => <StudentMiniRow key={s.id} student={s} />)
              )}
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
