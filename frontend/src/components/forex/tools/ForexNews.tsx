import { Newspaper } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { ForexToolShell } from '@/components/forex/ForexToolShell'
import { marketApi, type ForexNewsItem } from '@/services/api'

export function ForexNews() {
  const { t } = useLanguage()
  const [items, setItems] = useState<ForexNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await marketApi.news()
        if (!cancelled) {
          setItems(res.data.slice(0, 12))
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const id = window.setInterval(() => void load(), 120_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  return (
    <ForexToolShell
      icon={Newspaper}
      title={t.tools.newsTitle}
      description={t.tools.newsDesc}
      tag={t.tools.tagMarket}
    >
      {loading ? <p className="text-sm text-theme-muted">{t.tools.newsLoading}</p> : null}
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {!loading && items.length === 0 ? (
        <p className="text-sm text-theme-muted">{t.tools.newsEmpty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="forex-calendar-row hover:bg-theme-elevated/40"
              >
                <span className="min-w-0 flex-1 text-sm text-theme-primary">{item.headline}</span>
                <span className="shrink-0 text-[10px] text-theme-muted">{item.source}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[10px] text-theme-muted">{t.tools.liveFeed}</p>
    </ForexToolShell>
  )
}
