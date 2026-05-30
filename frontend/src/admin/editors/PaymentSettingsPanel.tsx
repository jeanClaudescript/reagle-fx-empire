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
  membershipDays: 60,
  siteFreeAccessEnabled: false,
  siteFreeAccessUntil: null,
  autoTrialDays: 7,
  accessTip: '',
  payPageTip: '',
  programsEnabled: true,
  programForexAmount: 300_000,
  programCryptoAmount: 300_000,
  programBundleAmount: 500_000,
  physicalClassesEnabled: true,
  physicalClassSchedule: '',
  physicalClassLocation: 'Kigali, Remera',
  physicalClassNote: '',
}

function formatUntil(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PaymentSettingsPanel() {
  const { push } = useAdminToast()
  const [form, setForm] = useState<PaymentSettings>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [promoDays, setPromoDays] = useState(7)
  const [promoBusy, setPromoBusy] = useState(false)

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
      push('Settings saved', 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const enablePromo = async (days: number) => {
    setPromoBusy(true)
    try {
      const res = await paymentApi.adminEnableSiteFreeAccess(days)
      setForm(res.data)
      push(`Free VIP access enabled for ${days} days`, 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error')
    } finally {
      setPromoBusy(false)
    }
  }

  const disablePromo = async () => {
    setPromoBusy(true)
    try {
      const res = await paymentApi.adminDisableSiteFreeAccess()
      setForm(res.data)
      push('Site-wide free access turned off', 'info')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error')
    } finally {
      setPromoBusy(false)
    }
  }

  const set = <K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const promoActive =
    form.siteFreeAccessEnabled &&
    form.siteFreeAccessUntil &&
    new Date(form.siteFreeAccessUntil).getTime() > Date.now()

  return (
    <AdminCard>
      <div className="admin-card-body">
        <h3 className="font-display text-base font-bold text-theme-primary">Access & payment settings</h3>
        <p className="admin-editor-card-intro mt-1">
          Control MoMo payment, membership length, free access promos, and tips shown to students.
          Changes apply immediately (no CMS publish).
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-theme-muted">Loading settings…</p>
        ) : (
          <div className="mt-5 space-y-8">
            <section>
              <h4 className="text-sm font-bold text-theme-primary">Payment (MoMo)</h4>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-theme-muted">
                    Extra payment note (shown on pay page)
                  </label>
                  <textarea
                    value={form.paymentNote}
                    onChange={(e) => set('paymentNote', e.target.value)}
                    rows={2}
                    placeholder="Optional instructions for payers"
                    className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-bold text-theme-primary">Membership after payment</h4>
              <p className="mt-1 text-xs text-theme-muted">
                When a payment is approved, access is extended by this many days (default 60 = 2 months).
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-muted">
                    VIP membership length (days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={form.membershipDays}
                    onChange={(e) => set('membershipDays', Number(e.target.value))}
                    className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-muted">
                    Auto trial for new sign-ups (days, 0 = off)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={form.autoTrialDays}
                    onChange={(e) => set('autoTrialDays', Number(e.target.value))}
                    className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-theme-muted">
                    New accounts from /pay get this many free days automatically.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-theme bg-theme-elevated/30 p-4">
              <h4 className="text-sm font-bold text-theme-primary">Site-wide free access</h4>
              <p className="mt-1 text-xs text-theme-muted">
                Let every registered student log in to the VIP desk without paying — for a limited time
                (e.g. 1 week promo). They still need an account (phone or email).
              </p>

              {promoActive ? (
                <div className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200/90">
                  Active until {formatUntil(form.siteFreeAccessUntil)} — all registered students can use the VIP desk.
                </div>
              ) : form.siteFreeAccessUntil ? (
                <div className="mt-3 rounded-lg bg-theme-elevated/60 px-3 py-2 text-xs text-theme-muted">
                  Last promo ended {formatUntil(form.siteFreeAccessUntil)}.
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-muted">Days</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={promoDays}
                    onChange={(e) => setPromoDays(Number(e.target.value))}
                    className="w-24 rounded-lg border border-theme bg-theme-elevated/60 px-2 py-1.5 text-sm"
                  />
                </div>
                <button
                  type="button"
                  disabled={promoBusy}
                  className="admin-btn admin-btn--primary admin-btn--sm"
                  onClick={() => void enablePromo(promoDays)}
                >
                  Open VIP for everyone
                </button>
                {[7, 14].map((d) => (
                  <button
                    key={d}
                    type="button"
                    disabled={promoBusy}
                    className="admin-btn admin-btn--secondary admin-btn--sm"
                    onClick={() => void enablePromo(d)}
                  >
                    {d} days
                  </button>
                ))}
                {promoActive ? (
                  <button
                    type="button"
                    disabled={promoBusy}
                    className="admin-btn admin-btn--danger admin-btn--sm"
                    onClick={() => void disablePromo()}
                  >
                    Turn off free access
                  </button>
                ) : null}
              </div>
            </section>

            <section>
              <h4 className="text-sm font-bold text-theme-primary">Program plans (forex / crypto / bundle)</h4>
              <p className="mt-1 text-xs text-theme-muted">
                When enabled, students pick a plan on /pay. Forex and crypto are one track each; bundle is both.
                Turn off to use the single default amount above.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2 flex cursor-pointer items-center gap-2 text-sm text-theme-primary">
                  <input
                    type="checkbox"
                    checked={form.programsEnabled}
                    onChange={(e) => set('programsEnabled', e.target.checked)}
                  />
                  Show program plan picker on pay page
                </label>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-muted">
                    Forex program ({form.currency})
                  </label>
                  <input
                    type="number"
                    min={100}
                    value={form.programForexAmount}
                    onChange={(e) => set('programForexAmount', Number(e.target.value))}
                    className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-muted">
                    Crypto program ({form.currency})
                  </label>
                  <input
                    type="number"
                    min={100}
                    value={form.programCryptoAmount}
                    onChange={(e) => set('programCryptoAmount', Number(e.target.value))}
                    className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-muted">
                    Full bundle — forex + crypto ({form.currency})
                  </label>
                  <input
                    type="number"
                    min={100}
                    value={form.programBundleAmount}
                    onChange={(e) => set('programBundleAmount', Number(e.target.value))}
                    className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-bold text-theme-primary">In-person classes (paid members)</h4>
              <p className="mt-1 text-xs text-theme-muted">
                Shown on the VIP desk for paid students — Coach teaches in person as well as online.
              </p>
              <div className="mt-3 grid gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-theme-primary">
                  <input
                    type="checkbox"
                    checked={form.physicalClassesEnabled}
                    onChange={(e) => set('physicalClassesEnabled', e.target.checked)}
                  />
                  Show in-person class card on VIP desk
                </label>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-muted">Schedule</label>
                  <input
                    value={form.physicalClassSchedule}
                    onChange={(e) => set('physicalClassSchedule', e.target.value)}
                    placeholder="e.g. Saturdays 10:00 — contact Coach for exact dates"
                    className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-muted">Location</label>
                  <input
                    value={form.physicalClassLocation}
                    onChange={(e) => set('physicalClassLocation', e.target.value)}
                    placeholder="Kigali, Remera"
                    className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-muted">Extra note</label>
                  <textarea
                    value={form.physicalClassNote}
                    onChange={(e) => set('physicalClassNote', e.target.value)}
                    rows={2}
                    placeholder="e.g. Bring notebook. Message Coach on WhatsApp to reserve your seat."
                    className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-bold text-theme-primary">Tips & messages</h4>
              <div className="mt-3 grid gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-muted">
                    VIP desk tip (shown at top of student desk)
                  </label>
                  <textarea
                    value={form.accessTip}
                    onChange={(e) => set('accessTip', e.target.value)}
                    rows={2}
                    placeholder="e.g. Live class tonight 8pm — bring your journal!"
                    className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-muted">
                    Pay page tip (highlight box above payment steps)
                  </label>
                  <textarea
                    value={form.payPageTip}
                    onChange={(e) => set('payPageTip', e.target.value)}
                    rows={2}
                    placeholder="e.g. Renew now — next live mentorship cohort starts Monday."
                    className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={saving} className="admin-btn admin-btn--primary" onClick={save}>
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
