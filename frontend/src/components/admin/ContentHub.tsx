import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Globe, LayoutGrid, Search, Users } from 'lucide-react'
import { useCms } from '@/cms/CmsProvider'
import { AdminCard } from '@/components/admin/AdminCard'
import { AdminOpsPriorities } from '@/components/admin/AdminOpsPriorities'
import { DASHBOARD_WORKFLOW_ACTIONS } from '@/admin/layout/dashboardActions'
import {
  ADMIN_HUB_CARDS,
  HUB_CATEGORIES,
  type HubCategory,
} from '@/admin/layout/adminHubActions'
import type { AdminTab } from '@/admin/layout/adminNav'
import type { ContentSectionId } from '@/cms/validation'

const listStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0.04 } },
}

const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

const accentRing: Record<string, string> = {
  purple: 'admin-hub-card--purple',
  emerald: 'admin-hub-card--emerald',
  amber: 'admin-hub-card--amber',
  sky: 'admin-hub-card--sky',
  rose: 'admin-hub-card--rose',
}

export function ContentHub({
  onNavigate,
  onWorkflow,
}: {
  onNavigate: (tab: AdminTab) => void
  onWorkflow: (action: 'preview' | 'publish' | 'view-site') => void
}) {
  const { draft, hasDraftChanges, sectionStates } = useCms()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<HubCategory>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ADMIN_HUB_CARDS.filter((card) => {
      if (category !== 'all' && card.category !== category) return false
      if (!q) return true
      return (
        card.title.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q) ||
        card.tab.includes(q)
      )
    })
  }, [query, category])

  const cmsStats = [
    { label: 'Daily updates', value: (draft.dailyUpdates ?? []).filter((u) => u.enabled).length },
    { label: 'Banners', value: draft.upcomingBanners.filter((b) => b.enabled).length },
    { label: 'Certificates', value: draft.certificates.length },
    { label: 'Result media', value: draft.provenResults.media.length },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="admin-hub-hero">
        <div className="admin-hub-hero__glow" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-theme-accent">Content studio</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-theme-primary sm:text-3xl">
              Manage everything in one place
            </h1>
            <p className="mt-2 max-w-xl text-sm text-theme-muted">
              Website content, students, Mobile Money, live class, and settings — like a modern creator
              dashboard.
            </p>
            {hasDraftChanges && (
              <p className="mt-2 text-sm font-semibold text-amber-400">Unpublished website draft — publish when ready.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {DASHBOARD_WORKFLOW_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onWorkflow(action.action)}
                  className={`admin-hub-workflow-btn ${action.action === 'publish' ? 'admin-hub-workflow-btn--primary' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  {action.title}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <AdminOpsPriorities onNavigate={onNavigate} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cmsStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="admin-stat-tile"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-theme-muted">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-theme-primary">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <AdminCard>
        <div className="admin-card-body">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-theme-accent" />
              <h2 className="font-display text-lg font-bold text-theme-primary">All modules</h2>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search content, students, payments…"
                className="w-full rounded-xl border border-theme bg-theme-elevated/60 py-2.5 pl-10 pr-3 text-sm text-theme-primary outline-none focus:ring-2 focus:ring-theme-accent/30"
              />
            </div>
          </div>

          <div className="admin-hub-filters mt-4">
            {HUB_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`admin-hub-filter ${category === cat.id ? 'admin-hub-filter--active' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="mt-8 text-center text-sm text-theme-muted">No modules match your search.</p>
          ) : (
            <motion.div
              className="admin-hub-bento mt-5"
              variants={listStagger}
              initial="hidden"
              animate="show"
              key={`${category}-${query}`}
            >
              {filtered.map((card) => {
                const Icon = card.icon
                const cmsState = sectionStates[card.tab as ContentSectionId]
                const accent = card.accent ? accentRing[card.accent] : ''
                return (
                  <motion.button
                    key={card.tab}
                    type="button"
                    variants={listItem}
                    onClick={() => onNavigate(card.tab)}
                    className={`admin-hub-card group ${accent}`}
                  >
                    <span className="admin-hub-card__icon">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="admin-hub-card__body">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="admin-hub-card__title">{card.title}</span>
                        {cmsState && (
                          <span
                            className={`admin-status-pill ${
                              !cmsState.isValid
                                ? 'admin-status-pill--danger'
                                : cmsState.status === 'draft'
                                  ? 'admin-status-pill--warn'
                                  : 'admin-status-pill--ok'
                            }`}
                          >
                            {!cmsState.isValid ? 'Fix' : cmsState.status}
                          </span>
                        )}
                        {card.category === 'operations' && (
                          <span className="admin-status-pill admin-status-pill--ok">Live API</span>
                        )}
                      </span>
                      <span className="admin-hub-card__desc">{card.description}</span>
                    </span>
                    <ChevronRight className="admin-hub-card__chevron" />
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body flex flex-col gap-3 sm:flex-row sm:items-center">
          <Users className="h-10 w-10 text-theme-accent" />
          <div className="flex-1">
            <p className="font-display font-bold text-theme-primary">Quick tip</p>
            <p className="text-sm text-theme-muted">
              Website sections use <strong className="text-theme-primary">draft → publish</strong>. Students &
              payments update instantly when you approve in the Payments module.
            </p>
          </div>
          <button
            type="button"
            className="admin-hub-workflow-btn shrink-0"
            onClick={() => onWorkflow('view-site')}
          >
            <Globe className="h-4 w-4" />
            View site
          </button>
        </div>
      </AdminCard>
    </div>
  )
}
