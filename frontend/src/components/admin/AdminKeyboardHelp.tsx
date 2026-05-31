import { X } from 'lucide-react'

const SHORTCUTS = [
  { keys: 'Esc', action: 'Back to hub (or close menu)' },
  { keys: '?', action: 'Show this help' },
  { keys: 'Preview draft', action: 'See changes before students do' },
  { keys: 'Publish section', action: 'Push one website section live' },
  { keys: 'Publish website', action: 'Push all validated draft sections live' },
]

export function AdminKeyboardHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  return (
    <div className="admin-help-backdrop" role="dialog" aria-modal="true" aria-label="Admin shortcuts">
      <div className="admin-help-panel">
        <div className="admin-help-panel__head">
          <h2 className="admin-help-panel__title">Admin shortcuts</h2>
          <button type="button" className="admin-header-icon-btn" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="admin-help-panel__list">
          {SHORTCUTS.map((s) => (
            <li key={s.keys} className="admin-help-panel__row">
              <kbd className="admin-help-panel__kbd">{s.keys}</kbd>
              <span>{s.action}</span>
            </li>
          ))}
        </ul>
        <p className="admin-help-panel__foot">
          Website content uses <strong>draft → publish</strong>. Students &amp; payments save instantly.
        </p>
      </div>
    </div>
  )
}
