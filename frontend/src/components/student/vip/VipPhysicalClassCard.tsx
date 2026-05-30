import { MapPin, MessageCircle } from 'lucide-react'
import { BRAND } from '@/constants/brand'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { usePaymentConfig } from '@/hooks/usePaymentConfig'

export function VipPhysicalClassCard() {
  const { t } = useLanguage()
  const { accessMode } = useStudentAccess()
  const { config } = usePaymentConfig()

  if (accessMode !== 'paid') return null
  if (!config?.physicalClassesEnabled) return null

  const schedule = config.physicalClassSchedule?.trim()
  const location = config.physicalClassLocation?.trim() || BRAND.location
  const note = config.physicalClassNote?.trim()
  const whatsappHref = `https://wa.me/${BRAND.whatsapp.replace(/\D/g, '')}`

  return (
    <div className="vip-physical-card">
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-theme-accent" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold text-theme-primary">{t.vip.physicalTitle}</h3>
          <p className="mt-1 text-sm text-theme-muted">{t.vip.physicalSubtitle}</p>
          <dl className="mt-4 space-y-2 text-sm">
            {schedule ? (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
                  {t.vip.physicalSchedule}
                </dt>
                <dd className="mt-0.5 text-theme-primary">{schedule}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
                {t.vip.physicalLocation}
              </dt>
              <dd className="mt-0.5 text-theme-primary">{location}</dd>
            </div>
            {note ? (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
                  {t.vip.physicalNote}
                </dt>
                <dd className="mt-0.5 text-theme-muted">{note}</dd>
              </div>
            ) : null}
          </dl>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-theme-accent/40 bg-theme-accent/10 px-4 py-2 text-sm font-semibold text-theme-accent"
          >
            <MessageCircle className="h-4 w-4" />
            {t.vip.physicalContactCta}
          </a>
        </div>
      </div>
    </div>
  )
}
