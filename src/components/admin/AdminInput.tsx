import type { InputHTMLAttributes } from 'react'

export function adminFieldClass(hasError?: boolean, className = '') {
  const errorClass = hasError
    ? 'border-rose-500/50 ring-2 ring-rose-500/20'
    : 'border-theme focus:ring-theme-accent/30'
  return `h-11 w-full min-w-0 rounded-xl border bg-theme-surface/80 px-4 text-sm text-theme-primary placeholder:text-theme-muted/70 focus:outline-none focus:ring-2 ${errorClass} ${className}`
}

export function AdminTextInput({
  className = '',
  hasError,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return <input {...props} className={adminFieldClass(hasError, className)} />
}

export function AdminTextArea({
  className = '',
  hasError,
  ...props
}: InputHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) {
  const errorClass = hasError
    ? 'border-rose-500/50 ring-2 ring-rose-500/20'
    : 'border-theme focus:ring-theme-accent/30'
  return (
    <textarea
      {...props}
      className={`min-h-[90px] w-full min-w-0 rounded-xl border bg-theme-surface/80 px-4 py-3 text-sm text-theme-primary placeholder:text-theme-muted/70 focus:outline-none focus:ring-2 ${errorClass} ${className}`}
    />
  )
}

export function AdminSelect({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-11 w-full min-w-0 rounded-xl border border-theme bg-theme-surface/80 px-4 text-sm text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent/30 ${className}`}
    />
  )
}

