import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  CreditCard,
  GraduationCap,
  Megaphone,
  Radio,
  TrendingUp,
  Users,
} from 'lucide-react'
import { liveApi, studentApi, type StudentStats } from '@/services/api'
import type { AdminTab } from '@/admin/layout/adminNav'

type Props = {
  onNavigate: (tab: AdminTab) => void
}

export function AdminOpsPriorities({ onNavigate }: Props) {
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [liveToday, setLiveToday] = useState(0)
  const [liveActive, setLiveActive] = useState(false)

  const load = useCallback(async () => {
    try {
      const [statsRes, liveRes] = await Promise.all([
        studentApi.getStats(),
        liveApi.adminList(),
      ])
      setStats(statsRes.data)
      const today = new Date().toDateString()
      const sessions = liveRes.data ?? []
      setLiveToday(
        sessions.filter((s) => s.scheduledAt && new Date(s.scheduledAt).toDateString() === today).length,
      )
      setLiveActive(sessions.some((s) => s.status === 'live'))
    } catch {
      setStats(null)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const pending = stats?.pendingPayments ?? 0
  const newStudents = stats?.recentUnpaid?.length ?? 0

  const priorities = [
    {
      id: 'payments',
      tab: 'payments' as AdminTab,
      label: 'Pending payments',
      value: pending,
      hint: pending ? 'Needs approval' : 'All clear',
      severity: pending > 0 ? 'warn' : 'ok',
      icon: CreditCard,
    },
    {
      id: 'live',
      tab: 'live' as AdminTab,
      label: liveActive ? 'Live session active' : 'Live sessions today',
      value: liveActive ? 'LIVE' : liveToday,
      hint: liveActive ? 'Students may be waiting' : 'Schedule or start class',
      severity: liveActive ? 'live' : liveToday ? 'info' : 'muted',
      icon: Radio,
    },
    {
      id: 'students',
      tab: 'students' as AdminTab,
      label: 'New / unpaid students',
      value: stats?.unpaidStudents ?? 0,
      hint: newStudents ? `${newStudents} recent sign-ups` : 'Review access',
      severity: (stats?.unpaidStudents ?? 0) > 0 ? 'info' : 'muted',
      icon: Users,
    },
    {
      id: 'revenue',
      tab: 'students' as AdminTab,
      label: 'Paid members',
      value: stats?.paidStudents ?? 0,
      hint: stats ? `${stats.totalRevenue.toLocaleString()} ${stats.currency} total` : '',
      severity: 'ok',
      icon: TrendingUp,
    },
  ]

  const quickActions = [
    { tab: 'education' as AdminTab, label: 'Upload book', icon: BookOpen },
    { tab: 'live' as AdminTab, label: 'Schedule live', icon: Radio },
    { tab: 'updates' as AdminTab, label: 'Daily subject', icon: Megaphone },
    { tab: 'live' as AdminTab, label: 'Post signal', icon: TrendingUp },
    { tab: 'desk-chat' as AdminTab, label: 'VIP messages', icon: AlertCircle },
    { tab: 'classroom' as AdminTab, label: 'Open classroom', icon: GraduationCap },
  ]

  return (
    <section className="admin-ops-priorities">
      <div className="admin-ops-priorities__head">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-theme-accent">Today</p>
          <h2 className="mt-1 font-display text-xl font-bold text-theme-primary">What needs attention</h2>
        </div>
        <button type="button" className="admin-btn admin-btn--ghost text-xs" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      <div className="admin-ops-priorities__grid">
        {priorities.map((p) => {
          const Icon = p.icon
          return (
            <button
              key={p.id}
              type="button"
              className={`admin-ops-priority admin-ops-priority--${p.severity}`}
              onClick={() => onNavigate(p.tab)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{p.label}</p>
                <p className="font-display text-2xl font-bold leading-tight">{p.value}</p>
                <p className="mt-0.5 truncate text-xs opacity-75">{p.hint}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="admin-ops-priorities__actions">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-theme-muted">Quick actions</p>
        <div className="admin-ops-priorities__action-row">
          {quickActions.map((a) => {
            const Icon = a.icon
            return (
              <button key={a.label} type="button" className="admin-ops-quick" onClick={() => onNavigate(a.tab)}>
                <Icon className="h-4 w-4" />
                <span>{a.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
