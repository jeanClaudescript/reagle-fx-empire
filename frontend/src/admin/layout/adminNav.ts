import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Megaphone,
  User,
  Award,
  TrendingUp,
  GraduationCap,
  Play,
  Type,
  Settings,
} from 'lucide-react'

export type AdminTab =
  | 'dashboard'
  | 'upcoming'
  | 'about'
  | 'certificates'
  | 'proven'
  | 'mastery'
  | 'videos'
  | 'texts'
  | 'settings'

export type AdminNavItem = {
  id: AdminTab
  label: string
  icon: LucideIcon
  group?: 'main' | 'content' | 'system'
}

export const ADMIN_NAV: AdminNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { id: 'upcoming', label: 'Upcoming Banners', icon: Megaphone, group: 'content' },
  { id: 'about', label: 'About', icon: User, group: 'content' },
  { id: 'certificates', label: 'Certificates', icon: Award, group: 'content' },
  { id: 'proven', label: 'Proven Results', icon: TrendingUp, group: 'content' },
  { id: 'mastery', label: 'What They Master', icon: GraduationCap, group: 'content' },
  { id: 'videos', label: 'Teaching Videos', icon: Play, group: 'content' },
  { id: 'texts', label: 'Texts', icon: Type, group: 'content' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'system' },
]

export function getAdminNavLabel(tab: AdminTab) {
  return ADMIN_NAV.find((n) => n.id === tab)?.label ?? 'Dashboard'
}
