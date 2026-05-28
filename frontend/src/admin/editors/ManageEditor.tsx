import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { ManageSubNav, type ManageView } from '@/admin/components/ManageSubNav'
import { StudentsDashboard } from '@/admin/editors/StudentsDashboard'
import { StudentsListEditor } from '@/admin/editors/StudentsListEditor'
import { PaymentsEditor } from '@/admin/editors/PaymentsEditor'
import { PaymentSettingsPanel } from '@/admin/editors/PaymentSettingsPanel'
import { LiveSessionsEditor } from '@/admin/editors/LiveSessionsEditor'
import { ReferralsEditor } from '@/admin/editors/ReferralsEditor'

export function ManageEditor({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<ManageView>('dashboard')

  return (
    <div className="manage-hub">
      <header className="admin-section-toolbar mb-4">
        <div className="admin-section-toolbar-top">
          <button type="button" onClick={onBack} className="admin-header-icon-btn shrink-0" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-theme-primary">Students & payments</h2>
            <p className="text-xs text-theme-muted">Accounts · paid / unpaid · Mobile Money</p>
          </div>
        </div>
      </header>

      <ManageSubNav active={view} onChange={setView} />

      <div className="mt-5">
        {view === 'dashboard' && <StudentsDashboard onNavigate={setView} />}
        {view === 'students' && <StudentsListEditor />}
        {view === 'live' && <LiveSessionsEditor />}
        {view === 'payments' && <PaymentsEditor embedded />}
        {view === 'referrals' && <ReferralsEditor />}
        {view === 'settings' && <PaymentSettingsPanel />}
      </div>
    </div>
  )
}
