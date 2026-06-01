import { useEffect, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Crown,
  Globe,
  LogOut,
  Menu,
  MessageCircle,
  Shield,
  Sparkles,
} from 'lucide-react'
import { FreeRegularCommunityChat } from '@/components/student/free/FreeRegularCommunityChat'
import { refreshAppSocketAuth } from '@/realtime/appSocket'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { VipDailyLessonPanel } from '@/components/student/vip/VipDailyLessonPanel'
import { PipCalculator } from '@/components/forex/tools/PipCalculator'
import { PositionSizeCalculator } from '@/components/forex/tools/PositionSizeCalculator'
import { RiskRewardCalculator } from '@/components/forex/tools/RiskRewardCalculator'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ReferralShareCard } from '@/components/referral/ReferralShareCard'
import { GlowButton } from '@/components/ui/GlowButton'

type FreePanelId = 'overview' | 'community-chat' | 'daily-lessons' | 'pip' | 'position' | 'rr' | 'account'

const FREE_PANEL_IDS = new Set<FreePanelId>([
  'overview',
  'community-chat',
  'daily-lessons',
  'pip',
  'position',
  'rr',
  'account',
])

function readPanelFromHash(): FreePanelId | null {
  const match = window.location.hash.match(/^#panel=([a-z-]+)$/)
  if (!match) return null
  const id = match[1] as FreePanelId
  return FREE_PANEL_IDS.has(id) ? id : null
}

function PanelWrap({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="vip-panel">
      <h2 className="vip-panel__title">{title}</h2>
      {children}
    </div>
  )
}

function ToolCard({ children }: { children: ReactNode }) {
  return <div className="vip-tool-card">{children}</div>
}

export function FreeStudentDeskShell() {
  const { t } = useLanguage()
  const fd = t.freeDesk
  const { contact, referralCode, logout } = useStudentAccess()
  const [panel, setPanel] = useState<FreePanelId>(() => readPanelFromHash() ?? 'overview')
  const [navOpen, setNavOpen] = useState(false)

  const selectPanel = (id: FreePanelId) => {
    setPanel(id)
    setNavOpen(false)
    const path = id === 'overview' ? '/desk' : `/desk#panel=${id}`
    window.history.pushState({ freePanel: id }, '', path)
  }

  useEffect(() => {
    document.body.classList.add('vip-desk-active')
    refreshAppSocketAuth()
    return () => document.body.classList.remove('vip-desk-active')
  }, [])

  useEffect(() => {
    if (panel === 'community-chat') refreshAppSocketAuth()
  }, [panel])

  useEffect(() => {
    const onPop = () => {
      setPanel(readPanelFromHash() ?? 'overview')
      setNavOpen(false)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const goPublicSite = () => {
    window.history.pushState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const goPay = () => {
    window.history.pushState({}, '', '/pay')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const displayName = contact?.name?.trim() || contact?.phone || contact?.email || fd.traderFallback

  const renderPanel = () => {
    switch (panel) {
      case 'overview':
        return (
          <div className="vip-overview">
            <div className="vip-overview__hero vip-overview__hero--compact">
              <p className="text-sm text-theme-muted">{t.vip.welcome}</p>
              <h2 className="mt-0.5 font-display text-xl font-bold text-theme-primary sm:text-2xl">
                {displayName}
              </h2>
            </div>
            <p className="mt-2 text-sm text-theme-muted">{fd.overviewSubtitle}</p>
            <div className="mt-6 rounded-2xl border border-theme-accent/30 bg-theme-accent/10 p-5">
              <p className="font-display text-lg font-bold text-theme-primary">{fd.upgradeTitle}</p>
              <p className="mt-2 text-sm text-theme-muted">{fd.upgradeBody}</p>
              <GlowButton variant="primary" external={false} className="mt-4" onClick={goPay}>
                <Crown className="h-4 w-4" />
                {fd.upgradeCta}
              </GlowButton>
            </div>
            {referralCode ? (
              <div className="mt-6">
                <ReferralShareCard code={referralCode} />
              </div>
            ) : null}
            <div className="vip-overview__grid">
              <button type="button" className="vip-stat-card" onClick={() => selectPanel('daily-lessons')}>
                <span className="flex flex-col items-start gap-1">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-theme-accent" />
                    <span className="font-semibold text-theme-primary">{t.dailyLessons.navTitle}</span>
                  </span>
                  <span className="text-xs text-theme-muted">{fd.dailyHint}</span>
                </span>
              </button>
              <button type="button" className="vip-stat-card" onClick={() => selectPanel('community-chat')}>
                <span className="flex flex-col items-start gap-1">
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-theme-accent" />
                    <span className="font-semibold text-theme-primary">{t.chat.regularCommunityTitle}</span>
                  </span>
                  <span className="text-xs text-theme-muted">{fd.communityHint}</span>
                </span>
              </button>
              <button type="button" className="vip-stat-card" onClick={() => selectPanel('pip')}>
                <span className="flex flex-col items-start gap-1">
                  <span className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-theme-accent" />
                    <span className="font-semibold text-theme-primary">{t.tools.pipTitle}</span>
                  </span>
                  <span className="text-xs text-theme-muted">{fd.toolsHint}</span>
                </span>
              </button>
            </div>
          </div>
        )
      case 'community-chat':
        return (
          <div className="vip-panel vip-panel--chat">
            <FreeRegularCommunityChat />
          </div>
        )
      case 'daily-lessons':
        return <VipDailyLessonPanel />
      case 'pip':
        return (
          <PanelWrap title={t.tools.pipTitle}>
            <ToolCard>
              <PipCalculator />
            </ToolCard>
          </PanelWrap>
        )
      case 'position':
        return (
          <PanelWrap title={t.tools.positionTitle}>
            <ToolCard>
              <PositionSizeCalculator />
            </ToolCard>
          </PanelWrap>
        )
      case 'rr':
        return (
          <PanelWrap title={t.tools.rrTitle}>
            <ToolCard>
              <RiskRewardCalculator />
            </ToolCard>
          </PanelWrap>
        )
      case 'account':
        return (
          <PanelWrap title={t.vip.accountTitle}>
            <div className="vip-account-card">
              <p className="text-sm text-theme-muted">{t.vip.signedInAs}</p>
              <p className="mt-1 font-display text-lg font-bold text-theme-primary">{displayName}</p>
              <p className="mt-2 text-sm text-theme-muted">{fd.accountFreeNote}</p>
              {referralCode ? (
                <div className="mt-4">
                  <ReferralShareCard code={referralCode} />
                </div>
              ) : null}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <GlowButton variant="primary" external={false} onClick={goPay}>
                  {fd.upgradeCta}
                </GlowButton>
                <button type="button" className="vip-btn vip-btn--ghost" onClick={goPublicSite}>
                  <Globe className="h-4 w-4" />
                  {t.vip.backToSite}
                </button>
                <button type="button" className="vip-btn vip-btn--danger" onClick={() => void logout()}>
                  <LogOut className="h-4 w-4" />
                  {t.studentLogin.logout}
                </button>
              </div>
            </div>
          </PanelWrap>
        )
      default:
        return null
    }
  }

  const isChatPanel = panel === 'community-chat'

  const navItems: { id: FreePanelId; label: string; icon: typeof Sparkles }[] = [
    { id: 'overview', label: t.vip.navOverview, icon: Sparkles },
    { id: 'community-chat', label: t.chat.regularCommunityNav, icon: MessageCircle },
    { id: 'daily-lessons', label: t.dailyLessons.navTitle, icon: BookOpen },
    { id: 'pip', label: t.tools.pipTitle, icon: Shield },
    { id: 'position', label: t.tools.positionTitle, icon: Shield },
    { id: 'rr', label: t.tools.rrTitle, icon: Shield },
    { id: 'account', label: t.vip.navAccount, icon: BookOpen },
  ]

  const navContent = (
    <nav className="vip-nav" aria-label={fd.navLabel}>
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            className={`vip-nav__item ${panel === item.id ? 'vip-nav__item--active' : ''}`}
            onClick={() => selectPanel(item.id)}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        )
      })}
      <button type="button" className="vip-nav__back" onClick={goPublicSite}>
        <ArrowLeft className="h-4 w-4" />
        {t.vip.backToSite}
      </button>
    </nav>
  )

  return (
    <div className={`vip-desk ${isChatPanel ? 'vip-desk--chat-panel' : ''}`}>
      <header className="vip-desk__header">
        <div className="vip-desk__header-inner">
          <button
            type="button"
            className="vip-desk__menu-btn lg:hidden"
            onClick={() => setNavOpen((v) => !v)}
            aria-label={navOpen ? t.vip.menuClose : t.vip.menuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="vip-badge vip-badge--free">{fd.badge}</p>
            <h1 className="truncate font-display text-lg font-bold text-theme-primary sm:text-xl">{fd.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="vip-desk__body">
        <aside className={`vip-desk__sidebar ${navOpen ? 'vip-desk__sidebar--open' : ''}`}>{navContent}</aside>
        {navOpen ? (
          <button
            type="button"
            className="vip-desk__overlay lg:hidden"
            aria-label={t.vip.menuClose}
            onClick={() => setNavOpen(false)}
          />
        ) : null}
        <main className="vip-desk__main">
          {panel !== 'overview' && panel !== 'community-chat' ? (
            <div className="vip-desk__panel-bar">
              <button type="button" className="vip-desk__panel-back" onClick={() => selectPanel('overview')}>
                <ArrowLeft className="h-4 w-4" />
                {t.vip.navOverview}
              </button>
            </div>
          ) : null}
          {renderPanel()}
        </main>
      </div>
    </div>
  )
}
