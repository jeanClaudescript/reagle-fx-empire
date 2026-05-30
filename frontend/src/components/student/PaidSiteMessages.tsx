import { useState } from 'react'
import { MessageCircle, Users } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { VipCommunityChat } from '@/components/student/vip/VipCommunityChat'
import { VipCoachChat } from '@/components/student/vip/VipCoachChat'
import { GlowButton } from '@/components/ui/GlowButton'

type ChatTab = 'community' | 'coach'

export function PaidSiteMessages() {
  const { t } = useLanguage()
  const { isPaid, hasVipSession, loading } = useStudentAccess()
  const [tab, setTab] = useState<ChatTab>('community')

  if (loading || !isPaid) return null

  const goLogin = () => {
    window.history.pushState({}, '', '/login')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <section id="vip-messages" className="border-t border-theme bg-theme-bg section-pad">
      <div className="section-container">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-empire-purple">{t.chat.navGroup}</p>
            <h2 className="font-display text-2xl font-bold text-theme-primary">{t.chat.publicTitle}</h2>
            <p className="mt-1 max-w-xl text-sm text-theme-muted">{t.chat.publicSubtitle}</p>
          </div>
          {hasVipSession ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {t.chat.liveRealtime}
            </span>
          ) : null}
        </div>

        {!hasVipSession ? (
          <div className="vip-tool-card text-center py-8">
            <MessageCircle className="mx-auto mb-3 h-10 w-10 text-theme-muted" />
            <p className="text-theme-muted">{t.chat.signInForChat}</p>
            <GlowButton variant="primary" external={false} onClick={goLogin} className="mt-4">
              {t.nav.login}
            </GlowButton>
          </div>
        ) : (
          <div className="paid-site-chat">
            <div className="paid-site-chat__tabs">
              <button
                type="button"
                className={tab === 'community' ? 'active' : ''}
                onClick={() => setTab('community')}
              >
                <Users size={16} />
                {t.chat.communityTitle}
              </button>
              <button
                type="button"
                className={tab === 'coach' ? 'active' : ''}
                onClick={() => setTab('coach')}
              >
                <MessageCircle size={16} />
                {t.chat.coachTitle}
              </button>
            </div>
            <div className="paid-site-chat__panel vip-tool-card">
              {tab === 'community' ? <VipCommunityChat /> : <VipCoachChat />}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
