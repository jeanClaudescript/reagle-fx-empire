import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  CreditCard,
  GraduationCap,
  Megaphone,
  Radio,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react'
import { liveApi, studentApi, type StudentStats } from '@/services/api'
import type { AdminTab } from '@/admin/layout/adminNav'

type Props = {
  onNavigate: (tab: AdminTab) => void
}

type AttentionItem = {
  id: string
  tab: AdminTab
  title: string
  detail: string
  severity: 'warn' | 'live' | 'info' | 'ok' | 'muted'
  actionLabel: string
  icon: typeof CreditCard
}

export function AdminOpsPriorities({ onNavigate }: Props) {
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [liveToday, setLiveToday] = useState(0)
  const [liveActive, setLiveActive] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const pending = stats?.pendingPayments ?? 0
  const unpaid = stats?.unpaidStudents ?? 0
  const paid = stats?.paidStudents ?? 0
  const newStudents = stats?.recentUnpaid?.length ?? 0

  const kpis = [
    {
      id: 'payments',
      tab: 'payments' as AdminTab,
      label: 'Pending',
      value: pending,
      hint: pending ? 'Needs approval' : 'All clear',
      severity: pending > 0 ? 'warn' : 'ok',
      icon: CreditCard,
    },
    {
      id: 'live',
      tab: 'live' as AdminTab,
      label: liveActive ? 'Live now' : 'Live today',
      value: liveActive ? 'LIVE' : liveToday,
      hint: liveActive ? 'Class in progress' : liveToday ? 'Scheduled' : 'None scheduled',
      severity: liveActive ? 'live' : liveToday ? 'info' : 'muted',
      icon: Radio,
    },
    {
      id: 'students',
      tab: 'students' as AdminTab,
      label: 'Unpaid',
      value: unpaid,
      hint: newStudents ? `+${newStudents} recent` : 'Students',
      severity: unpaid > 0 ? 'info' : 'muted',
      icon: Users,
    },
    {
      id: 'paid',
      tab: 'students' as AdminTab,
      label: 'Paid members',
      value: paid,
      hint: stats ? `${stats.totalRevenue.toLocaleString()} ${stats.currency}` : 'Revenue',
      severity: 'ok',
      icon: TrendingUp,
    },
  ]

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = []
    if (pending > 0) {
      items.push({
        id: 'pay-queue',
        tab: 'payments',
        title: `${pending} pending payment${pending === 1 ? '' : 's'}`,
        detail: 'Approve MoMo transfers to grant VIP access',
        severity: 'warn',
        actionLabel: 'Review',
        icon: CreditCard,
      })
    }
    if (liveActive) {
      items.push({
        id: 'live-now',
        tab: 'live',
        title: 'Live session is active',
        detail: 'Students may be waiting in the room',
        severity: 'live',
        actionLabel: 'Open',
        icon: Radio,
      })
    } else if (liveToday === 0) {
      items.push({
        id: 'no-live',
        tab: 'live',
        title: 'No live sessions today',
        detail: 'Schedule a class or start one now',
        severity: 'muted',
        actionLabel: 'Schedule',
        icon: Radio,
      })
    }
    if (unpaid > 0 && pending === 0) {
      items.push({
        id: 'unpaid',
        tab: 'students',
        title: `${unpaid} unpaid student${unpaid === 1 ? '' : 's'}`,
        detail: newStudents ? `${newStudents} signed up recently` : 'Review access and follow up',
        severity: 'info',
        actionLabel: 'View',
        icon: Users,
      })
    }
    if (items.length === 0) {
      items.push({
        id: 'all-clear',
        tab: 'dashboard',
        title: 'All caught up',
        detail: 'No urgent ops tasks right now',
        severity: 'ok',
        actionLabel: 'Refresh',
        icon: AlertCircle,
      })
    }
    return items
  }, [pending, liveActive, liveToday, unpaid, newStudents])

  const quickActions = [
    { tab: 'payments' as AdminTab, label: 'Payments', icon: CreditCard },
    { tab: 'education' as AdminTab, label: 'Upload book', icon: BookOpen },
    { tab: 'live' as AdminTab, label: 'Schedule live', icon: Radio },
    { tab: 'updates' as AdminTab, label: 'Daily update', icon: Megaphone },
    { tab: 'desk-chat' as AdminTab, label: 'VIP messages', icon: AlertCircle },
    { tab: 'classroom' as AdminTab, label: 'Classroom', icon: GraduationCap },
  ]

  return (
    <section className="admin-ops-hub">
      <div className="admin-ops-hub__head">
        <div>
          <p className="admin-ops-hub__eyebrow">Operations</p>
          <h2 className="admin-ops-hub__title">Today</h2>
        </div>
        <button
          type="button"
          className="admin-ops-hub__refresh"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Refresh stats"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="admin-kpi-strip" role="list">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <button
              key={kpi.id}
              type="button"
              role="listitem"
              className={`admin-kpi-tile admin-kpi-tile--${kpi.severity}`}
              onClick={() => onNavigate(kpi.tab)}
            >
              <Icon className="admin-kpi-tile__icon" aria-hidden />
              <span className="admin-kpi-tile__label">{kpi.label}</span>
              <span className="admin-kpi-tile__value">{kpi.value}</span>
              <span className="admin-kpi-tile__hint">{kpi.hint}</span>
            </button>
          )
        })}
      </div>

      <div className="admin-attention">
        <div className="admin-attention__head">
          <h3 className="admin-attention__title">Needs attention</h3>
          <button type="button" className="admin-attention__view-all" onClick={() => onNavigate('students')}>
            View all
          </button>
        </div>
        <ul className="admin-attention__list">
          {attentionItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <div className={`admin-attention__row admin-attention__row--${item.severity}`}>
                  <button
                    type="button"
                    className="admin-attention__main"
                    onClick={() => onNavigate(item.tab === 'dashboard' ? 'payments' : item.tab)}
                  >
                    <Icon className="admin-attention__icon" aria-hidden />
                    <span className="min-w-0 text-left">
                      <span className="admin-attention__row-title">{item.title}</span>
                      <span className="admin-attention__row-detail">{item.detail}</span>
                    </span>
                    <ChevronRight className="admin-attention__chevron hidden sm:block" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={`admin-attention__action ${item.severity === 'warn' ? 'admin-attention__action--primary' : ''}`}
                    onClick={() => {
                      if (item.id === 'all-clear') void load()
                      else onNavigate(item.tab === 'dashboard' ? 'payments' : item.tab)
                    }}
                  >
                    {item.actionLabel}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="admin-quick-chips">
        <p className="admin-quick-chips__label">Quick actions</p>
        <div className="admin-quick-chips__row">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                type="button"
                className="admin-quick-chip"
                onClick={() => onNavigate(action.tab)}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {action.label}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
