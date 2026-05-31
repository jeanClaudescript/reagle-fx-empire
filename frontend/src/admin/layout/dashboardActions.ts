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
    title: 'Banners',
    description: 'Schedule promos and CTAs above the live chart',
    icon: Megaphone,
  },
  {
    tab: 'about',
    title: 'About',
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
    title: 'Lessons',
    description: 'Optional media on lesson cards',
    icon: GraduationCap,
  },
  {
    tab: 'videos',
    title: 'Videos',
    description: 'Six reel slots for the videos section',
    icon: Play,
  },
  {
    tab: 'texts',
    title: 'Texts',
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
    title: 'Preview draft',
    description: 'See draft changes before students do',
    icon: Eye,
    action: 'preview',
  },
  {
    id: 'publish',
    title: 'Publish website',
    description: 'Push all validated draft sections live',
    icon: Upload,
    action: 'publish',
  },
  {
    id: 'view-site',
    title: 'View live site',
    description: 'Open what students see right now',
    icon: Globe,
    action: 'view-site',
  },
]
