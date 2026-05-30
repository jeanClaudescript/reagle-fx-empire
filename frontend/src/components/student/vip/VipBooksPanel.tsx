import { BookOpen, Download, ExternalLink } from 'lucide-react'
import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useCmsContent } from '@/cms/CmsProvider'
import { isSectionEnabled } from '@/cms/sectionVisibility'

export function VipBooksPanel() {
  const { t } = useLanguage()
  const active = useCmsContent()

  const books = useMemo(
    () =>
      (active.vipBooks ?? [])
        .filter((b) => b.enabled && b.fileUrl)
        .sort((a, b) => a.order - b.order),
    [active.vipBooks],
  )

  if (!isSectionEnabled(active, 'books')) {
    return (
      <div className="vip-books-empty">
        <BookOpen className="h-8 w-8 text-theme-muted" />
        <p className="mt-3 text-sm text-theme-muted">{t.books.hidden}</p>
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="vip-books-empty">
        <BookOpen className="h-8 w-8 text-theme-muted" />
        <p className="mt-3 text-sm text-theme-muted">{t.books.empty}</p>
      </div>
    )
  }

  return (
    <div className="vip-books-grid">
      {books.map((book) => (
        <article key={book.id} className="vip-book-card">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt="" className="vip-book-card__cover" loading="lazy" />
          ) : (
            <div className="vip-book-card__cover vip-book-card__cover--placeholder">
              <BookOpen className="h-8 w-8 text-theme-accent" />
            </div>
          )}
          <div className="vip-book-card__body">
            <h3 className="font-display text-base font-bold text-theme-primary">{book.title}</h3>
            {book.description ? <p className="mt-1 text-sm text-theme-muted">{book.description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={book.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="vip-btn vip-btn--ghost vip-btn--sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t.books.read}
              </a>
              <a href={book.fileUrl} download={book.fileName || `${book.title}.pdf`} className="vip-btn vip-btn--primary vip-btn--sm">
                <Download className="h-3.5 w-3.5" />
                {t.books.download}
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
