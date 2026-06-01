import { motion } from 'framer-motion'
import { ChevronRight, LayoutDashboard } from 'lucide-react'
import { useCms } from '@/cms/CmsProvider'
import { AdminCard } from '@/components/admin/AdminCard'
import {
  DASHBOARD_CONTENT_ACTIONS,
  DASHBOARD_WORKFLOW_ACTIONS,
} from '@/admin/layout/dashboardActions'
import { CONTENT_SECTIONS } from '@/cms/validation'
import { getAdminNavLabel } from '@/admin/layout/adminNav'
import type { AdminTab } from '@/admin/layout/adminNav'

const listStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.06 },
  },
}

const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

interface DashboardHomeProps {
  onNavigate: (tab: AdminTab) => void
  onWorkflow: (action: 'preview' | 'publish' | 'view-site') => void
}

export function DashboardHome({ onNavigate, onWorkflow }: DashboardHomeProps) {
  const { draft, published, sectionStates, hasDraftChanges } = useCms()

  const stats = [
    { label: 'Daily updates', value: (draft.dailyUpdates ?? []).filter((u) => u.enabled).length },
    { label: 'Banners', value: draft.upcomingBanners.filter((b) => b.enabled).length },
    { label: 'Certificates', value: draft.certificates.length },
    { label: 'Result media', value: draft.provenResults.media.length },
  ]

  return (
    <div className="flex flex-col gap-4">
      <AdminCard>
        <div className="admin-card-body flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="admin-nav-tile-icon">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-theme-primary">Admin Dashboard</h2>
            <p className="mt-1 text-sm text-theme-muted">
              Pick a task below, edit content, preview in real time, then publish when validation
              passes.
            </p>
            {hasDraftChanges && (
              <p className="mt-2 text-sm font-semibold text-amber-400">
                You have unpublished draft changes.
              </p>
            )}
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-base font-bold text-theme-primary">Quick actions</h3>
          <p className="mt-1 text-sm text-theme-muted">Premium control panel shortcuts.</p>

          <motion.div
            className="admin-nav-grid admin-nav-grid--3 mt-4"
            variants={listStagger}
            initial="hidden"
            animate="show"
          >
            {DASHBOARD_WORKFLOW_ACTIONS.map((action) => {
              const Icon = action.icon
              const highlight = action.action === 'publish'
              return (
                <motion.button
                  key={action.id}
                  type="button"
                  variants={listItem}
                  onClick={() => onWorkflow(action.action)}
                  className={`group admin-nav-tile ${highlight ? 'admin-nav-tile--highlight' : ''}`}
                >
                  <span className="admin-nav-tile-icon">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="admin-nav-tile-body">
                    <span className="admin-nav-tile-title">{action.title}</span>
                    <span className="admin-nav-tile-desc">{action.description}</span>
                  </span>
                  <ChevronRight className="admin-nav-tile-chevron" />
                </motion.button>
              )
            })}
          </motion.div>
        </div>
      </AdminCard>

      <div className="admin-stat-grid">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="admin-stat-tile admin-stat-tile--compact"
          >
            <p className="admin-stat-tile__label">{s.label}</p>
            <p className="admin-stat-tile__value">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-base font-bold text-theme-primary">Content sections</h3>
          <p className="mt-1 text-sm text-theme-muted">Tap any section to start editing.</p>

          <motion.ul
            className="admin-nav-grid mt-4"
            variants={listStagger}
            initial="hidden"
            animate="show"
          >
            {DASHBOARD_CONTENT_ACTIONS.map((action) => {
              const Icon = action.icon
              const state = sectionStates[action.tab]
              return (
                <motion.li key={action.tab} variants={listItem} className="list-none">
                  <button
                    type="button"
                    onClick={() => onNavigate(action.tab)}
                    className="group admin-nav-tile"
                  >
                    <span className="admin-nav-tile-icon">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="admin-nav-tile-body">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="admin-nav-tile-title">{action.title}</span>
                        {state && (
                          <span
                            className={`admin-status-pill ${
                              !state.isValid
                                ? 'admin-status-pill--danger'
                                : state.status === 'draft'
                                  ? 'admin-status-pill--warn'
                                  : 'admin-status-pill--ok'
                            }`}
                          >
                            {!state.isValid ? 'Fix' : state.status}
                          </span>
                        )}
                      </span>
                      <span className="admin-nav-tile-desc">{action.description}</span>
                    </span>
                    <ChevronRight className="admin-nav-tile-chevron" />
                  </button>
                </motion.li>
              )
            })}
          </motion.ul>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-base font-bold text-theme-primary">Section sync</h3>
          <p className="mt-1 text-sm text-theme-muted">Jump to a section that needs attention.</p>
          <motion.ul
            className="mt-4 flex flex-col gap-2"
            variants={listStagger}
            initial="hidden"
            animate="show"
          >
            {CONTENT_SECTIONS.map((id) => {
              const state = sectionStates[id]
              return (
                <motion.li key={id} variants={listItem} className="list-none">
                  <button
                    type="button"
                    onClick={() => onNavigate(id)}
                    className="admin-nav-tile admin-nav-tile--compact"
                  >
                    <span className="admin-nav-tile-body">
                      <span className="admin-nav-tile-title">{getAdminNavLabel(id)}</span>
                      <span className="admin-nav-tile-desc">
                        {state.status === 'draft' ? 'Draft' : 'Published'}
                        {!state.isValid ? ' · needs fix' : ''}
                      </span>
                    </span>
                    <ChevronRight className="admin-nav-tile-chevron" />
                  </button>
                </motion.li>
              )
            })}
          </motion.ul>
          <p className="mt-4 text-sm text-theme-muted">
            Live: {published.upcomingBanners.length} banners · {published.certificates.length}{' '}
            certificates
          </p>
        </div>
      </AdminCard>
    </div>
  )
}
