export type ManageView = 'dashboard' | 'students' | 'live' | 'payments' | 'referrals' | 'settings'

const items: { id: ManageView; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'students', label: 'Students' },
  { id: 'live', label: 'Live class' },
  { id: 'payments', label: 'Payments' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'settings', label: 'Settings' },
]

export function ManageSubNav({
  active,
  onChange,
}: {
  active: ManageView
  onChange: (view: ManageView) => void
}) {
  return (
    <nav className="manage-subnav" aria-label="Manage sections">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`manage-subnav__btn ${active === item.id ? 'manage-subnav__btn--active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
