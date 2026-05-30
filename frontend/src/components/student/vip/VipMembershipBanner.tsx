import { AlertTriangle, CalendarDays, Gift, Sparkles } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { GlowButton } from '@/components/ui/GlowButton'

export function VipMembershipBanner() {
  const { t } = useLanguage()
  const {
    isPaid,
    membershipExpired,
    membershipStatus,
    accessMode,
    daysRemaining,
    paidUntil,
    isExpiringSoon,
  } = useStudentAccess()

  if (membershipExpired || membershipStatus === 'expired') {
    return (
      <div className="vip-membership vip-membership--expired">
        <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-theme-primary">{t.membership.expiredTitle}</p>
          <p className="mt-0.5 text-xs text-theme-muted">{t.membership.expiredBody}</p>
        </div>
        <GlowButton href="/pay" variant="primary" external={false} className="shrink-0 text-xs">
          {t.membership.renewCta}
        </GlowButton>
      </div>
    )
  }

  if (accessMode === 'promo' || membershipStatus === 'promo') {
    return (
      <div className="vip-membership vip-membership--warning">
        <Gift className="h-5 w-5 shrink-0 text-emerald-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-theme-primary">{t.membership.promoTitle}</p>
          <p className="mt-0.5 text-xs text-theme-muted">
            {daysRemaining != null
              ? t.membership.promoBody.replace('{n}', String(daysRemaining))
              : t.membership.promoBodyOpen}
          </p>
        </div>
        <GlowButton href="/pay" variant="secondary" external={false} className="shrink-0 text-xs">
          {t.membership.joinCta}
        </GlowButton>
      </div>
    )
  }

  if (!isPaid || daysRemaining == null) return null

  if (isExpiringSoon) {
    return (
      <div className="vip-membership vip-membership--warning">
        <CalendarDays className="h-5 w-5 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-theme-primary">
            {t.membership.expiringTitle.replace('{n}', String(daysRemaining))}
          </p>
          <p className="mt-0.5 text-xs text-theme-muted">{t.membership.expiringBody}</p>
        </div>
        <GlowButton href="/pay" variant="secondary" external={false} className="shrink-0 text-xs">
          {t.membership.renewEarly}
        </GlowButton>
      </div>
    )
  }

  return (
    <div className="vip-membership vip-membership--active">
      <Sparkles className="h-4 w-4 shrink-0 text-theme-accent" />
      <p className="text-xs text-theme-muted">
        {t.membership.activeUntil.replace(
          '{date}',
          paidUntil
            ? new Date(paidUntil).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '—',
        )}{' '}
        · {t.membership.daysLeft.replace('{n}', String(daysRemaining))}
      </p>
    </div>
  )
}
