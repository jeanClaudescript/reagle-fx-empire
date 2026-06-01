import { useCallback, useState, type ReactNode } from 'react'
import { AlertTriangle, CalendarDays, Gift, Sparkles, X } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { GlowButton } from '@/components/ui/GlowButton'

type BannerKind = 'expired' | 'promo' | 'expiring' | 'active'

function dismissStorageKey(kind: BannerKind, userKey: string) {
  return `rfx_vip_membership_banner_${kind}_${userKey}`
}

function useBannerDismiss(kind: BannerKind, userKey: string | null) {
  const [dismissed, setDismissed] = useState(() => {
    if (!userKey || kind === 'active') return false
    try {
      return localStorage.getItem(dismissStorageKey(kind, userKey)) === '1'
    } catch {
      return false
    }
  })

  const dismiss = useCallback(() => {
    if (userKey && kind !== 'active') {
      try {
        localStorage.setItem(dismissStorageKey(kind, userKey), '1')
      } catch {
        /* ignore */
      }
    }
    setDismissed(true)
  }, [kind, userKey])

  return { dismissed, dismiss }
}

function MembershipBannerShell({
  kind,
  variant,
  icon,
  title,
  body,
  cta,
  dismissLabel,
  onDismiss,
  dismissible = true,
}: {
  kind: BannerKind
  variant: 'active' | 'warning' | 'expired'
  icon: ReactNode
  title: string
  body?: string
  cta?: ReactNode
  dismissLabel: string
  onDismiss: () => void
  dismissible?: boolean
}) {
  return (
    <div
      className={`vip-membership vip-membership--${variant}`}
      role={variant === 'warning' || variant === 'expired' ? 'alert' : 'status'}
      data-banner-kind={kind}
    >
      {dismissible ? (
        <button
          type="button"
          className="vip-membership__dismiss"
          onClick={onDismiss}
          aria-label={dismissLabel}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
      <div className="vip-membership__row">
        {icon}
        <div className="vip-membership__text">
          <p className="vip-membership__title">{title}</p>
          {body ? <p className="vip-membership__body">{body}</p> : null}
        </div>
      </div>
      {cta ? <div className="vip-membership__cta">{cta}</div> : null}
    </div>
  )
}

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
    contact,
  } = useStudentAccess()

  const userKey = contact?.phone?.trim() || contact?.email?.trim().toLowerCase() || null
  const dismissLabel = t.vip.dismissAlert

  const expiredDismiss = useBannerDismiss('expired', userKey)
  const promoDismiss = useBannerDismiss('promo', userKey)
  const expiringDismiss = useBannerDismiss('expiring', userKey)

  if (membershipExpired || membershipStatus === 'expired') {
    if (expiredDismiss.dismissed) return null
    return (
      <MembershipBannerShell
        kind="expired"
        variant="expired"
        dismissLabel={dismissLabel}
        onDismiss={expiredDismiss.dismiss}
        icon={<AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />}
        title={t.membership.expiredTitle}
        body={t.membership.expiredBody}
        cta={
          <GlowButton href="/pay" variant="primary" external={false} className="w-full text-xs sm:w-auto">
            {t.membership.renewCta}
          </GlowButton>
        }
      />
    )
  }

  if (accessMode === 'promo' || membershipStatus === 'promo') {
    if (promoDismiss.dismissed) return null
    return (
      <MembershipBannerShell
        kind="promo"
        variant="warning"
        dismissLabel={dismissLabel}
        onDismiss={promoDismiss.dismiss}
        icon={<Gift className="h-5 w-5 shrink-0 text-emerald-400" />}
        title={t.membership.promoTitle}
        body={
          daysRemaining != null
            ? t.membership.promoBody.replace('{n}', String(daysRemaining))
            : t.membership.promoBodyOpen
        }
        cta={
          <GlowButton href="/pay" variant="secondary" external={false} className="w-full text-xs sm:w-auto">
            {t.membership.joinCta}
          </GlowButton>
        }
      />
    )
  }

  if (!isPaid || daysRemaining == null) return null

  if (isExpiringSoon) {
    if (expiringDismiss.dismissed) return null
    return (
      <MembershipBannerShell
        kind="expiring"
        variant="warning"
        dismissLabel={dismissLabel}
        onDismiss={expiringDismiss.dismiss}
        icon={<CalendarDays className="h-5 w-5 shrink-0 text-amber-400" />}
        title={t.membership.expiringTitle.replace('{n}', String(daysRemaining))}
        body={t.membership.expiringBody}
        cta={
          <GlowButton href="/pay" variant="secondary" external={false} className="w-full text-xs sm:w-auto">
            {t.membership.renewEarly}
          </GlowButton>
        }
      />
    )
  }

  return (
    <div className="vip-membership vip-membership--active">
      <div className="vip-membership__row">
        <Sparkles className="h-4 w-4 shrink-0 text-theme-accent" />
        <p className="vip-membership__body !mt-0 text-xs leading-relaxed text-theme-muted">
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
    </div>
  )
}
