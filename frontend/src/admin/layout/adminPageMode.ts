import type { AdminTab } from '@/admin/layout/adminNav'
import { getAdminNavGroup } from '@/admin/layout/adminNav'
import { isContentSectionTab, isOpsTab } from '@/admin/layout/adminHubActions'

export type AdminMobileBarMode = 'hidden' | 'dashboard' | 'cms'

export function getAdminBreadcrumbRoot(tab: AdminTab): string {
  const group = getAdminNavGroup(tab)
  if (group === 'overview') return 'Hub'
  if (group === 'website') return 'Website'
  if (group === 'operations') return 'Operations'
  return 'System'
}

export function getAdminMobileBarMode(tab: AdminTab): AdminMobileBarMode {
  if (tab === 'desk-chat' || isOpsTab(tab)) return 'hidden'
  if (isContentSectionTab(tab)) return 'cms'
  if (tab === 'dashboard') return 'dashboard'
  return 'hidden'
}

export function showCmsPublishInHeader(tab: AdminTab): boolean {
  return tab === 'dashboard' || isContentSectionTab(tab)
}
