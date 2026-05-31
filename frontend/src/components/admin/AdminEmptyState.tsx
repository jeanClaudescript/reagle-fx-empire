type AdminEmptyStateProps = {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  scrollToId?: string
}

export function AdminEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  scrollToId,
}: AdminEmptyStateProps) {
  const handleAction = () => {
    if (scrollToId) {
      document.getElementById(scrollToId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    onAction?.()
  }

  return (
    <div className="admin-empty-state">
      <p className="admin-empty-state__title">{title}</p>
      {description ? <p className="admin-empty-state__desc">{description}</p> : null}
      {actionLabel ? (
        <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" onClick={handleAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
