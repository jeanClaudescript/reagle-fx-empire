import { useLanguage } from '@/context/LanguageContext'
import { useCms } from '@/cms/CmsProvider'
import { useAdminConfirm } from '@/admin/confirm'
import type { CMSMedia, MasteryCardKey, MediaOrientation, MediaType } from '@/cms/types'
import { AdminCard } from '@/components/admin/AdminCard'
import { AdminSelect } from '@/components/admin/AdminInput'
import { MediaUploader } from '@/components/admin/MediaUploader'
import { AdminMediaThumb } from '@/components/admin/media/AdminMediaThumb'
import { useState } from 'react'

const CARD_KEYS: MasteryCardKey[] = [
  'risk',
  'technical',
  'psychology',
  'structure',
  'beginner',
  'live',
]

export function MasteryEditor() {
  const { t } = useLanguage()
  const { draft, updateDraft } = useCms()
  const { confirm } = useAdminConfirm()
  const [orientationByKey, setOrientationByKey] = useState<Record<MasteryCardKey, MediaOrientation>>({
    risk: 'horizontal',
    technical: 'horizontal',
    psychology: 'horizontal',
    structure: 'horizontal',
    beginner: 'horizontal',
    live: 'vertical',
  })

  const setMedia = (key: MasteryCardKey, media: CMSMedia | undefined) => {
    updateDraft((prev) => {
      const nextByKey = { ...prev.mastery.byKey }
      if (media) nextByKey[key] = media
      else delete nextByKey[key]
      return { ...prev, mastery: { byKey: nextByKey } }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminCard>
        <div className="admin-card-body">
          <p className="admin-editor-card-intro">
            Optional image or video under each lesson card. Cards stay the same — only media appears when uploaded.
          </p>
        </div>
      </AdminCard>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        {CARD_KEYS.map((key) => {
          const media = draft.mastery.byKey[key]
          const title = t.lessons[key]
          const orientation = orientationByKey[key]

          return (
            <AdminCard key={key}>
              <div className="admin-card-body">
                <p className="font-display text-base font-bold text-theme-primary">{title}</p>
                <p className="mt-0.5 text-xs text-theme-muted">{key}</p>

                {media?.mediaDataUrl ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-theme">
                    <AdminMediaThumb
                      kind={media.type === 'video' ? 'video' : 'image'}
                      src={media.mediaDataUrl}
                      poster={media.posterDataUrl}
                      alt={title}
                      className={`block w-full ${
                        media.orientation === 'vertical' ? 'aspect-[9/16]' : 'aspect-video'
                      }`}
                    >
                      {media.type === 'video' ? (
                        <video
                          src={media.mediaDataUrl}
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img src={media.mediaDataUrl} alt={title} className="h-full w-full object-cover" />
                      )}
                    </AdminMediaThumb>
                    <div className="flex flex-wrap gap-2 border-t border-theme p-3">
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger admin-btn--sm"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Remove media?',
                            message: 'Media will be removed from this mastery card in your draft.',
                            confirmLabel: 'Remove',
                            variant: 'danger',
                          })
                          if (!ok) return
                          setMedia(key, undefined)
                        }}
                      >
                        Remove media
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-theme-muted">Orientation</label>
                      <AdminSelect
                        value={orientation}
                        onChange={(e) =>
                          setOrientationByKey((prev) => ({
                            ...prev,
                            [key]: e.target.value as MediaOrientation,
                          }))
                        }
                        className="w-full"
                      >
                        <option value="horizontal">Horizontal (landscape)</option>
                        <option value="vertical">Vertical (portrait)</option>
                      </AdminSelect>
                    </div>

                    <MediaUploader
                      label="Upload image or video"
                      onUpload={async (dataUrl, file) => {
                        const type: MediaType = file.type.startsWith('video/') ? 'video' : 'image'
                        const next: CMSMedia = {
                          id: `mastery-${key}-${Date.now()}`,
                          type,
                          orientation: orientationByKey[key],
                          mediaDataUrl: dataUrl,
                          order: 1,
                        }
                        setMedia(key, next)
                      }}
                    />
                  </div>
                )}
              </div>
            </AdminCard>
          )
        })}
      </div>
    </div>
  )
}
