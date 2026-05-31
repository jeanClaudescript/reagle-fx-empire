import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Globe, LayoutGrid, Search } from 'lucide-react'
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

  const draftSections = Object.values(sectionStates).filter((s) => s.status === 'draft').length
  const invalidSections = Object.values(sectionStates).filter((s) => !s.isValid).length

  return (
    <div className="admin-content-hub flex flex-col gap-4">
      <AdminOpsPriorities onNavigate={onNavigate} />

      <div className="admin-hub-hero admin-hub-hero--compact">
        <div className="admin-hub-hero__glow hidden md:block" aria-hidden />
        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="admin-hub-hero__eyebrow">Content studio</p>
            <h1 className="admin-hub-hero__title">Website content</h1>
            <p className="admin-hub-hero__desc hidden sm:block">
              Edit sections, preview drafts, publish when validation passes.
            </p>
            {hasDraftChanges ? (
              <p className="admin-hub-hero__alert">Unpublished draft — publish when ready.</p>
            ) : (
              <p className="admin-hub-hero__status">Live site is in sync</p>
            )}
            {(draftSections > 0 || invalidSections > 0) && (
              <p className="admin-hub-hero__meta">
                {draftSections > 0 ? `${draftSections} draft section${draftSections === 1 ? '' : 's'}` : null}
                {draftSections > 0 && invalidSections > 0 ? ' · ' : null}
                {invalidSections > 0 ? `${invalidSections} need fixes` : null}
              </p>
            )}
          </div>
          <div className="admin-hub-hero__actions hidden lg:flex">
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

      <section className="admin-content-overview">
        <div className="admin-content-overview__head">
          <h3 className="admin-content-overview__title">Content overview</h3>
        </div>
        <div className="admin-content-overview__grid">
          {cmsStats.map((s) => (
            <div key={s.label} className="admin-stat-tile admin-stat-tile--compact">
              <p className="admin-stat-tile__label">{s.label}</p>
              <p className="admin-stat-tile__value">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      <AdminCard>
        <div className="admin-card-body">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-theme-accent" />
              <h2 className="font-display text-base font-bold text-theme-primary sm:text-lg">All modules</h2>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search content, students, payments…"
                className="w-full rounded-xl border border-theme bg-theme-elevated/60 py-2 pl-10 pr-3 text-sm text-theme-primary outline-none focus:ring-2 focus:ring-theme-accent/30"
              />
            </div>
          </div>

          <div className="admin-hub-filters mt-3">
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
            <p className="mt-6 text-center text-sm text-theme-muted">No modules match your search.</p>
          ) : (
            <motion.div
              className="admin-hub-bento mt-4"
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
                      <Icon className="h-5 w-5" />
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

      <p className="admin-content-hub__tip hidden sm:block">
        <Globe className="inline h-3.5 w-3.5 align-text-bottom text-theme-accent" /> Website sections use{' '}
        <strong>draft → publish</strong>. Students and payments update instantly when you approve in Payments.
      </p>
    </div>
  )
}
