import { useEffect, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Calculator,
  ChevronDown,
  Crown,
  Globe,
  LineChart,
  LogOut,
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
import { LiveForexChart } from '@/components/ui/LiveForexChart'
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
import { VipClassroomPanel } from '@/components/student/vip/VipClassroomPanel'
import { VipCommunityChat } from '@/components/student/vip/VipCommunityChat'
import { VipCoachChat } from '@/components/student/vip/VipCoachChat'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

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

export function VipDeskShell() {
  const { t } = useLanguage()
  const { contact, referralCode, sessionError, logout } = useStudentAccess()
  const [panel, setPanel] = useState<VipPanelId>('overview')
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    live: true,
    market: true,
    risk: false,
    analysis: false,
    account: false,
    messages: true,
  })
  const [navOpen, setNavOpen] = useState(false)

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
    setPanel(id)
    setNavOpen(false)
  }

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  useEffect(() => {
    document.body.classList.add('vip-desk-active')
    return () => document.body.classList.remove('vip-desk-active')
  }, [])

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
        return (
          <PanelWrap title={t.classroom.navTitle}>
            <VipClassroomPanel />
          </PanelWrap>
        )
      case 'community-chat':
        return (
          <PanelWrap title={t.chat.communityTitle}>
            <VipCommunityChat />
          </PanelWrap>
        )
      case 'coach-chat':
        return (
          <PanelWrap title={t.chat.coachTitle}>
            <VipCoachChat />
          </PanelWrap>
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
              <MarketWatch />
            </ToolCard>
          </PanelWrap>
        )
      case 'chart':
        return (
          <PanelWrap title={t.tools.chartTitle}>
            <ToolCard>
              <p className="mb-3 text-sm text-theme-muted">{t.tools.chartDesc}</p>
              <LiveForexChart className="min-h-[320px] w-full rounded-xl" compact />
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
              {referralCode ? (
                <div className="mt-4 rounded-xl border border-theme bg-theme-surface/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-theme-accent">
                    {t.studentLogin.referralTitle}
                  </p>
                  <p className="mt-1 font-mono text-sm text-theme-primary">{referralCode}</p>
                  <p className="mt-2 text-xs text-theme-muted">{t.studentLogin.referralHint}</p>
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
        {t.vip.navOverview}
      </button>

      {groups.map((group) => {
        const Icon = group.icon
        const open = openGroups[group.id]
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
                    {item.label}
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

  return (
    <div className="vip-desk">
      <header className="vip-desk__header">
        <div className="vip-desk__header-inner">
          <button
            type="button"
            className="vip-desk__menu-btn lg:hidden"
            onClick={() => setNavOpen((v) => !v)}
            aria-label={t.vip.navLabel}
          >
            <Calculator className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="vip-badge">
              <Crown className="h-3.5 w-3.5" />
              {t.vip.badge}
            </p>
            <h1 className="truncate font-display text-lg font-bold text-theme-primary sm:text-xl">
              {t.vip.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="vip-desk__body">
        <aside className={`vip-desk__sidebar ${navOpen ? 'vip-desk__sidebar--open' : ''}`}>
          {navContent}
        </aside>
        {navOpen ? (
          <button
            type="button"
            className="vip-desk__overlay lg:hidden"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          />
        ) : null}
        <main className="vip-desk__main">{renderPanel()}</main>
      </div>
    </div>
  )
}
