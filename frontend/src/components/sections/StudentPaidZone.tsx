import { lazy, Suspense } from 'react'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { StudentUpgradeTeaser } from '@/components/sections/StudentUpgradeTeaser'

const ForexTools = lazy(() =>
  import('@/components/sections/ForexTools').then((m) => ({ default: m.ForexTools })),
)
const LiveTradingRoom = lazy(() =>
  import('@/components/sections/LiveTradingRoom').then((m) => ({ default: m.LiveTradingRoom })),
)

function SectionFallback() {
  return <div className="min-h-[32vh]" aria-hidden />
}

/**
 * Paid student desk (tools + live). Public homepage visitors see StudentUpgradeTeaser only.
 */
export function StudentPaidZone() {
  const { isPaid, loading } = useStudentAccess()

  if (loading) {
    return <div className="min-h-[24vh] border-t border-theme" aria-hidden />
  }

  if (!isPaid) {
    return <StudentUpgradeTeaser />
  }

  return (
    <div className="premium-site border-t border-theme bg-theme-bg">
      <Suspense fallback={<SectionFallback />}>
        <ForexTools />
        <LiveTradingRoom />
      </Suspense>
    </div>
  )
}
