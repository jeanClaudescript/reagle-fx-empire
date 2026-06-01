import { useLanguage } from '@/context/LanguageContext'
import type { PaymentConfig } from '@/services/api'
import type { ProgramPlanId } from '@/types/program'

type PlanDef = {
  id: ProgramPlanId
  titleKey: 'planForexTitle' | 'planCryptoTitle' | 'planBundleTitle'
  descKey: 'planForexDesc' | 'planCryptoDesc' | 'planBundleDesc'
  amountKey: 'programForexAmount' | 'programCryptoAmount' | 'programBundleAmount'
  featured?: boolean
}

const PLANS: PlanDef[] = [
  { id: 'forex', titleKey: 'planForexTitle', descKey: 'planForexDesc', amountKey: 'programForexAmount' },
  { id: 'crypto', titleKey: 'planCryptoTitle', descKey: 'planCryptoDesc', amountKey: 'programCryptoAmount' },
  {
    id: 'bundle',
    titleKey: 'planBundleTitle',
    descKey: 'planBundleDesc',
    amountKey: 'programBundleAmount',
    featured: true,
  },
]

type Props = {
  config: PaymentConfig
  value: ProgramPlanId | null
  onChange: (plan: ProgramPlanId) => void
}

export function ProgramPlanPicker({ config, value, onChange }: Props) {
  const { t } = useLanguage()

  return (
    <div className="program-plan-picker">
      <p className="text-xs font-bold uppercase tracking-wider text-theme-muted">{t.pay.planLabel}</p>
      <div className="mt-3 grid gap-3">
        {PLANS.map((plan) => {
          const amount = config[plan.amountKey]
          const selected = value === plan.id
          return (
            <button
              key={plan.id}
              type="button"
              className={`program-plan-card ${selected ? 'program-plan-card--selected' : ''} ${plan.featured ? 'program-plan-card--featured' : ''}`}
              onClick={() => onChange(plan.id)}
            >
              <span className="program-plan-card__head">
                <span className="font-semibold text-theme-primary">{t.pay[plan.titleKey]}</span>
                <span className="font-display text-lg font-bold text-theme-accent">
                  {amount.toLocaleString()} {config.currency}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
