import { useCallback, useEffect, useState } from 'react'
import { paymentApi, type PaymentSettings } from '@/services/api'
import { AdminCard } from '@/components/admin/AdminCard'
import { useAdminToast } from '@/admin/toast'

const empty: PaymentSettings = {
  merchantPhone: '',
  defaultAmount: 5000,
  currency: 'RWF',
  ussdTemplate: '182*1*1*{phone}*{amount}#',
  referralRewardAmount: 1000,
  paymentNote: '',
  paymentsEnabled: true,
  allowCustomAmount: false,
}

export function PaymentSettingsPanel() {
  const { push } = useAdminToast()
  const [form, setForm] = useState<PaymentSettings>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await paymentApi.adminGetSettings()
      setForm(res.data)
    } catch {
      push('Could not load payment settings', 'error')
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setSaving(true)
    try {
      const res = await paymentApi.adminUpdateSettings(form)
      setForm(res.data)
      push('Payment settings saved', 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const set = <K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <AdminCard>
      <div className="admin-card-body">
        <h3 className="font-display text-base font-bold text-theme-primary">Payment settings</h3>
        <p className="admin-editor-card-intro mt-1">
          MoMo number, default amount, USSD format, and referral reward. Changes apply immediately
          on the live /pay page (no CMS publish needed).
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-theme-muted">Loading settings…</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-theme-primary">
                <input
                  type="checkbox"
                  checked={form.paymentsEnabled}
                  onChange={(e) => set('paymentsEnabled', e.target.checked)}
                />
                Payments enabled
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-theme-primary">
                <input
                  type="checkbox"
                  checked={form.allowCustomAmount}
                  onChange={(e) => set('allowCustomAmount', e.target.checked)}
                />
                Let users enter custom amount
              </label>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-theme-muted">
                Merchant / coach MoMo number
              </label>
              <input
                value={form.merchantPhone}
                onChange={(e) => set('merchantPhone', e.target.value)}
                placeholder="250789880060 or 0789880060"
                className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-theme-muted">
                Default amount ({form.currency})
              </label>
              <input
                type="number"
                min={100}
                value={form.defaultAmount}
                onChange={(e) => set('defaultAmount', Number(e.target.value))}
                className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-theme-muted">Currency</label>
              <input
                value={form.currency}
                onChange={(e) => set('currency', e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-theme-muted">
                Referral reward ({form.currency})
              </label>
              <input
                type="number"
                min={0}
                value={form.referralRewardAmount}
                onChange={(e) => set('referralRewardAmount', Number(e.target.value))}
                className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-theme-muted">
                USSD template (use {'{phone}'} and {'{amount}'})
              </label>
              <input
                value={form.ussdTemplate}
                onChange={(e) => set('ussdTemplate', e.target.value)}
                className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-theme-muted">
                MTN example: 182*1*1*{'{phone}'}*{'{amount}'}#. Airtel uses env{' '}
                <code className="text-theme-accent">PAYMENT_AIRTEL_USSD_TEMPLATE</code> (default
                500*1*2*{'{phone}'}*{'{amount}'}#).
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-theme-muted">
                Extra payment note (shown to users)
              </label>
              <textarea
                value={form.paymentNote}
                onChange={(e) => set('paymentNote', e.target.value)}
                rows={2}
                placeholder="Optional instructions for payers"
                className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
              />
            </div>

            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                className="admin-btn admin-btn--primary"
                onClick={save}
              >
                {saving ? 'Saving…' : 'Save settings'}
              </button>
              <button type="button" className="admin-btn admin-btn--secondary" onClick={load}>
                Reset form
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminCard>
  )
}
