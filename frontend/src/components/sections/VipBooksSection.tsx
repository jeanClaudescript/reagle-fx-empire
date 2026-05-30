import { BookOpen } from 'lucide-react'
import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useCmsContent } from '@/cms/CmsProvider'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { isSectionEnabled } from '@/cms/sectionVisibility'
import { VipBooksPanel } from '@/components/student/vip/VipBooksPanel'

export function VipBooksSection() {
  const { t } = useLanguage()
  const active = useCmsContent()
  const { isPaid } = useStudentAccess()

  const hasBooks = useMemo(
    () => (active.vipBooks ?? []).some((b) => b.enabled && b.fileUrl),
    [active.vipBooks],
  )

  if (!isPaid || !isSectionEnabled(active, 'books') || !hasBooks) return null

  return (
    <section id="vip-books" className="border-t border-theme bg-theme-bg section-pad">
      <div className="section-container">
        <div className="mb-8 flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-theme-accent" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-theme-accent">{t.books.label}</p>
            <h2 className="font-display text-2xl font-bold text-theme-primary sm:text-3xl">{t.books.title}</h2>
            <p className="mt-1 text-sm text-theme-muted">{t.books.subtitle}</p>
          </div>
        </div>
        <VipBooksPanel />
      </div>
    </section>
  )
}
