import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BRAND } from '@/constants/brand'
import { useCmsContent } from '@/cms/CmsProvider'
import { isSectionEnabled } from '@/cms/sectionVisibility'
import { useLanguage } from '@/context/LanguageContext'
import { StoryViewerModal } from '@/components/public/StoryViewerModal'
import { formatRelativeTime } from '@/utils/relativeTime'
import type { DailyUpdate } from '@/cms/types'

function storyPreview(update: DailyUpdate) {
  if (update.type === 'image' && update.mediaDataUrl) return update.mediaDataUrl
  if (update.type === 'video' && update.posterDataUrl) return update.posterDataUrl
  if (update.type === 'video' && update.mediaDataUrl) return update.mediaDataUrl
  return null
}

export function DailyUpdatesStrip() {
  const active = useCmsContent()
  const { t } = useLanguage()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const updates = useMemo(
    () =>
      [...(active.dailyUpdates ?? [])]
        .filter((u) => u.enabled)
        .sort((a, b) => {
          const ta = Date.parse(a.createdAt) || 0
          const tb = Date.parse(b.createdAt) || 0
          if (tb !== ta) return tb - ta
          return a.order - b.order
        }),
    [active.dailyUpdates],
  )

  if (!isSectionEnabled(active, 'dailyUpdates') || updates.length === 0) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.5 }}
        className="mx-auto mt-3 w-full max-w-2xl sm:mt-8"
      >
        <div className="mb-2 flex flex-col gap-0.5 px-1 sm:mb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-theme-muted sm:text-xs sm:tracking-[0.2em]">
            {t.hero.dailyUpdatesTitle}
          </p>
          <p className="text-[10px] text-theme-muted/80 sm:text-[11px]">{t.hero.dailyUpdatesHint}</p>
        </div>

        <div className="scrollbar-hide flex gap-3 overflow-x-auto px-1 pb-1">
          {updates.map((update, idx) => {
            const preview = storyPreview(update)
            const label = update.caption.trim().slice(0, 18) || t.hero.dailyUpdatesFallback
            return (
              <button
                key={update.id}
                type="button"
                onClick={() => setOpenIndex(idx)}
                className="story-bubble group shrink-0"
                aria-label={`Open update: ${label}`}
              >
                <span className="story-bubble-ring">
                  <span className="story-bubble-inner">
                    {preview ? (
                      update.type === 'video' && !update.posterDataUrl && update.mediaDataUrl ? (
                        <video
                          src={update.mediaDataUrl}
                          muted
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img src={preview} alt="" className="h-full w-full object-cover" loading="lazy" />
                      )
                    ) : (
                      <span className="story-bubble-text-icon">FX</span>
                    )}
                  </span>
                </span>
                <span className="story-bubble-label">{label}</span>
                <span className="story-bubble-time">{formatRelativeTime(update.createdAt)}</span>
              </button>
            )
          })}

          <a
            href={BRAND.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="story-bubble group shrink-0"
            aria-label={t.hero.dailyUpdatesCommunity}
          >
            <span className="story-bubble-ring story-bubble-ring--community">
              <span className="story-bubble-inner story-bubble-inner--community">+</span>
            </span>
            <span className="story-bubble-label">{t.hero.dailyUpdatesCommunity}</span>
          </a>
        </div>
      </motion.div>

      {openIndex !== null && (
        <StoryViewerModal
          items={updates}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
        />
      )}
    </>
  )
}
