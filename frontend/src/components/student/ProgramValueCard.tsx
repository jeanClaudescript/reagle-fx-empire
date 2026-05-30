import { Check, Crown, Radio, Target, BookOpen, LineChart, MessageCircle, GraduationCap, MapPin } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

const PERKS = [
  { icon: Radio, key: 'perkLive' as const },
  { icon: Target, key: 'perkSignals' as const },
  { icon: GraduationCap, key: 'perkClassroom' as const },
  { icon: LineChart, key: 'perkChart' as const },
  { icon: BookOpen, key: 'perkBooks' as const },
  { icon: MessageCircle, key: 'perkCoach' as const },
  { icon: MapPin, key: 'perkPhysical' as const, paidOnly: true },
]

export function ProgramValueCard({
  compact = false,
  showPhysical = true,
}: {
  compact?: boolean
  showPhysical?: boolean
}) {
  const { t } = useLanguage()
  const perks = showPhysical ? PERKS : PERKS.filter((p) => !p.paidOnly)

  return (
    <div className={`program-value ${compact ? 'program-value--compact' : ''}`}>
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-amber-400" />
        <h3 className="font-display text-lg font-bold text-theme-primary">{t.program.offerTitle}</h3>
      </div>
      <p className="mt-2 text-sm text-theme-muted">{t.program.offerSubtitle}</p>
      <ul className="mt-4 space-y-2">
        {perks.map(({ icon: Icon, key }) => (
          <li key={key} className="flex items-start gap-2 text-sm text-theme-primary">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-theme-accent" />
              {t.program[key]}
            </span>
          </li>
        ))}
      </ul>
      {!compact ? (
        <p className="mt-4 rounded-xl border border-theme-accent/25 bg-theme-accent/5 px-3 py-2 text-xs text-theme-muted">
          {t.program.offerRenew}
        </p>
      ) : null}
    </div>
  )
}
