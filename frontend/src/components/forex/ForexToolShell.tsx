import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function ForexToolShell({
  icon: Icon,
  title,
  description,
  tag,
  children,
  footer,
}: {
  icon: LucideIcon
  title: string
  description: string
  tag?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="forex-tool-card forex-tool-card--shell">
      <div className="forex-tool-card__head">
        <div className="forex-tool-card__icon-wrap">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="forex-tool-card__title">{title}</h3>
            {tag ? <span className="forex-tool-card__tag">{tag}</span> : null}
          </div>
          <p className="forex-tool-card__desc">{description}</p>
        </div>
      </div>
      <div className="forex-tool-card__body">{children}</div>
      {footer ? <div className="forex-tool-card__foot">{footer}</div> : null}
    </div>
  )
}

export function ForexResult({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  hint?: string
  tone?: 'neutral' | 'profit' | 'loss' | 'accent'
}) {
  const toneClass =
    tone === 'profit'
      ? 'forex-tool-result--profit'
      : tone === 'loss'
        ? 'forex-tool-result--loss'
        : tone === 'accent'
          ? 'forex-tool-result--accent'
          : ''
  return (
    <div className={`forex-tool-result ${toneClass}`}>
      <span className="text-xs font-medium text-theme-muted">{label}</span>
      <p className="font-display text-2xl font-bold tracking-tight">{value}</p>
      {hint ? <p className="text-xs text-theme-muted">{hint}</p> : null}
    </div>
  )
}
