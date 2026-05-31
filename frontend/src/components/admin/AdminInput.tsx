import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function adminControlClass(hasError?: boolean, className = '') {
  const errorClass = hasError ? 'admin-control--error' : ''
  return `admin-control ${errorClass} ${className}`.trim()
}

/** @deprecated use adminControlClass */
export function adminFieldClass(hasError?: boolean, className = '') {
  return adminControlClass(hasError, className)
}

export function AdminTextInput({
  className = '',
  hasError,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return <input id={id} {...props} className={adminControlClass(hasError, className)} />
}

export function AdminTextArea({
  className = '',
  hasError,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) {
  return (
    <textarea
      id={id}
      {...props}
      className={`admin-control admin-control--textarea ${hasError ? 'admin-control--error' : ''} ${className}`.trim()}
    />
  )
}

export function AdminSelect({
  className = '',
  hasError,
  id,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) {
  return (
    <select
      id={id}
      {...props}
      className={adminControlClass(hasError, `admin-control--select ${className}`)}
    />
  )
}
