import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { ADMIN_NAV, type AdminTab } from '@/admin/layout/adminNav'
import { useCms } from '@/cms/CmsProvider'
import type { ContentSectionId } from '@/cms/validation'

const navStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
}

const navItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
}

function SectionNavDot({ sectionId }: { sectionId: AdminTab }) {
  const { sectionStates } = useCms()
  if (sectionId === 'dashboard') return null
  const state = sectionStates[sectionId as ContentSectionId]
  if (!state) return null
  let color = 'bg-emerald-400'
  if (!state.isValid) color = 'bg-rose-400'
  else if (state.status === 'draft') color = 'bg-amber-400'
  return <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
}

interface AdminMobileDrawerProps {
  open: boolean
  activeTab: AdminTab
  syncLabel: string
  hasDraftChanges: boolean
  onClose: () => void
  onSelectTab: (tab: AdminTab) => void
}

/** Mobile nav only — actions live in header / bottom bar, not here. */
export function AdminMobileDrawer({
  open,
  activeTab,
  syncLabel,
  hasDraftChanges,
  onClose,
  onSelectTab,
}: AdminMobileDrawerProps) {
  const select = (tab: AdminTab) => {
    onSelectTab(tab)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="admin-drawer-backdrop md:hidden"
            onClick={onClose}
            aria-label="Close menu"
          />

          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="admin-mobile-drawer md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="admin-mobile-drawer-header">
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-gradient-brand">REAGLE FX</p>
                <p className="mt-0.5 truncate text-xs text-theme-muted">{syncLabel}</p>
              </div>
              <button type="button" onClick={onClose} className="admin-sidebar-icon-btn" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {hasDraftChanges && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-400"
              >
                Unpublished changes — use section Publish or header Publish all
              </motion.p>
            )}

            <motion.nav
              className="admin-mobile-drawer-nav scrollbar-hide"
              variants={navStagger}
              initial="hidden"
              animate="show"
            >
              <p className="admin-sidebar-section-label">Sections</p>
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon
                const active = activeTab === item.id
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    variants={navItem}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => select(item.id)}
                    className={`admin-sidebar-nav-item ${active ? 'admin-sidebar-nav-item--active' : ''}`}
                  >
                    <span className="admin-sidebar-nav-icon">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="truncate">{item.label}</span>
                    <SectionNavDot sectionId={item.id} />
                  </motion.button>
                )
              })}
            </motion.nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
