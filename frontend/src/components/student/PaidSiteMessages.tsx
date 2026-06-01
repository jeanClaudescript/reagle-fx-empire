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
    <section id="vip-messages" className="ps-section">
      <div className="ps-section__inner">
        <div className="ps-section__head">
          <div>
            <p className="ps-hub-hero__eyebrow">{t.chat.navGroup}</p>
            <h2 className="ps-hub-hero__title">{t.chat.publicTitle}</h2>
            <p className="ps-hub-hero__desc mt-1">{t.chat.publicSubtitle}</p>
          </div>
          {hasVipSession ? (
            <span className="ps-status-pill ps-status-pill--live">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {t.chat.liveRealtime}
            </span>
          ) : null}
        </div>

        {!hasVipSession ? (
          <div className="ps-surface-card p-8 text-center">
            <div className="ps-hub-card__icon ps-hub-card__icon--sky mx-auto mb-4">
              <MessageCircle className="h-5 w-5" />
            </div>
            <p className="text-sm text-theme-muted">{t.chat.signInForChat}</p>
            <GlowButton variant="primary" external={false} onClick={goLogin} className="mt-5">
              {t.nav.login}
            </GlowButton>
          </div>
        ) : (
          <div className="paid-site-chat ps-surface-card">
            <div className="border-b border-theme px-4 py-3 sm:px-5">
              <div className="ps-hub-filters">
                <button
                  type="button"
                  className={`ps-hub-filter ${tab === 'community' ? 'ps-hub-filter--active' : ''}`}
                  onClick={() => setTab('community')}
                >
                  <Users size={16} />
                  {t.chat.communityTitle}
                </button>
                <button
                  type="button"
                  className={`ps-hub-filter ${tab === 'coach' ? 'ps-hub-filter--active' : ''}`}
                  onClick={() => setTab('coach')}
                >
                  <MessageCircle size={16} />
                  {t.chat.coachTitle}
                </button>
              </div>
            </div>
            <div className="paid-site-chat__panel">
              {tab === 'community' ? <VipCommunityChat /> : <VipCoachChat />}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
