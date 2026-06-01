import { useEffect, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  ChevronDown,
  Crown,
  Globe,
  LineChart,
  LogOut,
  Menu,
  Radio,
  Shield,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { LiveTradingRoom } from '@/components/sections/LiveTradingRoom'
import { MarketWatch } from '@/components/forex/tools/MarketWatch'
import { SessionClock } from '@/components/forex/tools/SessionClock'
import { EconomicCalendar } from '@/components/forex/tools/EconomicCalendar'
import { DeskChart } from '@/components/forex/tools/DeskChart'
import { LiveSignalBoard } from '@/components/forex/tools/LiveSignalBoard'
import { PipCalculator } from '@/components/forex/tools/PipCalculator'
import { PositionSizeCalculator } from '@/components/forex/tools/PositionSizeCalculator'
import { RiskRewardCalculator } from '@/components/forex/tools/RiskRewardCalculator'
import { MarginCalculator } from '@/components/forex/tools/MarginCalculator'
import { BreakEvenCalculator } from '@/components/forex/tools/BreakEvenCalculator'
import { CompoundingCalculator } from '@/components/forex/tools/CompoundingCalculator'
import { LotConverter } from '@/components/forex/tools/LotConverter'
import { PivotCalculator } from '@/components/forex/tools/PivotCalculator'
import { FibonacciCalculator } from '@/components/forex/tools/FibonacciCalculator'
import { TradeJournal } from '@/components/forex/tools/TradeJournal'
import { PaperTradingDesk } from '@/components/forex/tools/PaperTradingDesk'
import { VipOverviewPanel } from '@/components/student/vip/VipOverviewPanel'
import { VipBooksPanel } from '@/components/student/vip/VipBooksPanel'
import { VipDailyLessonPanel } from '@/components/student/vip/VipDailyLessonPanel'
import { VipClassroomPanel } from '@/components/student/vip/VipClassroomPanel'
import { ForexNews } from '@/components/forex/tools/ForexNews'
import { VipCommunityChat } from '@/components/student/vip/VipCommunityChat'
import { VipCoachChat } from '@/components/student/vip/VipCoachChat'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ReferralShareCard } from '@/components/referral/ReferralShareCard'
import { classroomApi } from '@/services/api'
import { onClassroomUpdated } from '@/realtime/appSocket'
import { VipActivityProvider, useVipActivity } from '@/vip/VipActivityProvider'
import { EngagementProvider } from '@/engagement/EngagementProvider'
import { NotificationBell } from '@/components/engagement/NotificationBell'
import { NotificationCenter } from '@/components/engagement/NotificationCenter'
import { LiveToastNotifications } from '@/components/engagement/LiveToastNotifications'
import { WhatsNewModal } from '@/components/engagement/WhatsNewModal'
import { AnnouncementBanner } from '@/components/engagement/AnnouncementBanner'
import { VipAlertStack } from '@/components/student/vip/VipAlertStack'
import { VipMembershipBanner } from '@/components/student/vip/VipMembershipBanner'
import { VipAccessTip } from '@/components/student/vip/VipAccessTip'
import { VipMobileBottomNav } from '@/components/student/vip/VipMobileBottomNav'
import { isSignalNew } from '@/vip/vipSignalTracking'

export type VipPanelId =
  | 'overview'
  | 'live'
  | 'classroom'
  | 'community-chat'
  | 'coach-chat'
  | 'signals'
  | 'watch'
  | 'chart'
  | 'session'
  | 'calendar'
  | 'news'
  | 'books'
  | 'daily-lessons'
  | 'position'
  | 'rr'
  | 'pip'
  | 'margin'
  | 'breakeven'
  | 'compound'
  | 'lots'
  | 'pivot'
  | 'fib'
  | 'journal'
  | 'paper'
  | 'account'

const VIP_PANEL_IDS = new Set<VipPanelId>([
  'overview',
  'live',
  'classroom',
  'community-chat',
  'coach-chat',
  'signals',
  'watch',
  'chart',
  'session',
  'calendar',
  'news',
  'books',
  'daily-lessons',
  'position',
  'rr',
  'pip',
  'margin',
  'breakeven',
  'compound',
  'lots',
  'pivot',
  'fib',
  'journal',
  'paper',
  'account',
])

function readPanelFromHash(): VipPanelId | null {
  const match = window.location.hash.match(/^#panel=([a-z-]+)$/)
  if (!match) return null
  const id = match[1] as VipPanelId
  return VIP_PANEL_IDS.has(id) ? id : null
}

type NavGroup = {
  id: string
  label: string
  icon: typeof Crown
  items: { id: VipPanelId; label: string }[]
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

function NavUnreadDot({ count, pulse }: { count?: number; pulse?: boolean }) {
  if (!count) return null
  return (
    <span className={`vip-nav-unread ${pulse ? 'vip-nav-unread--pulse' : ''}`} aria-label={`${count} new`}>
      {count > 9 ? '9+' : count}
    </span>
  )
}

function VipDeskShellInner() {
  const { t } = useLanguage()
  const { contact, referralCode, sessionError, logout, paidUntil, daysRemaining, isExpiringSoon } =
    useStudentAccess()
  const { unreadByPanel, totalUnread, markSeen, groupsWithUpdates, toasts, dismissToast, setActivePanel, activeSignal } =
    useVipActivity()
  const [panel, setPanel] = useState<VipPanelId>(() => readPanelFromHash() ?? 'overview')
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    live: true,
    market: true,
    risk: false,
    analysis: false,
    account: false,
    messages: true,
  })
  const [navOpen, setNavOpen] = useState(false)
  const [classroomLive, setClassroomLive] = useState(false)
  const [chartSymbol, setChartSymbol] = useState('EURUSD')
  const [chartTimeframe, setChartTimeframe] = useState('15')

  useEffect(() => {
    void classroomApi.getActive().then((res) => setClassroomLive(res.data?.status === 'live'))
    return onClassroomUpdated((payload) => setClassroomLive(payload.data?.status === 'live'))
  }, [])

  useEffect(() => {
    if (groupsWithUpdates.size === 0) return
    setOpenGroups((prev) => {
      const next = { ...prev }
      groupsWithUpdates.forEach((id) => {
        next[id] = true
      })
      return next
    })
  }, [groupsWithUpdates])

  const groups: NavGroup[] = [
    {
      id: 'live',
      label: t.vip.navLive,
      icon: Radio,
      items: [
        { id: 'live', label: t.vip.navLiveRoom },
        { id: 'classroom', label: t.classroom.navTitle },
        { id: 'signals', label: t.vip.navSignals },
      ],
    },
    {
      id: 'market',
      label: t.vip.navMarket,
      icon: LineChart,
      items: [
        { id: 'watch', label: t.tools.watchTitle },
        { id: 'chart', label: t.tools.chartTitle },
        { id: 'session', label: t.tools.sessionTitle },
        { id: 'calendar', label: t.tools.calendarTitle },
        { id: 'news', label: t.tools.newsTitle },
        { id: 'daily-lessons', label: t.dailyLessons.navTitle },
        { id: 'books', label: t.books.navTitle },
      ],
    },
    {
      id: 'risk',
      label: t.vip.navRisk,
      icon: Shield,
      items: [
        { id: 'position', label: t.tools.positionTitle },
        { id: 'rr', label: t.tools.rrTitle },
        { id: 'pip', label: t.tools.pipTitle },
        { id: 'margin', label: t.tools.marginTitle },
        { id: 'breakeven', label: t.tools.beTitle },
        { id: 'compound', label: t.tools.compoundTitle },
        { id: 'lots', label: t.tools.lotConvTitle },
      ],
    },
    {
      id: 'messages',
      label: t.chat.navGroup,
      icon: BookOpen,
      items: [
        { id: 'community-chat', label: t.chat.communityTitle },
        { id: 'coach-chat', label: t.chat.coachTitle },
      ],
    },
    {
      id: 'analysis',
      label: t.vip.navAnalysis,
      icon: BarChart3,
      items: [
        { id: 'pivot', label: t.tools.pivotTitle },
        { id: 'fib', label: t.tools.fibTitle },
        { id: 'journal', label: t.tools.journalTitle },
      ],
    },
  ]

  const selectPanel = (id: VipPanelId) => {
    setActivePanel(id)
    if (id !== 'overview') markSeen(id)
    setPanel(id)
    setNavOpen(false)
    const path = id === 'overview' ? '/desk' : `/desk#panel=${id}`
    window.history.pushState({ vipPanel: id }, '', path)
  }

  const openChart = (symbol: string) => {
    setChartSymbol(symbol.replace(/\//g, '').toUpperCase())
    selectPanel('chart')
  }

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  useEffect(() => {
    document.body.classList.add('vip-desk-active')
    return () => document.body.classList.remove('vip-desk-active')
  }, [])

  useEffect(() => {
    const onPop = () => {
      setPanel(readPanelFromHash() ?? 'overview')
      setNavOpen(false)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    const fromHash = readPanelFromHash()
    if (fromHash) {
      setActivePanel(fromHash)
      if (fromHash !== 'overview') markSeen(fromHash)
    }
  }, [setActivePanel, markSeen])

  const goPublicSite = () => {
    window.history.pushState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const renderPanel = () => {
    switch (panel) {
      case 'overview':
        return <VipOverviewPanel onNavigate={selectPanel} />
      case 'live':
        return <LiveTradingRoom deskMode />
      case 'classroom':
        return <VipClassroomPanel />
      case 'community-chat':
        return (
          <div className="vip-panel vip-panel--chat">
            <VipCommunityChat />
          </div>
        )
      case 'coach-chat':
        return (
          <div className="vip-panel vip-panel--chat">
            <VipCoachChat />
          </div>
        )
      case 'signals':
        return (
          <PanelWrap title={t.tools.signalBoardTitle}>
            <ToolCard>
              <LiveSignalBoard />
            </ToolCard>
          </PanelWrap>
        )
      case 'watch':
        return (
          <PanelWrap title={t.tools.watchTitle}>
            <ToolCard>
              <MarketWatch onOpenChart={openChart} />
            </ToolCard>
          </PanelWrap>
        )
      case 'chart':
        return (
          <PanelWrap title={t.tools.chartTitle}>
            <ToolCard>
              <p className="mb-3 text-sm text-theme-muted">{t.tools.chartDesc}</p>
              <DeskChart
                symbol={chartSymbol}
                timeframe={chartTimeframe}
                onSymbolChange={setChartSymbol}
                onTimeframeChange={setChartTimeframe}
                className="min-h-[360px] w-full rounded-xl"
              />
            </ToolCard>
          </PanelWrap>
        )
      case 'session':
        return (
          <PanelWrap title={t.tools.sessionTitle}>
            <ToolCard>
              <SessionClock />
            </ToolCard>
          </PanelWrap>
        )
      case 'calendar':
        return (
          <PanelWrap title={t.tools.calendarTitle}>
            <ToolCard>
              <EconomicCalendar />
            </ToolCard>
          </PanelWrap>
        )
      case 'news':
        return (
          <PanelWrap title={t.tools.newsTitle}>
            <ToolCard>
              <ForexNews />
            </ToolCard>
          </PanelWrap>
        )
      case 'daily-lessons':
        return (
          <PanelWrap title={t.dailyLessons.title}>
            <VipDailyLessonPanel />
          </PanelWrap>
        )
      case 'books':
        return (
          <PanelWrap title={t.books.title}>
            <ToolCard>
              <VipBooksPanel />
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
      case 'pip':
        return (
          <PanelWrap title={t.tools.pipTitle}>
            <ToolCard>
              <PipCalculator />
            </ToolCard>
          </PanelWrap>
        )
      case 'margin':
        return (
          <PanelWrap title={t.tools.marginTitle}>
            <ToolCard>
              <MarginCalculator />
            </ToolCard>
          </PanelWrap>
        )
      case 'breakeven':
        return (
          <PanelWrap title={t.tools.beTitle}>
            <ToolCard>
              <BreakEvenCalculator />
            </ToolCard>
          </PanelWrap>
        )
      case 'compound':
        return (
          <PanelWrap title={t.tools.compoundTitle}>
            <ToolCard>
              <CompoundingCalculator />
            </ToolCard>
          </PanelWrap>
        )
      case 'lots':
        return (
          <PanelWrap title={t.tools.lotConvTitle}>
            <ToolCard>
              <LotConverter />
            </ToolCard>
          </PanelWrap>
        )
      case 'pivot':
        return (
          <PanelWrap title={t.tools.pivotTitle}>
            <ToolCard>
              <PivotCalculator />
            </ToolCard>
          </PanelWrap>
        )
      case 'fib':
        return (
          <PanelWrap title={t.tools.fibTitle}>
            <ToolCard>
              <FibonacciCalculator />
            </ToolCard>
          </PanelWrap>
        )
      case 'journal':
        return (
          <PanelWrap title={t.tools.journalTitle}>
            <ToolCard>
              <TradeJournal />
            </ToolCard>
          </PanelWrap>
        )
      case 'paper':
        return (
          <PanelWrap title={t.tools.paperTitle}>
            <ToolCard>
              <PaperTradingDesk />
            </ToolCard>
          </PanelWrap>
        )
      case 'account':
        return (
          <PanelWrap title={t.vip.accountTitle}>
            <div className="vip-account-card">
              <p className="text-sm text-theme-muted">{t.vip.signedInAs}</p>
              <p className="mt-1 font-display text-lg font-bold text-theme-primary">
                {contact?.name || contact?.phone || contact?.email}
              </p>
              {paidUntil && daysRemaining != null ? (
                <p className="mt-2 text-sm text-theme-muted">
                  {t.membership.activeUntil.replace(
                    '{date}',
                    new Date(paidUntil).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }),
                  )}
                  {isExpiringSoon ? (
                    <span className="ml-2 font-semibold text-amber-400">
                      · {t.membership.daysLeft.replace('{n}', String(daysRemaining))}
                    </span>
                  ) : (
                    <span className="ml-2">· {t.membership.daysLeft.replace('{n}', String(daysRemaining))}</span>
                  )}
                </p>
              ) : null}
              {referralCode ? (
                <div className="mt-4">
                  <ReferralShareCard code={referralCode} />
                </div>
              ) : null}
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-theme-muted">
                <p className="font-semibold text-amber-400">{t.vip.deviceLockTitle}</p>
                <p className="mt-1">{t.vip.deviceLockBody}</p>
              </div>
              {sessionError ? (
                <p className="mt-3 text-sm text-rose-400">{sessionError}</p>
              ) : null}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button type="button" className="vip-btn vip-btn--ghost" onClick={goPublicSite}>
                  <Globe className="h-4 w-4" />
                  {t.vip.backToSite}
                </button>
                <button
                  type="button"
                  className="vip-btn vip-btn--danger"
                  onClick={() => void logout()}
                >
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

  const navContent = (
    <nav className="vip-nav" aria-label={t.vip.navLabel}>
      <button
        type="button"
        className={`vip-nav__item ${panel === 'overview' ? 'vip-nav__item--active' : ''}`}
        onClick={() => selectPanel('overview')}
      >
        <Sparkles className="h-4 w-4" />
        <span className="flex flex-1 items-center justify-between gap-2">
          {t.vip.navOverview}
          <NavUnreadDot count={totalUnread} />
        </span>
      </button>

      {groups.map((group) => {
        const Icon = group.icon
        const open = openGroups[group.id]
        const groupUnread = group.items.reduce((sum, item) => sum + (unreadByPanel[item.id] ?? 0), 0)
        return (
          <div key={group.id} className="vip-nav__group">
            <button
              type="button"
              className="vip-nav__group-toggle"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={open}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-theme-accent" />
                {group.label}
                <NavUnreadDot count={groupUnread} />
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open ? (
              <div className="vip-nav__sub">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`vip-nav__sub-item ${panel === item.id ? 'vip-nav__sub-item--active' : ''}`}
                    onClick={() => selectPanel(item.id)}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        {item.label}
                        {item.id === 'classroom' && classroomLive ? (
                          <span className="vip-nav-live-dot" aria-label="Classroom live" />
                        ) : null}
                      </span>
                      <NavUnreadDot
                        count={unreadByPanel[item.id]}
                        pulse={item.id === 'signals' && Boolean(activeSignal && isSignalNew(activeSignal))}
                      />
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}

      <button
        type="button"
        className={`vip-nav__item ${panel === 'paper' ? 'vip-nav__item--active' : ''}`}
        onClick={() => selectPanel('paper')}
      >
        <TrendingUp className="h-4 w-4" />
        {t.tools.paperTitle}
      </button>

      <button
        type="button"
        className={`vip-nav__item ${panel === 'account' ? 'vip-nav__item--active' : ''}`}
        onClick={() => selectPanel('account')}
      >
        <BookOpen className="h-4 w-4" />
        {t.vip.navAccount}
      </button>

      <button type="button" className="vip-nav__back" onClick={goPublicSite}>
        <ArrowLeft className="h-4 w-4" />
        {t.vip.backToSite}
      </button>
    </nav>
  )

  const isChatPanel = panel === 'community-chat' || panel === 'coach-chat'

  return (
    <div className={`vip-desk ${isChatPanel ? 'vip-desk--chat-panel' : ''}`}>
      <div className="vip-desk__bg" aria-hidden>
        <span className="vip-desk__bg-orb vip-desk__bg-orb--purple" />
        <span className="vip-desk__bg-orb vip-desk__bg-orb--blue" />
      </div>
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
            <p className="vip-badge">
              <Crown className="h-3.5 w-3.5" />
              {t.vip.badge}
            </p>
            <h1 className="truncate font-display text-lg font-bold text-theme-primary sm:text-xl">
              {t.vip.title}
              {totalUnread > 0 ? (
                <span className="ml-2 inline-flex align-middle">
                  <NavUnreadDot count={totalUnread} />
                </span>
              ) : null}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <LanguageSwitcher compact />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="vip-desk__membership px-4 lg:px-8">
        <AnnouncementBanner />
        <VipAccessTip />
        <VipMembershipBanner />
      </div>

      <div className="vip-desk__body">
        <aside className={`vip-desk__sidebar ${navOpen ? 'vip-desk__sidebar--open' : ''}`}>
          {navContent}
        </aside>
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

      <VipMobileBottomNav
        active={panel}
        onSelect={selectPanel}
        onOpenMenu={() => setNavOpen(true)}
        unreadMessages={(unreadByPanel['community-chat'] ?? 0) + (unreadByPanel['coach-chat'] ?? 0)}
      />

      <VipAlertStack
        toasts={toasts}
        onDismiss={dismissToast}
        onOpen={(id) => {
          toasts.forEach((toast) => dismissToast(toast.id))
          selectPanel(id)
        }}
      />

      <NotificationCenter onNavigate={selectPanel} />
      <LiveToastNotifications onNavigate={selectPanel} />
      <WhatsNewModal />
    </div>
  )
}

export function VipDeskShell() {
  return (
    <VipActivityProvider>
      <EngagementProvider>
        <VipDeskShellInner />
      </EngagementProvider>
    </VipActivityProvider>
  )
}
