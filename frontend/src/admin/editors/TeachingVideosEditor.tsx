import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { TeachingVideoItem } from '@/cms/types'
import { useCms } from '@/cms/CmsProvider'
import { useAdminConfirm } from '@/admin/confirm'
import { AdminCard } from '@/components/admin/AdminCard'
import { AdminMediaThumb } from '@/components/admin/media/AdminMediaThumb'
import { AdminTextInput } from '@/components/admin/AdminInput'
import { uploadWithFeedback } from '@/admin/uploadWithFeedback'
import { useAdminToast } from '@/admin/toast'
import { isVideoMediaUrl } from '@/lib/mediaUrl'

function sort(items: TeachingVideoItem[]) {
  return items.slice().sort((a, b) => a.order - b.order)
}

export function TeachingVideosEditor() {
  const { draft, updateDraft } = useCms()
  const { confirm } = useAdminConfirm()
  const { push } = useAdminToast()
  const [urlById, setUrlById] = useState<Record<string, string>>({})

  const items = useMemo(() => sort(draft.teachingVideos), [draft.teachingVideos])

  return (
    <div className="flex flex-col gap-4">
      <AdminCard>
        <div className="admin-card-body">
          <p className="admin-editor-card-intro">
            Upload reels videos (or thumbnails for now). Public “Videos” section will use this data.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-editor-row admin-editor-row--media"
              >
                <div className="relative mx-auto h-[100px] w-full max-w-[150px] shrink-0 sm:mx-0 sm:w-[150px]">
                  {item.posterDataUrl ? (
                    <AdminMediaThumb
                      kind="image"
                      src={item.posterDataUrl}
                      alt={item.label}
                      className="h-[100px] w-full"
                    >
                      <img src={item.posterDataUrl} alt={item.label} className="h-full w-full object-cover" />
                    </AdminMediaThumb>
                  ) : item.videoDataUrl ? (
                    <AdminMediaThumb
                      kind="video"
                      src={item.videoDataUrl}
                      poster={item.posterDataUrl}
                      alt={item.label}
                      title={item.label}
                      className="h-[100px] w-full"
                    >
                      <video src={item.videoDataUrl} muted className="h-full w-full object-cover" playsInline />
                    </AdminMediaThumb>
                  ) : (
                    <div className="h-[100px] w-full rounded-2xl border border-theme bg-gradient-to-br from-empire-purple/25 to-empire-blue-electric/10" />
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-2">
                    <p className="truncate text-[11px] font-semibold text-white">{item.reelKey}</p>
                  </div>
                </div>

                <div className="min-w-0 flex-1 flex flex-col gap-2">
                  <label className="text-sm font-semibold text-theme-primary">Label</label>
                  <AdminTextInput
                    value={item.label}
                    onChange={(e) => {
                      const value = e.target.value
                      updateDraft((prev) => ({
                        ...prev,
                        teachingVideos: prev.teachingVideos.map((v) => (v.id === item.id ? { ...v, label: value } : v)),
                      }))
                    }}
                  />

                  <label
                    className="cursor-pointer rounded-xl border border-theme bg-theme-elevated/60 px-4 py-2 text-sm font-semibold text-theme-primary"
                  >
                    Upload media (image/video)
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const url = await uploadWithFeedback(file, push)
                        if (!url) return
                        const isVideo = file.type.startsWith('video/') || isVideoMediaUrl(url)
                        updateDraft((prev) => ({
                          ...prev,
                          teachingVideos: prev.teachingVideos.map((v) => {
                            if (v.id !== item.id) return v
                            return {
                              ...v,
                              posterDataUrl: !isVideo ? url : v.posterDataUrl,
                              videoDataUrl: isVideo ? url : v.videoDataUrl,
                            }
                          }),
                        }))
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <div className="rounded-xl border border-theme bg-theme-surface/45 p-2.5">
                    <p className="mb-2 text-xs font-semibold text-theme-muted">Or paste image/video URL</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <AdminTextInput
                        type="url"
                        value={urlById[item.id] ?? ''}
                        onChange={(e) =>
                          setUrlById((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="https://..."
                        className="w-full"
                      />
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary admin-btn--sm"
                        disabled={!(urlById[item.id] ?? '').trim()}
                        onClick={() => {
                          const value = (urlById[item.id] ?? '').trim()
                          if (!value) return
                          const urlIsVideo = isVideoMediaUrl(value)
                          updateDraft((prev) => ({
                            ...prev,
                            teachingVideos: prev.teachingVideos.map((v) => {
                              if (v.id !== item.id) return v
                              return {
                                ...v,
                                posterDataUrl: urlIsVideo ? v.posterDataUrl : value,
                                videoDataUrl: urlIsVideo ? value : v.videoDataUrl,
                              }
                            }),
                          }))
                          setUrlById((prev) => ({ ...prev, [item.id]: '' }))
                        }}
                      >
                        Use URL
                      </button>
                    </div>
                  </div>
                </div>

                <div className="admin-editor-actions">
                  <div className="flex w-full gap-2 sm:w-auto">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        updateDraft((prev) => {
                          const arr = sort(prev.teachingVideos)
                          const from = arr[idx]
                          const nextArr = arr.slice()
                          nextArr.splice(idx, 1)
                          nextArr.splice(idx - 1, 0, from)
                          return { ...prev, teachingVideos: nextArr.map((v, i) => ({ ...v, order: i + 1 })) }
                        })
                      }}
                      className="admin-btn admin-btn--secondary admin-btn--sm disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={() => {
                        updateDraft((prev) => {
                          const arr = sort(prev.teachingVideos)
                          const from = arr[idx]
                          const nextArr = arr.slice()
                          nextArr.splice(idx, 1)
                          nextArr.splice(idx + 1, 0, from)
                          return { ...prev, teachingVideos: nextArr.map((v, i) => ({ ...v, order: i + 1 })) }
                        })
                      }}
                      className="admin-btn admin-btn--secondary admin-btn--sm disabled:opacity-40"
                    >
                      Down
                    </button>
                  </div>

                  <button
                    type="button"
                    className="admin-btn admin-btn--danger admin-btn--sm"
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Remove video?',
                        message: 'This teaching video slot will be cleared in your draft.',
                        confirmLabel: 'Remove',
                        variant: 'danger',
                      })
                      if (!ok) return
                      updateDraft((prev) => ({
                        ...prev,
                        teachingVideos: prev.teachingVideos.filter((v) => v.id !== item.id),
                      }))
                    }}
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AdminCard>
    </div>
  )
}

