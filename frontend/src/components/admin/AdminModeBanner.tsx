type AdminModeBannerProps = {
  mode: 'draft' | 'live-sync' | 'ops'
}

export function AdminModeBanner({ mode }: AdminModeBannerProps) {
  if (mode === 'ops') {
    return (
      <div className="admin-mode-banner admin-mode-banner--ops">
        <p className="admin-mode-banner__title">Live — saves instantly</p>
        <p className="admin-mode-banner__hint">
          Approvals and edits go to students right away. No publish step on this page.
        </p>
      </div>
    )
  }

  if (mode === 'draft') {
    return (
      <div className="admin-mode-banner admin-mode-banner--draft">
        <p className="admin-mode-banner__title">Draft — not on the live site yet</p>
        <p className="admin-mode-banner__hint">
          Edit below, tap <strong>Save draft</strong>, then <strong>Publish section</strong> when ready.
        </p>
      </div>
    )
  }

  return (
    <div className="admin-mode-banner admin-mode-banner--live">
      <p className="admin-mode-banner__title">In sync with live site</p>
      <p className="admin-mode-banner__hint">
        New edits stay in draft until you publish this section.
      </p>
    </div>
  )
}
