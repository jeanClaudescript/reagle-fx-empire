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
    <section id="vip-books" className="ps-section">
      <div className="ps-section__inner">
        <div className="ps-section__head">
          <div className="flex items-start gap-3">
            <span className="ps-hub-card__icon ps-hub-card__icon--amber">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="ps-hub-hero__eyebrow">{t.books.label}</p>
              <h2 className="ps-hub-hero__title">{t.books.title}</h2>
              <p className="ps-hub-hero__desc mt-1">{t.books.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="ps-surface-card p-4 sm:p-6">
          <VipBooksPanel />
        </div>
      </div>
    </section>
  )
}
