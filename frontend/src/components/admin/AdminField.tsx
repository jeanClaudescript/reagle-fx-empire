import type { ReactNode } from 'react'

type AdminFieldProps = {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function AdminField({ label, htmlFor, hint, error, required, children, className = '' }: AdminFieldProps) {
  return (
    <div className={`admin-field ${className}`}>
      <label className="admin-field__label" htmlFor={htmlFor}>
        {label}
        {required ? <span className="admin-field__required" aria-hidden> *</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="admin-field__hint">{hint}</p> : null}
      {error ? <p className="admin-field__error" role="alert">{error}</p> : null}
    </div>
  )
}

export function AdminCardHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <header className="admin-card-header">
      <div className="admin-card-header__text">
        <h3 className="admin-card-header__title">{title}</h3>
        {description ? <p className="admin-card-header__desc">{description}</p> : null}
      </div>
      {action ? <div className="admin-card-header__action">{action}</div> : null}
    </header>
  )
}
