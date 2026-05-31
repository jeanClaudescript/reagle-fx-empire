import { BookOpen, Menu, MessageCircle, Radio, Sparkles } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import type { VipPanelId } from '@/components/student/vip/VipDeskShell'

const TABS: { id: VipPanelId | 'menu'; labelKey: string; icon: typeof Sparkles }[] = [
  { id: 'overview', labelKey: 'navOverview', icon: Sparkles },
  { id: 'daily-lessons', labelKey: 'dailyLessons.navTitle', icon: BookOpen },
  { id: 'live', labelKey: 'quickLive', icon: Radio },
  { id: 'community-chat', labelKey: 'communityTitle', icon: MessageCircle },
  { id: 'menu', labelKey: 'navLabel', icon: Menu },
]

type Props = {
  active: VipPanelId
  onSelect: (id: VipPanelId) => void
  onOpenMenu: () => void
  unreadMessages?: number
}

export function VipMobileBottomNav({ active, onSelect, onOpenMenu, unreadMessages }: Props) {
  const { t } = useLanguage()

  const label = (key: string) => {
    if (key === 'navOverview') return t.vip.navOverview
    if (key === 'dailyLessons.navTitle') return t.dailyLessons.navTitle
    if (key === 'quickLive') return t.vip.quickLive
    if (key === 'communityTitle') return t.chat.communityTitle.split(' ')[0]
    return 'Menu'
  }

  return (
    <nav className="vip-mobile-nav" aria-label={t.vip.navLabel}>
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isMenu = tab.id === 'menu'
        const isActive = !isMenu && active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            className={`vip-mobile-nav__item ${isActive ? 'vip-mobile-nav__item--active' : ''}`}
            onClick={() => (isMenu ? onOpenMenu() : onSelect(tab.id as VipPanelId))}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {tab.id === 'community-chat' && unreadMessages ? (
                <span className="vip-mobile-nav__badge">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
              ) : null}
            </span>
            <span>{label(tab.labelKey)}</span>
          </button>
        )
      })}
    </nav>
  )
}
