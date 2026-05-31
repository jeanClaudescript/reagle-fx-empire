import { useCallback, useEffect, useMemo, useState } from 'react'
import { isAdminAuthenticated, logoutAdmin } from '@/admin/auth'
import { useCms } from '@/cms/CmsProvider'
import { AdminToastProvider, useAdminToast } from '@/admin/toast'
import { AdminConfirmProvider, useAdminConfirm } from '@/admin/confirm'
import { CmsValidationProvider } from '@/admin/CmsValidationContext'
import { DailyUpdatesEditor } from '@/admin/editors/DailyUpdatesEditor'
import { UpcomingBannersEditor } from '@/admin/editors/UpcomingBannersEditor'
import { AboutEditor } from '@/admin/editors/AboutEditor'
import { CertificatesEditor } from '@/admin/editors/CertificatesEditor'
import { ProvenResultsEditor } from '@/admin/editors/ProvenResultsEditor'
import { MasteryEditor } from '@/admin/editors/MasteryEditor'
import { TeachingVideosEditor } from '@/admin/editors/TeachingVideosEditor'
import { VipBooksEditor } from '@/admin/editors/VipBooksEditor'
import { TextsEditor } from '@/admin/editors/TextsEditor'
import { SettingsEditor } from '@/admin/editors/SettingsEditor'
import { StudentsManageEditor } from '@/admin/editors/StudentsManageEditor'
import { PaymentsEditor } from '@/admin/editors/PaymentsEditor'
import { LiveSessionsEditor } from '@/admin/editors/LiveSessionsEditor'
import { ClassroomEditor } from '@/admin/editors/ClassroomEditor'
import { AdminDeskChatPanel } from '@/admin/editors/AdminDeskChatPanel'
import { ReferralsEditor } from '@/admin/editors/ReferralsEditor'
import { PaymentSettingsPanel } from '@/admin/editors/PaymentSettingsPanel'
import { EducationBooksEditor } from '@/admin/editors/EducationBooksEditor'
import { OpsSectionFrame } from '@/components/admin/OpsSectionFrame'
import { ContentHub } from '@/components/admin/ContentHub'
import { isContentSectionTab, isOpsTab } from '@/admin/layout/adminHubActions'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { AdminMobileActionBar } from '@/components/admin/layout/AdminMobileActionBar'
import { AdminPreviewPanel } from '@/components/admin/AdminPreviewPanel'
import { MediaViewerProvider } from '@/components/admin/media/MediaViewerContext'
import { AdminSectionFrame } from '@/components/admin/AdminSectionFrame'
import { AdminApiStatusBanner } from '@/components/admin/AdminApiStatusBanner'
import { useAdminDeskChatUnread } from '@/admin/useAdminDeskChatUnread'
import type { AdminTab } from '@/admin/layout/adminNav'
import { adminTabPath, getAdminNavLabel, readAdminTabFromHash } from '@/admin/layout/adminNav'
import type { ContentSectionId } from '@/cms/validation'

function PublishValidationBanner() {
  const { validationIssues } = useCms()
  if (validationIssues.length === 0) return null

  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
      <p className="text-sm font-semibold text-rose-400">Cannot publish incomplete content</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-theme-muted">
        {validationIssues.slice(0, 6).map((issue) => (
          <li key={`${issue.section}-${issue.field}`}>
            {getAdminNavLabel(issue.section)}: {issue.message}
          </li>
        ))}
        {validationIssues.length > 6 && (
          <li>…and {validationIssues.length - 6} more issue(s)</li>
        )}
      </ul>
    </div>
  )
}

function AdminDashboardInner() {
  const {
    isHydrated,
    hasDraftChanges,
    publishValidated,
    publishSectionValidated,
    undo,
    resetDraft,
    validationIssues,
    setValidationIssues,
  } = useCms()
  const { push } = useAdminToast()
  const { confirm } = useAdminConfirm()
  const [tab, setTab] = useState<AdminTab>(() => readAdminTabFromHash() ?? 'dashboard')
  const [showPreview, setShowPreview] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const { unread: deskChatUnread } = useAdminDeskChatUnread(tab)

  const selectTab = useCallback((id: AdminTab) => {
    setTab(id)
    setMobileNavOpen(false)
    window.history.pushState({ adminTab: id }, '', adminTabPath(id))
  }, [])

  useEffect(() => {
    const onPop = () => {
      setTab(readAdminTabFromHash() ?? 'dashboard')
      setMobileNavOpen(false)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      window.history.pushState({}, '', '/login?tab=admin')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')
    const apply = () => {
      if (mq.matches) setSidebarCollapsed(true)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (!mobileNavOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (mobileNavOpen) {
        setMobileNavOpen(false)
        return
      }
      if (tab !== 'dashboard') selectTab('dashboard')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileNavOpen, tab, selectTab])

  useEffect(() => {
    if (validationIssues.length === 0) return
    const section = validationIssues[0]?.section
    if (section && isContentSectionTab(section) && section !== tab) selectTab(section)
  }, [validationIssues, tab, selectTab])

  const syncLabel = hasDraftChanges
    ? 'Draft · not yet on live site'
    : 'Published · in sync with live site'

  const sidebarMode = sidebarCollapsed ? 'collapsed' : 'expanded'

  const handlePublish = useCallback(async () => {
    const ok = await confirm({
      title: 'Publish changes?',
      message: 'Validated content will go live immediately on the public site.',
      confirmLabel: 'Publish',
    })
    if (!ok) return

    setIsPublishing(true)
    push('Validating content…', 'info')

    await new Promise((r) => window.setTimeout(r, 280))

    const result = publishValidated()
    setIsPublishing(false)

    if (!result.ok) {
      push('Cannot publish incomplete content', 'error')
      return
    }

    push('Publishing…', 'info')
    window.setTimeout(() => push('Successfully published', 'success'), 320)
  }, [confirm, publishValidated, push])

  const handleStickyPublish = useCallback(async () => {
    if (isContentSectionTab(tab)) {
      const section = tab as ContentSectionId
      const label = getAdminNavLabel(section)
      const ok = await confirm({
        title: `Publish ${label}?`,
        message: 'Only this section will go live. Other sections stay as they are on the site.',
        confirmLabel: 'Publish section',
      })
      if (!ok) return

      setIsPublishing(true)
      push(`Validating ${label}…`, 'info')
      await new Promise((r) => window.setTimeout(r, 200))

      const result = publishSectionValidated(section)
      setIsPublishing(false)

      if (!result.ok) {
        push('Cannot publish — fix the highlighted fields.', 'error')
        return
      }

      push(`${label} published to live site.`, 'success')
      return
    }

    void handlePublish()
  }, [confirm, handlePublish, publishSectionValidated, push, tab])

  const stickyPublishLabel = isContentSectionTab(tab) ? 'Publish section' : 'Publish all'

  const handleWorkflowFixed = useCallback(
    (action: 'preview' | 'publish' | 'view-site') => {
      if (action === 'preview') {
        setShowPreview(true)
        push('Live preview opened', 'info')
        return
      }
      if (action === 'view-site') {
        window.open('/', '_blank', 'noopener,noreferrer')
        return
      }
      void handlePublish()
    },
    [handlePublish, push],
  )

  const goDashboard = useCallback(() => selectTab('dashboard'), [selectTab])

  const tabContent = useMemo(() => {
    if (tab === 'dashboard') {
      return <ContentHub onNavigate={selectTab} onWorkflow={handleWorkflowFixed} />
    }

    if (isOpsTab(tab)) {
      const opsEditors: Record<string, React.ReactNode> = {
        students: <StudentsManageEditor />,
        payments: <PaymentsEditor embedded />,
        live: <LiveSessionsEditor />,
        classroom: <ClassroomEditor />,
        'desk-chat': <AdminDeskChatPanel />,
        referrals: <ReferralsEditor />,
        'pay-settings': <PaymentSettingsPanel />,
        education: <EducationBooksEditor />,
      }
      return (
        <OpsSectionFrame tab={tab} onBack={goDashboard}>
          {opsEditors[tab]}
        </OpsSectionFrame>
      )
    }

    if (!isContentSectionTab(tab)) return null

    const section = tab
    const editors: Record<ContentSectionId, React.ReactNode> = {
      updates: <DailyUpdatesEditor />,
      upcoming: <UpcomingBannersEditor />,
      about: <AboutEditor />,
      certificates: <CertificatesEditor />,
      proven: <ProvenResultsEditor />,
      mastery: <MasteryEditor />,
      videos: <TeachingVideosEditor />,
      books: <VipBooksEditor />,
      texts: <TextsEditor />,
      settings: <SettingsEditor />,
    }
    const editor = editors[section]

    return (
      <AdminSectionFrame section={section} onBack={goDashboard}>
        {editor}
      </AdminSectionFrame>
    )
  }, [tab, handleWorkflowFixed, goDashboard, selectTab])

  const handleUndo = useCallback(async () => {
    const ok = await confirm({
      title: 'Undo last publish?',
      message: 'The site will revert to the previous published version.',
      confirmLabel: 'Undo publish',
      variant: 'danger',
    })
    if (!ok) return
    undo()
    setValidationIssues([])
    push('Reverted to previous published version.', 'success')
  }, [confirm, undo, push, setValidationIssues])

  const handleReset = useCallback(async () => {
    const ok = await confirm({
      title: 'Reset draft?',
      message: 'Your draft will revert to the last published content. Unpublished edits will be lost.',
      confirmLabel: 'Reset draft',
      variant: 'danger',
    })
    if (!ok) return
    resetDraft()
    setValidationIssues([])
    push('Draft reset to published content.', 'info')
  }, [confirm, resetDraft, push, setValidationIssues])

  const handleLogout = useCallback(async () => {
    const ok = await confirm({
      title: 'Log out?',
      message: 'You will need to sign in again to access the CMS.',
      confirmLabel: 'Log out',
      variant: 'danger',
    })
    if (!ok) return
    await logoutAdmin()
    window.location.pathname = '/admin-login'
  }, [confirm])

  const handleSaveDraft = useCallback(() => {
    push('Draft saved in this browser.', 'success')
  }, [push])

  return (
    <div
      className={`admin-app ${sidebarCollapsed ? 'admin-app--sidebar-collapsed' : ''} ${tab === 'desk-chat' ? 'admin-app--desk-chat' : ''}`}
    >
      <div className="admin-app-bg pointer-events-none" aria-hidden>
        <div className="glow-orb -left-40 top-20 h-96 w-96 bg-empire-purple/20" />
        <div className="glow-orb -right-20 bottom-20 h-80 w-80 bg-empire-blue/15" />
      </div>

      <AdminSidebar
        activeTab={tab}
        onSelectTab={selectTab}
        mode={sidebarMode}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview((v) => !v)}
        canCollapse
        syncLabel={syncLabel}
        hasDraftChanges={hasDraftChanges}
        deskChatUnread={deskChatUnread}
      />

      <div className="admin-main">
        <AdminHeader
          activeTab={tab}
          syncLabel={syncLabel}
          hasDraftChanges={hasDraftChanges}
          isHydrated={isHydrated && !isPublishing}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onTogglePreviewPanel={() => setShowPreview((v) => !v)}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onUndo={handleUndo}
          onReset={handleReset}
          onLogout={handleLogout}
        />

        <div className="admin-content-area">
          <div className="admin-content-inner">
            <AdminApiStatusBanner />
            <PublishValidationBanner />
            <AdminPreviewPanel visible={showPreview} />

            {!isHydrated ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-44 rounded-3xl border border-theme bg-theme-surface/50 p-4"
                  >
                    <div className="cms-shimmer h-4 w-2/3 rounded" />
                    <div className="cms-shimmer mt-3 h-3 w-full rounded" />
                    <div className="cms-shimmer mt-2 h-3 w-4/5 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              tabContent
            )}
          </div>
        </div>

        <AdminMobileActionBar
          isHydrated={isHydrated && !isPublishing}
          showPreview={showPreview}
          publishLabel={stickyPublishLabel}
          onTogglePreview={() => setShowPreview((v) => !v)}
          onSaveDraft={handleSaveDraft}
          onPublish={handleStickyPublish}
        />
      </div>
    </div>
  )
}

export function AdminDashboard() {
  return (
    <AdminToastProvider>
      <AdminConfirmProvider>
        <CmsValidationProvider>
          <MediaViewerProvider>
            <AdminDashboardInner />
          </MediaViewerProvider>
        </CmsValidationProvider>
      </AdminConfirmProvider>
    </AdminToastProvider>
  )
}
