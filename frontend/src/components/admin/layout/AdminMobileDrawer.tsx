import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { ADMIN_NAV, ADMIN_NAV_GROUPS, type AdminTab } from '@/admin/layout/adminNav'
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

const CMS_TABS: ContentSectionId[] = [
  'updates',
  'upcoming',
  'about',
  'certificates',
  'proven',
  'mastery',
  'videos',
  'books',
  'texts',
  'settings',
]

function SectionNavDot({ sectionId }: { sectionId: AdminTab }) {
  const { sectionStates } = useCms()
  if (!CMS_TABS.includes(sectionId as ContentSectionId)) return null
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
  deskChatUnread?: number
  onClose: () => void
  onSelectTab: (tab: AdminTab) => void
}

/** Mobile nav only — actions live in header / bottom bar, not here. */
export function AdminMobileDrawer({
  open,
  activeTab,
  deskChatUnread = 0,
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
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-theme-muted">
                  Content studio
                </p>
              </div>
              <button type="button" onClick={onClose} className="admin-sidebar-icon-btn" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <motion.nav
              className="admin-mobile-drawer-nav scrollbar-hide"
              variants={navStagger}
              initial="hidden"
              animate="show"
            >
              {ADMIN_NAV_GROUPS.map((section, sectionIndex) => (
                <div key={section.id} className={sectionIndex > 0 ? 'mt-4' : undefined}>
                  <p className="admin-sidebar-section-label">{section.label}</p>
                  {ADMIN_NAV.filter((item) => item.group === section.id).map((item) => {
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
                        {item.id === 'desk-chat' && deskChatUnread > 0 ? (
                          <span className="admin-nav-unread">{deskChatUnread > 9 ? '9+' : deskChatUnread}</span>
                        ) : null}
                      </motion.button>
                    )
                  })}
                </div>
              ))}
            </motion.nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
