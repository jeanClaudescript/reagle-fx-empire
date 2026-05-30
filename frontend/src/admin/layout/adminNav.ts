import type { LucideIcon } from 'lucide-react'
import {
  Award,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Newspaper,
  Play,
  Radio,
  Settings,
  Share2,
  TrendingUp,
  Type,
  User,
  Users,
  Wallet,
} from 'lucide-react'

export type AdminTab =
  | 'dashboard'
  | 'updates'
  | 'upcoming'
  | 'about'
  | 'certificates'
  | 'proven'
  | 'mastery'
  | 'videos'
  | 'texts'
  | 'students'
  | 'payments'
  | 'live'
  | 'classroom'
  | 'desk-chat'
  | 'referrals'
  | 'pay-settings'
  | 'settings'

export type AdminNavGroup = 'overview' | 'website' | 'operations' | 'system'

export type AdminNavItem = {
  id: AdminTab
  label: string
  icon: LucideIcon
  group: AdminNavGroup
}

export const ADMIN_NAV: AdminNavItem[] = [
  { id: 'dashboard', label: 'Content hub', icon: LayoutDashboard, group: 'overview' },
  { id: 'updates', label: 'Daily updates', icon: Newspaper, group: 'website' },
  { id: 'upcoming', label: 'Banners', icon: Megaphone, group: 'website' },
  { id: 'about', label: 'About', icon: User, group: 'website' },
  { id: 'certificates', label: 'Certificates', icon: Award, group: 'website' },
  { id: 'proven', label: 'Proven results', icon: TrendingUp, group: 'website' },
  { id: 'mastery', label: 'Lessons', icon: GraduationCap, group: 'website' },
  { id: 'videos', label: 'Videos', icon: Play, group: 'website' },
  { id: 'texts', label: 'Texts', icon: Type, group: 'website' },
  { id: 'students', label: 'Students', icon: Users, group: 'operations' },
  { id: 'payments', label: 'Payments', icon: CreditCard, group: 'operations' },
  { id: 'live', label: 'Live class', icon: Radio, group: 'operations' },
  { id: 'classroom', label: 'Trading classroom', icon: GraduationCap, group: 'operations' },
  { id: 'desk-chat', label: 'VIP messages', icon: MessageCircle, group: 'operations' },
  { id: 'referrals', label: 'Referrals', icon: Share2, group: 'operations' },
  { id: 'pay-settings', label: 'MoMo settings', icon: Wallet, group: 'operations' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'system' },
]

export function getAdminNavLabel(tab: AdminTab) {
  return ADMIN_NAV.find((n) => n.id === tab)?.label ?? 'Content hub'
}
