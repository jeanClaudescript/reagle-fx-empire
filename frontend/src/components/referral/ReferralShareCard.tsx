import { Copy, Share2, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { buildReferralJoinUrl } from '@/referral/referralStorage'

type Props = {
  code: string
  compact?: boolean
}

export function ReferralShareCard({ code, compact = false }: Props) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)
  const link = buildReferralJoinUrl(code)

  const copy = async (text: string, kind: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 2500)
    } catch {
      /* ignore */
    }
  }

  const shareWhatsApp = () => {
    const message = `${t.referral.shareMessage}\n${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  const shareNative = async () => {
    if (!navigator.share) {
      void copy(link, 'link')
      return
    }
    try {
      await navigator.share({
        title: t.referral.shareTitle,
        text: t.referral.shareMessage,
        url: link,
      })
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className={`referral-share ${compact ? 'referral-share--compact' : ''}`}>
      <p className="font-semibold text-theme-primary">{t.referral.shareTitle}</p>
      <p className="mt-1 text-xs text-theme-muted">{t.referral.shareSubtitle}</p>

      <div className="referral-share__link-box mt-3">
        <p className="truncate font-mono text-xs text-theme-primary">{link}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="referral-share__btn" onClick={() => void copy(link, 'link')}>
          <Copy className="h-3.5 w-3.5" />
          {copied === 'link' ? t.referral.copied : t.referral.copyLink}
        </button>
        <button type="button" className="referral-share__btn referral-share__btn--accent" onClick={shareWhatsApp}>
          <MessageCircle className="h-3.5 w-3.5" />
          {t.referral.shareWhatsApp}
        </button>
        <button type="button" className="referral-share__btn" onClick={() => void shareNative()}>
          <Share2 className="h-3.5 w-3.5" />
          {t.referral.shareMore}
        </button>
      </div>

      <p className="mt-3 text-[11px] text-theme-muted">
        {t.referral.codeLabel}:{' '}
        <button
          type="button"
          className="font-mono font-bold text-theme-accent underline-offset-2 hover:underline"
          onClick={() => void copy(code, 'code')}
        >
          {code}
        </button>
        {copied === 'code' ? <span className="ml-2 text-emerald-400">{t.referral.copied}</span> : null}
      </p>
      <p className="mt-2 text-xs text-theme-muted">{t.referral.shareHint}</p>
    </div>
  )
}
