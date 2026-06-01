import { Menu, MoreHorizontal, ExternalLink, HelpCircle } from 'lucide-react'
import { getAdminNavLabel, type AdminTab } from '@/admin/layout/adminNav'
import {
  getAdminBreadcrumbRoot,
  showAdminWorkflowActions,
  showCmsPublishInHeader,
} from '@/admin/layout/adminPageMode'
import { isContentSectionTab } from '@/admin/layout/adminHubActions'
import { AdminThemeToggle } from '@/components/admin/AdminThemeToggle'
import { AdminLanguageSwitcher } from '@/components/admin/AdminLanguageSwitcher'

interface AdminHeaderProps {
  activeTab: AdminTab
  hasDraftChanges: boolean
  isHydrated: boolean
  onOpenMobileNav: () => void
  onTogglePreviewPanel: () => void
  onSaveDraft: () => void
  onPublish: () => void
  onUndo: () => void
  onReset: () => void
  onLogout: () => void
  onOpenHelp: () => void
}

export function AdminHeader({
  activeTab,
  hasDraftChanges,
  isHydrated,
  onOpenMobileNav,
  onTogglePreviewPanel,
  onSaveDraft,
  onPublish,
  onUndo,
  onReset,
  onLogout,
  onOpenHelp,
}: AdminHeaderProps) {
  const pageTitle = getAdminNavLabel(activeTab)
  const breadcrumbRoot = getAdminBreadcrumbRoot(activeTab)
  const showPublish = showCmsPublishInHeader(activeTab)
  const showWorkflow = showAdminWorkflowActions(activeTab, hasDraftChanges)
  const isCmsSection = isContentSectionTab(activeTab)

  return (
    <header className="admin-header">
      <div className="admin-header-start">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="admin-header-icon-btn md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <nav className="admin-breadcrumb" aria-label="Breadcrumb">
            <span>{breadcrumbRoot}</span>
            <span className="admin-breadcrumb-sep">/</span>
            <span className="text-theme-primary">{pageTitle}</span>
          </nav>
        </div>
      </div>

      <div className="admin-header-actions hidden lg:flex">
        <AdminLanguageSwitcher compact />
        <AdminThemeToggle />
        <button type="button" className="admin-header-icon-btn" onClick={onOpenHelp} aria-label="Keyboard shortcuts">
          <HelpCircle className="h-5 w-5" />
        </button>
        <a href="/" target="_blank" rel="noopener noreferrer" className="admin-btn-ghost">
          <ExternalLink className="h-4 w-4" />
          View live site
        </a>
        {showWorkflow ? (
          <>
            <button type="button" className="admin-btn-secondary" onClick={onTogglePreviewPanel}>
              Preview
            </button>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={onSaveDraft}
              disabled={!isHydrated}
            >
              Save draft
            </button>
            <button
              type="button"
              className="admin-btn-primary"
              onClick={onPublish}
              disabled={!isHydrated}
            >
              Publish website
            </button>
          </>
        ) : null}
        <details className="admin-more-menu relative">
          <summary className="admin-header-icon-btn list-none cursor-pointer [&::-webkit-details-marker]:hidden">
            <MoreHorizontal className="h-5 w-5" />
          </summary>
          <div className="admin-more-dropdown">
            {showPublish ? (
              <>
                <button type="button" onClick={onUndo} disabled={!isHydrated}>
                  Undo publish
                </button>
                <button type="button" onClick={onReset} disabled={!isHydrated}>
                  Reset draft
                </button>
              </>
            ) : null}
            <button type="button" onClick={onLogout} className="text-rose-400">
              Logout
            </button>
          </div>
        </details>
      </div>

      <div className="flex items-center gap-2 lg:hidden">
        <AdminLanguageSwitcher compact />
        <AdminThemeToggle />
        <button type="button" className="admin-header-icon-btn" onClick={onOpenHelp} aria-label="Help">
          <HelpCircle className="h-5 w-5" />
        </button>
        <details className="admin-more-menu relative">
          <summary className="admin-header-icon-btn list-none cursor-pointer [&::-webkit-details-marker]:hidden">
            <MoreHorizontal className="h-5 w-5" />
          </summary>
          <div className="admin-more-dropdown admin-more-dropdown--mobile">
            <a href="/" target="_blank" rel="noopener noreferrer" className="admin-btn-ghost w-full">
              View live site
            </a>
            {showWorkflow && !isCmsSection ? (
              <button type="button" onClick={onTogglePreviewPanel}>
                Preview
              </button>
            ) : null}
            {showWorkflow && !isCmsSection ? (
              <button type="button" onClick={onSaveDraft} disabled={!isHydrated}>
                Save
              </button>
            ) : null}
            {showPublish ? (
              <>
                <button type="button" onClick={onUndo} disabled={!isHydrated}>
                  Undo publish
                </button>
                <button type="button" onClick={onReset} disabled={!isHydrated}>
                  Reset draft
                </button>
              </>
            ) : null}
            <button type="button" onClick={onLogout} className="text-rose-400">
              Logout
            </button>
          </div>
        </details>
      </div>
    </header>
  )
}
