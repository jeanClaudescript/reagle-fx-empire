import { UserPlus } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

type Props = {
  code: string
  onChangeCode?: () => void
}

export function ReferralAppliedBadge({ code, onChangeCode }: Props) {
  const { t } = useLanguage()

  return (
    <div className="referral-applied">
      <UserPlus className="h-4 w-4 shrink-0 text-emerald-400" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-theme-primary">{t.referral.appliedTitle}</p>
        <p className="text-xs text-theme-muted">
          {t.referral.appliedBody}{' '}
          <span className="font-mono font-bold text-theme-accent">{code}</span>
        </p>
      </div>
      {onChangeCode ? (
        <button type="button" className="referral-applied__change text-xs font-semibold text-theme-accent" onClick={onChangeCode}>
          {t.referral.changeCode}
        </button>
      ) : null}
    </div>
  )
}
