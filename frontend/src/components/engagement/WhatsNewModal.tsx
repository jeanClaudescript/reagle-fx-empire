import { Sparkles, X } from 'lucide-react'
import { useEngagement } from '@/engagement/EngagementProvider'

export function WhatsNewModal() {
  const { whatsNewOpen, whatsNew, closeWhatsNew } = useEngagement()
  if (!whatsNewOpen || !whatsNew?.update) return null

  const update = whatsNew.update

  return (
    <div className="engagement-modal-backdrop">
      <div className="engagement-modal" role="dialog" aria-label="What's new">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="font-display text-xl font-bold text-theme-primary">{update.title}</h3>
          </div>
          <button type="button" onClick={() => void closeWhatsNew()} aria-label="Close">
            <X className="h-5 w-5 text-theme-muted" />
          </button>
        </div>
        <p className="mt-2 text-sm text-theme-muted">{update.summary}</p>
        <ul className="mt-4 space-y-2">
          {update.items.map((item) => (
            <li key={`${item.contentType}-${item.contentId}`} className="rounded-xl border border-theme bg-theme-surface/50 px-3 py-2 text-sm">
              <span className="text-xs font-bold uppercase text-theme-accent">{item.contentType}</span>
              <p className="mt-0.5 font-medium text-theme-primary">{item.title}</p>
            </li>
          ))}
        </ul>
        <button type="button" className="engagement-modal__cta mt-5" onClick={() => void closeWhatsNew()}>
          Got it
        </button>
      </div>
    </div>
  )
}
