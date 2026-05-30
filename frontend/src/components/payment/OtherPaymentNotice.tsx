import { MessageCircle, Phone } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { BRAND } from '@/constants/brand'

function coachWaLink(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const text = 'Hello Coach, I need help paying without MTN or Airtel MoMo.'
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function OtherPaymentNotice({ coachPhone }: { coachPhone?: string }) {
  const { t } = useLanguage()
  const display = coachPhone?.trim() || BRAND.whatsapp
  const waHref = coachWaLink(display)

  return (
    <div className="pay-other-network mt-4 rounded-xl border border-theme bg-theme-surface/50 p-4 text-sm">
      <p className="font-semibold text-theme-primary">{t.pay.otherNetworkTitle}</p>
      <p className="mt-1.5 text-theme-muted">{t.pay.otherNetworkBody}</p>
      <p className="mt-3 inline-flex items-center gap-2 font-mono text-base font-bold text-theme-accent">
        <Phone className="h-4 w-4 shrink-0" aria-hidden />
        {t.pay.otherNetworkCoach.replace('{phone}', display)}
      </p>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        {t.pay.otherNetworkContact}
      </a>
    </div>
  )
}
