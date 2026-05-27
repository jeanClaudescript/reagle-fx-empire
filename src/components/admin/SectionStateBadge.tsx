import type { SectionContentState } from '@/cms/sectionState'

export function SectionStateBadge({ state }: { state: SectionContentState }) {
  const statusLabel = state.status === 'draft' ? 'Draft' : 'Published'
  const statusClass =
    state.status === 'draft'
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusClass}`}>
        {statusLabel}
      </span>
      {!state.isValid && (
        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-400">
          Needs attention
        </span>
      )}
      {state.lastUpdated && (
        <span className="text-[10px] text-theme-muted">
          Updated {new Date(state.lastUpdated).toLocaleString()}
        </span>
      )}
    </div>
  )
}
