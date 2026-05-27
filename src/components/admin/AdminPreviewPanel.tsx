import { PublicSite } from '@/pages/PublicSite'
import { useCms } from '@/cms/CmsProvider'
import { AdminCard } from '@/components/admin/AdminCard'

/** Embeds live site preview — always renders draft content in real time. */
export function AdminPreviewPanel({ visible }: { visible: boolean }) {
  const { hasDraftChanges } = useCms()

  if (!visible) return null

  return (
    <AdminCard className="overflow-hidden">
      <div className="admin-card-body flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-theme-muted">
            Live preview
          </p>
          <p className="mt-1 text-sm font-semibold text-theme-primary">
            Draft mode · updates instantly
          </p>
        </div>
        {hasDraftChanges && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            Unpublished changes
          </span>
        )}
      </div>
      <div className="admin-preview-frame h-[min(55vh,520px)] border-t border-theme bg-theme-bg sm:h-[50vh]">
        <div className="h-full overflow-auto overscroll-contain">
          <PublicSite showOverlays={false} previewMode />
        </div>
      </div>
    </AdminCard>
  )
}
