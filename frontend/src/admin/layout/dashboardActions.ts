import type { LucideIcon } from 'lucide-react'
import {
  Megaphone,
  Newspaper,
  User,
  Award,
  TrendingUp,
  GraduationCap,
  Play,
  Type,
  Settings,
  Eye,
  Upload,
  Globe,
} from 'lucide-react'
import type { AdminTab } from './adminNav'

export type DashboardAction = {
  tab: AdminTab
  title: string
  description: string
  icon: LucideIcon
}

/** Clickable CMS tasks shown on the dashboard home. */
export const DASHBOARD_CONTENT_ACTIONS: DashboardAction[] = [
  {
    tab: 'updates',
    title: 'Daily updates',
    description: 'Post market news like stories / WhatsApp status',
    icon: Newspaper,
  },
  {
    tab: 'upcoming',
    title: 'Upcoming banners',
    description: 'Schedule promos and CTAs above the live chart',
    icon: Megaphone,
  },
  {
    tab: 'about',
    title: 'About coach',
    description: 'Photo, title, and bio for Coach Peter',
    icon: User,
  },
  {
    tab: 'certificates',
    title: 'Certificates',
    description: 'Upload credentials for the About carousel',
    icon: Award,
  },
  {
    tab: 'proven',
    title: 'Proven results',
    description: 'MT5 screenshots and result media',
    icon: TrendingUp,
  },
  {
    tab: 'mastery',
    title: 'What they master',
    description: 'Optional media on lesson cards',
    icon: GraduationCap,
  },
  {
    tab: 'videos',
    title: 'Teaching videos',
    description: 'Six reel slots for the videos section',
    icon: Play,
  },
  {
    tab: 'texts',
    title: 'Site texts',
    description: 'Override copy per language (EN, RW, FR, SW)',
    icon: Type,
  },
  {
    tab: 'settings',
    title: 'Settings',
    description: 'Show or hide sections on the public site',
    icon: Settings,
  },
]

export type DashboardWorkflowAction = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  action: 'preview' | 'publish' | 'view-site'
}

export const DASHBOARD_WORKFLOW_ACTIONS: DashboardWorkflowAction[] = [
  {
    id: 'preview',
    title: 'Live preview',
    description: 'See draft changes instantly',
    icon: Eye,
    action: 'preview',
  },
  {
    id: 'publish',
    title: 'Publish',
    description: 'Push validated draft to the live site',
    icon: Upload,
    action: 'publish',
  },
  {
    id: 'view-site',
    title: 'View live site',
    description: 'Open the public page in a new tab',
    icon: Globe,
    action: 'view-site',
  },
]
