import type { LucideIcon } from 'lucide-react'
import {
  Award,
  CreditCard,
  GraduationCap,
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
import type { AdminTab } from './adminNav'
import type { ContentSectionId } from '@/cms/validation'

export type HubCategory = 'all' | 'website' | 'operations' | 'system'

export type HubCard = {
  tab: AdminTab
  title: string
  description: string
  icon: LucideIcon
  category: Exclude<HubCategory, 'all'>
  accent?: 'purple' | 'emerald' | 'amber' | 'sky' | 'rose'
}

export const HUB_CATEGORIES: { id: HubCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'website', label: 'Website' },
  { id: 'operations', label: 'Students & money' },
  { id: 'system', label: 'System' },
]

/** Every area CoachPeter can manage — one content hub. */
export const ADMIN_HUB_CARDS: HubCard[] = [
  {
    tab: 'updates',
    title: 'Daily updates',
    description: 'Market news strip on the homepage hero',
    icon: Newspaper,
    category: 'website',
    accent: 'sky',
  },
  {
    tab: 'upcoming',
    title: 'Upcoming banners',
    description: 'Promos and CTAs above the chart',
    icon: Megaphone,
    category: 'website',
    accent: 'purple',
  },
  {
    tab: 'about',
    title: 'About coach',
    description: 'Photo, title, and bio',
    icon: User,
    category: 'website',
    accent: 'purple',
  },
  {
    tab: 'certificates',
    title: 'Certificates',
    description: 'Credentials carousel',
    icon: Award,
    category: 'website',
    accent: 'amber',
  },
  {
    tab: 'proven',
    title: 'Proven results',
    description: 'MT5 screenshots and wins',
    icon: TrendingUp,
    category: 'website',
    accent: 'emerald',
  },
  {
    tab: 'mastery',
    title: 'What they master',
    description: 'Lesson cards media',
    icon: GraduationCap,
    category: 'website',
    accent: 'sky',
  },
  {
    tab: 'videos',
    title: 'Teaching videos',
    description: 'Six reel slots',
    icon: Play,
    category: 'website',
    accent: 'rose',
  },
  {
    tab: 'texts',
    title: 'Site texts',
    description: 'Copy overrides per language',
    icon: Type,
    category: 'website',
    accent: 'purple',
  },
  {
    tab: 'students',
    title: 'Students',
    description: 'Paid vs unpaid · pending pay · referrals · grant access',
    icon: Users,
    category: 'operations',
    accent: 'emerald',
  },
  {
    tab: 'payments',
    title: 'Payments',
    description: 'Approve MoMo, transaction IDs',
    icon: CreditCard,
    category: 'operations',
    accent: 'amber',
  },
  {
    tab: 'live',
    title: 'Live class',
    description: 'Stream URL, signals, meeting link',
    icon: Radio,
    category: 'operations',
    accent: 'rose',
  },
  {
    tab: 'classroom',
    title: 'Trading classroom',
    description: 'Shared chart, voice & live chat',
    icon: GraduationCap,
    category: 'operations',
    accent: 'emerald',
  },
  {
    tab: 'desk-chat',
    title: 'VIP messages',
    description: 'Community chat & student DMs',
    icon: MessageCircle,
    category: 'operations',
    accent: 'sky',
  },
  {
    tab: 'referrals',
    title: 'Referrals',
    description: 'Rewards when friends pay',
    icon: Share2,
    category: 'operations',
    accent: 'sky',
  },
  {
    tab: 'pay-settings',
    title: 'MoMo settings',
    description: 'Merchant number, USSD, amounts',
    icon: Wallet,
    category: 'operations',
    accent: 'purple',
  },
  {
    tab: 'settings',
    title: 'Site settings',
    description: 'Section visibility, messages, admins',
    icon: Settings,
    category: 'system',
    accent: 'purple',
  },
]

export function isContentSectionTab(tab: AdminTab): tab is ContentSectionId {
  return [
    'updates',
    'upcoming',
    'about',
    'certificates',
    'proven',
    'mastery',
    'videos',
    'texts',
    'settings',
  ].includes(tab)
}

export function isOpsTab(tab: AdminTab): boolean {
  return ['students', 'payments', 'live', 'classroom', 'desk-chat', 'referrals', 'pay-settings'].includes(tab)
}
