import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Copy,
  Loader2,
  Phone,
  Smartphone,
  Wallet,
  XCircle,
} from 'lucide-react'
import {
  paymentApi,
  type PaymentConfig,
  type PaymentInstructions,
  type PaymentRecord,
} from '@/services/api'
import { GlowButton } from '@/components/ui/GlowButton'
import { useLanguage } from '@/context/LanguageContext'
import { buildTelUssdHref } from '@/utils/ussdTel'
import { useStudentAccess } from '@/context/StudentAccessContext'

type Step = 'form' | 'pay' | 'done'

function PaySteps({ step }: { step: Step }) {
  const { t } = useLanguage()
  const items: { id: Step; label: string }[] = [
    { id: 'form', label: t.pay.stepDetails },
    { id: 'pay', label: t.pay.stepPay },
    { id: 'done', label: t.pay.stepDone },
  ]
  const order = ['form', 'pay', 'done'] as const
  const idx = order.indexOf(step)

  return (
    <div className="pay-steps">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-2">
          <span
            className={`pay-step ${i < idx ? 'pay-step--done' : ''} ${i === idx ? 'pay-step--active' : ''}`}
          >
            {i < idx ? '✓ ' : ''}
            {item.label}
          </span>
          {i < items.length - 1 && <span className="pay-step-line" />}
        </div>
      ))}
    </div>
  )
}

function readQueryParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    ref: params.get('ref')?.trim().toUpperCase() || '',
    phone: params.get('phone')?.trim() || '',
    email: params.get('email')?.trim() || '',
  }
}

function statusTone(status: PaymentRecord['status']) {
  if (status === 'PAID') return 'pay-status--paid'
  if (status === 'FAILED' || status === 'EXPIRED') return 'pay-status--failed'
  return 'pay-status--pending'
}

export function PaymentFlow() {
  const { t } = useLanguage()
  const { checkAccess } = useStudentAccess()
  const [step, setStep] = useState<Step>('form')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [referrerCode, setReferrerCode] = useState(() => readQueryParams().ref)
  const [provider, setProvider] = useState<'MTN' | 'AIRTEL'>('MTN')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [payment, setPayment] = useState<PaymentRecord | null>(null)
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null)
  const [myReferralCode, setMyReferralCode] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [config, setConfig] = useState<PaymentConfig | null>(null)
  const [amount, setAmount] = useState<number | ''>('')
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    const q = readQueryParams()
    if (q.phone) setPhone(q.phone)
    if (q.email) setEmail(q.email)
    if (q.ref) setReferrerCode(q.ref)
  }, [])

  useEffect(() => {
    paymentApi
      .getConfig()
      .then((res) => {
        setConfig(res.data)
        setAmount(res.data.defaultAmount)
      })
      .catch(() => null)
  }, [])

  useEffect(() => {
    if (!payment || payment.status === 'PAID' || payment.status === 'FAILED') return
    setPolling(true)
    const id = window.setInterval(async () => {
      try {
        const res = await paymentApi.getStatus(payment.referenceCode)
        setPayment(res.data)
        if (res.data.status === 'PAID') {
          setStep('done')
          setPolling(false)
          const paidPhone = res.data.phone?.trim() || phone.trim()
          if (paidPhone || email.trim()) {
            void checkAccess({
              phone: paidPhone || undefined,
              email: email.trim() || undefined,
              name: name.trim() || undefined,
            })
          }
        } else if (res.data.status === 'FAILED' || res.data.status === 'EXPIRED') {
          setPolling(false)
        }
      } catch {
        /* ignore poll errors */
      }
    }, 5000)
    return () => {
      window.clearInterval(id)
      setPolling(false)
    }
  }, [payment?.referenceCode, payment?.status, phone, email, name, checkAccess])

  const payAmount = useMemo(() => {
    if (!config) return 0
    if (config.allowCustomAmount && amount !== '') return Number(amount)
    return config.defaultAmount
  }, [config, amount])

  const amountLabel = useMemo(() => {
    if (!config) return '—'
    const value = config.allowCustomAmount && amount !== '' ? Number(amount) : config.defaultAmount
    if (!Number.isFinite(value)) return '—'
    return `${value.toLocaleString()} ${config.currency}`
  }, [config, amount])

  const activeUssd = useMemo(() => {
    if (!instructions) return ''
    return provider === 'AIRTEL' ? instructions.airtelUssdDial : instructions.mtnUssdDial
  }, [instructions, provider])

  const telUssdHref = useMemo(() => (activeUssd ? buildTelUssdHref(activeUssd) : ''), [activeUssd])

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setError(null)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      setError(t.pay.copyFailed)
    }
  }

  /** Copy USSD then open dialer — works on hosted HTTPS; many phones ignore prefilled USSD from tel: alone. */
  const openUssdDialer = async () => {
    if (!activeUssd) return
    setError(null)
    try {
      await navigator.clipboard.writeText(activeUssd)
      setCopied('ussd-auto')
      setInfo(t.pay.dialerCopiedHint)
      window.setTimeout(() => setCopied(null), 4000)
    } catch {
      setInfo(t.pay.dialerPasteHint)
    }
    const href = telUssdHref || buildTelUssdHref(activeUssd)
    window.location.assign(href)
  }

  const startPayment = async () => {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const res = await paymentApi.create({
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        name: name.trim() || undefined,
        referrerCode: referrerCode.trim() || undefined,
        provider,
        amount: config?.allowCustomAmount ? payAmount : undefined,
      })
      setPayment(res.data.payment)
      setInstructions(res.data.instructions)
      setMyReferralCode(res.data.referralCode)
      setProvider(res.data.instructions.provider)
      setStep('pay')
    } catch (e) {
      setError(e instanceof Error ? e.message : t.pay.createFailed)
    } finally {
      setBusy(false)
    }
  }

  const submitTx = async () => {
    if (!payment) return
    setBusy(true)
    setError(null)
    try {
      const res = await paymentApi.submitTransaction(payment.id, transactionId)
      setPayment(res.data)
      setInfo(t.pay.txSubmitted)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.pay.txFailed)
    } finally {
      setBusy(false)
    }
  }

  const referralLink = myReferralCode
    ? `${window.location.origin}/pay?ref=${encodeURIComponent(myReferralCode)}`
    : ''

  if (config && !config.paymentsEnabled) {
    return (
      <div className="glass-card mx-auto max-w-lg p-8 text-center">
        <p className="text-theme-muted">{t.pay.disabled}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <PaySteps step={step} />

      {step === 'form' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pay-flow-card">
          <h2 className="font-display text-2xl font-bold text-theme-primary">{t.pay.title}</h2>
          <p className="mt-2 text-sm text-theme-muted">{t.pay.subtitle}</p>

          <div className="pay-method-preview mt-6">
            <p className="text-xs font-bold uppercase tracking-wider text-theme-muted">{t.pay.howItWorks}</p>
            <ol className="mt-2 space-y-2 text-sm text-theme-primary">
              <li>{t.pay.flowStep1}</li>
              <li>{t.pay.flowStep2}</li>
              <li>{t.pay.flowStep3}</li>
            </ol>
          </div>

          <div className="mt-6 space-y-4">
            <label className="forex-field">
              <span>{t.pay.phoneLabel}</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
              />
            </label>
            <label className="forex-field">
              <span>{t.pay.emailLabel}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </label>
            <label className="forex-field">
              <span>{t.pay.nameLabel}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="forex-field">
              <span>{t.pay.referralLabel}</span>
              <input
                value={referrerCode}
                onChange={(e) => setReferrerCode(e.target.value.toUpperCase())}
                placeholder="REF-XXXX"
              />
            </label>
            <label className="forex-field">
              <span>{t.pay.networkLabel}</span>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as 'MTN' | 'AIRTEL')}
              >
                <option value="MTN">{t.pay.networkMtn}</option>
                <option value="AIRTEL">{t.pay.networkAirtel}</option>
              </select>
            </label>
            {config?.allowCustomAmount ? (
              <label className="forex-field">
                <span>
                  {t.pay.amountLabel} ({config.currency})
                </span>
                <input
                  type="number"
                  min={100}
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
              </label>
            ) : (
              <p className="forex-tool-result text-sm text-theme-muted">
                {t.pay.amountFixed}:{' '}
                <span className="font-semibold text-theme-primary">{amountLabel}</span>
                {config?.displayMerchantPhone ? (
                  <>
                    {' '}
                    · {t.pay.payTo}{' '}
                    <span className="font-semibold text-theme-primary">
                      {config.displayMerchantPhone}
                    </span>
                  </>
                ) : null}
              </p>
            )}
          </div>

          {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

          <button
            type="button"
            disabled={busy || (!phone.trim() && !email.trim())}
            onClick={startPayment}
            className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-empire-purple to-empire-blue font-semibold text-white disabled:opacity-50"
          >
            {busy ? t.pay.creating : t.pay.continueCta}
          </button>
        </motion.div>
      )}

      {step === 'pay' && payment && instructions && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pay-flow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`pay-status ${statusTone(payment.status)}`}>
              {t.pay.statusLabel}: {payment.status}
            </p>
            {polling && payment.status === 'PENDING' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-theme-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t.pay.checkingStatus}
              </span>
            )}
          </div>

          <h2 className="mt-3 font-display text-xl font-bold text-theme-primary">{t.pay.completeTitle}</h2>
          <p className="mt-1 text-sm text-theme-muted">{t.pay.completeSubtitle}</p>

          <div className="mt-5 space-y-3 rounded-2xl border border-theme bg-theme-surface/50 p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-theme-muted">{t.pay.referenceLabel}</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-mono font-bold text-theme-accent"
                onClick={() => copy(payment.referenceCode, 'ref')}
              >
                {payment.referenceCode}
                <Copy className="h-3.5 w-3.5" />
                {copied === 'ref' ? <span className="text-[10px]">{t.pay.copied}</span> : null}
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-theme-muted">{t.pay.amountLabel}</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-semibold text-theme-primary"
                onClick={() => copy(String(payment.amount), 'amount')}
              >
                {payment.amount.toLocaleString()} {payment.currency}
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-theme-muted">{t.pay.merchantLabel}</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-semibold text-theme-primary"
                onClick={() => copy(instructions.merchantPhone, 'merchant')}
              >
                {instructions.merchantPhone}
                <Copy className="h-3.5 w-3.5" />
                {copied === 'merchant' ? <span className="text-[10px]">{t.pay.copied}</span> : null}
              </button>
            </div>
            <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">{instructions.note}</p>
          </div>

          <div className="pay-method-card mt-6">
            <div className="pay-method-card__head">
              <Smartphone className="h-5 w-5 text-theme-accent" />
              <div>
                <h3 className="font-display font-bold text-theme-primary">{t.pay.methodUssdTitle}</h3>
                <p className="text-xs text-theme-muted">{t.pay.methodUssdDesc}</p>
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-theme-muted">
              {provider === 'MTN' ? t.pay.networkMtn : t.pay.networkAirtel} · {t.pay.ussdFormat}
            </p>
            <div className="mt-2 flex items-start justify-between gap-2 rounded-xl border border-theme bg-black/30 p-3">
              <code className="break-all font-mono text-sm font-bold text-emerald-300">{activeUssd}</code>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-theme px-2 py-1 text-xs font-semibold text-theme-accent"
                onClick={() => copy(activeUssd, 'ussd')}
              >
                {copied === 'ussd' ? t.pay.copied : t.pay.copyUssd}
              </button>
            </div>
            <button
              type="button"
              className="pay-action-btn pay-action-btn--primary mt-3"
              onClick={() => void openUssdDialer()}
            >
              <Smartphone className="h-4 w-4" />
              {t.pay.openDialer}
            </button>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-theme-muted">
              {t.pay.dialerFootnote}
            </p>
          </div>

          <div className="pay-method-card mt-4">
            <div className="pay-method-card__head">
              <Wallet className="h-5 w-5 text-theme-accent" />
              <div>
                <h3 className="font-display font-bold text-theme-primary">{t.pay.methodManualTitle}</h3>
                <p className="text-xs text-theme-muted">{t.pay.methodManualDesc}</p>
              </div>
            </div>
            <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-theme-primary">
              <li>{t.pay.manualStep1}</li>
              <li>{t.pay.manualStep2}</li>
              <li>{t.pay.manualStep3}</li>
            </ol>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="pay-action-btn pay-action-btn--secondary flex-1"
                onClick={() => copy(instructions.merchantPhone, 'merchant')}
              >
                <Copy className="h-4 w-4" />
                {t.pay.copyNumber}
              </button>
              <a href={instructions.telMerchant} className="pay-action-btn pay-action-btn--secondary flex-1">
                <Phone className="h-4 w-4" />
                {t.pay.callMerchant}
              </a>
            </div>
          </div>

          <div className="mt-6 border-t border-theme pt-5">
            <p className="text-xs font-bold uppercase tracking-wider text-theme-muted">{t.pay.confirmTitle}</p>
            <p className="mt-1 text-sm text-theme-muted">{t.pay.confirmDesc}</p>
            <label className="forex-field mt-3">
              <span>{t.pay.txLabel}</span>
              <input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder={t.pay.txPlaceholder}
              />
            </label>
            <button
              type="button"
              disabled={busy || !transactionId.trim()}
              onClick={submitTx}
              className="mt-3 h-11 w-full rounded-xl border border-theme font-semibold text-theme-primary disabled:opacity-50"
            >
              {busy ? t.pay.submitting : t.pay.submitTx}
            </button>
            {payment.transactionId && (
              <p className="mt-2 text-xs text-theme-muted">
                {t.pay.txSaved}: <span className="font-mono">{payment.transactionId}</span>
              </p>
            )}
          </div>

          {payment.status === 'FAILED' && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {t.pay.failedHint}
            </div>
          )}

          {info && <p className="mt-3 text-sm text-emerald-400">{info}</p>}
          {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        </motion.div>
      )}

      {step === 'done' && payment && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pay-flow-card p-8 text-center"
        >
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
          <h2 className="mt-4 font-display text-2xl font-bold text-theme-primary">{t.pay.doneTitle}</h2>
          <p className="mt-2 text-sm text-theme-muted">
            {t.pay.doneRef} {payment.referenceCode}
          </p>
          {myReferralCode && (
            <div className="mt-5 rounded-2xl border border-theme bg-theme-surface/50 px-4 py-4 text-left text-sm">
              <p className="font-semibold text-theme-primary">{t.pay.yourReferral}</p>
              <button
                type="button"
                className="mt-2 font-mono text-lg font-bold text-theme-accent"
                onClick={() => copy(myReferralCode, 'refcode')}
              >
                {myReferralCode}
              </button>
              {referralLink ? (
                <button
                  type="button"
                  className="mt-3 block w-full truncate text-left text-xs text-theme-muted underline"
                  onClick={() => copy(referralLink, 'link')}
                >
                  {referralLink}
                </button>
              ) : null}
              <p className="mt-2 text-xs text-theme-muted">{t.pay.referralHint}</p>
            </div>
          )}
          <GlowButton href="/" variant="secondary" external={false} className="mt-6">
            {t.pay.backHome}
          </GlowButton>
        </motion.div>
      )}
    </div>
  )
}
