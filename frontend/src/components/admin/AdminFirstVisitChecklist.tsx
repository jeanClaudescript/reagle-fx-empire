import { CheckCircle2, Circle } from 'lucide-react'
import type { AdminTab } from '@/admin/layout/adminNav'

const STORAGE_KEY = 'coachpeter_admin_checklist_done'

type ChecklistItem = {
  id: string
  label: string
  tab: AdminTab
}

const ITEMS: ChecklistItem[] = [
  { id: 'preview', label: 'Preview your website draft', tab: 'dashboard' },
  { id: 'update', label: 'Post a daily market update', tab: 'updates' },
  { id: 'payments', label: 'Review pending MoMo payments', tab: 'payments' },
]

export function AdminFirstVisitChecklist({ onNavigate }: { onNavigate: (tab: AdminTab) => void }) {
  const done = typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === '1'
  if (done) return null

  return (
    <div className="admin-checklist">
      <div className="admin-checklist__head">
        <div>
          <p className="admin-checklist__eyebrow">First time here?</p>
          <h2 className="admin-checklist__title">3 quick steps to get started</h2>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--ghost admin-btn--sm"
          onClick={() => window.localStorage.setItem(STORAGE_KEY, '1')}
        >
          Dismiss
        </button>
      </div>
      <ul className="admin-checklist__list">
        {ITEMS.map((item, idx) => (
          <li key={item.id}>
            <button type="button" className="admin-checklist__item" onClick={() => onNavigate(item.tab)}>
              <span className="admin-checklist__step" aria-hidden>
                {idx === 0 ? <Circle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 opacity-40" />}
              </span>
              <span className="admin-checklist__label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
