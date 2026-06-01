import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { ADMIN_NAV, ADMIN_NAV_GROUPS, type AdminTab } from '@/admin/layout/adminNav'
import { useCms } from '@/cms/CmsProvider'
import type { ContentSectionId } from '@/cms/validation'
import { AdminMobileDrawer } from '@/components/admin/layout/AdminMobileDrawer'

type SidebarMode = 'expanded' | 'collapsed'

interface AdminSidebarProps {
  activeTab: AdminTab
  onSelectTab: (tab: AdminTab) => void
  mode: SidebarMode
  mobileOpen: boolean
  onCloseMobile: () => void
  onToggleCollapse: () => void
  showPreview: boolean
  onTogglePreview: () => void
  canCollapse: boolean
  deskChatUnread?: number
}

function SectionNavDot({ sectionId }: { sectionId: AdminTab }) {
  const { sectionStates } = useCms()
  if (sectionId === 'dashboard' || !['updates', 'upcoming', 'about', 'certificates', 'proven', 'mastery', 'videos', 'books', 'texts', 'settings'].includes(sectionId)) {
    return null
  }
  const state = sectionStates[sectionId as ContentSectionId]
  if (!state) return null

  let color = 'bg-emerald-400'
  if (!state.isValid) color = 'bg-rose-400'
  else if (state.status === 'draft') color = 'bg-amber-400'

  return (
    <span
      className={`ml-auto h-2 w-2 shrink-0 rounded-full ${color}`}
      title={state.status === 'draft' ? 'Draft changes' : state.isValid ? 'Published' : 'Needs attention'}
    />
  )
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  mode,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
  showPreview,
  onTogglePreview,
  canCollapse,
  deskChatUnread = 0,
}: AdminSidebarProps) {
  const collapsed = mode === 'collapsed'

  const navButton = (item: (typeof ADMIN_NAV)[number]) => {
    const Icon = item.icon
    const active = activeTab === item.id
    return (
      <button
        key={item.id}
        type="button"
        title={collapsed ? item.label : undefined}
        onClick={() => onSelectTab(item.id)}
        className={`admin-sidebar-nav-item ${active ? 'admin-sidebar-nav-item--active' : ''}`}
      >
        <span className="admin-sidebar-nav-icon">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        {!collapsed && (
          <>
            <span className="truncate">{item.label}</span>
            <SectionNavDot sectionId={item.id} />
            {item.id === 'desk-chat' && deskChatUnread > 0 ? (
              <span className="admin-nav-unread">{deskChatUnread > 9 ? '9+' : deskChatUnread}</span>
            ) : null}
          </>
        )}
      </button>
    )
  }

  const desktopSidebar = (
    <div className="flex h-full flex-col">
      <div className={`admin-sidebar-brand ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-gradient-brand">REAGLE FX</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-theme-muted">
              Content studio
            </p>
          </div>
        ) : (
          <p className="font-display text-xs font-bold text-theme-accent">FX</p>
        )}
        {canCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="admin-sidebar-icon-btn"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="admin-sidebar-nav scrollbar-hide">
        {ADMIN_NAV_GROUPS.map((section, index) => (
          <div key={section.id} className={index > 0 ? 'mt-4' : undefined}>
            {!collapsed && <p className="admin-sidebar-section-label">{section.label}</p>}
            {ADMIN_NAV.filter((n) => n.group === section.id).map(navButton)}
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button
          type="button"
          onClick={onTogglePreview}
          className={`admin-sidebar-footer-btn ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? (showPreview ? 'Hide preview' : 'Show preview') : undefined}
        >
          {showPreview ? <EyeOff className="h-4 w-4 shrink-0" /> : <Eye className="h-4 w-4 shrink-0" />}
          {!collapsed && <span>{showPreview ? 'Hide preview' : 'Show preview'}</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <motion.aside
        className={`admin-sidebar hidden md:flex ${collapsed ? 'admin-sidebar--collapsed' : ''}`}
        aria-label="Admin navigation"
      >
        {desktopSidebar}
      </motion.aside>

      <AdminMobileDrawer
        open={mobileOpen}
        activeTab={activeTab}
        deskChatUnread={deskChatUnread}
        onClose={onCloseMobile}
        onSelectTab={onSelectTab}
      />
    </>
  )
}
