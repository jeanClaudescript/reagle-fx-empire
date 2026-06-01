import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { CMSMedia, MediaOrientation, MediaType, ProvenResultsContent } from '@/cms/types'
import { useCms } from '@/cms/CmsProvider'
import { useAdminConfirm } from '@/admin/confirm'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminCard } from '@/components/admin/AdminCard'
import { AdminMediaThumb } from '@/components/admin/media/AdminMediaThumb'
import { AdminSelect, AdminTextInput } from '@/components/admin/AdminInput'
import { uploadWithFeedback } from '@/admin/uploadWithFeedback'
import { useAdminToast } from '@/admin/toast'

function sortByOrder(items: CMSMedia[]) {
  return items.slice().sort((a, b) => a.order - b.order)
}

export function ProvenResultsEditor() {
  const { draft, updateDraft } = useCms()
  const { confirm } = useAdminConfirm()
  const { push } = useAdminToast()
  const content = draft.provenResults as ProvenResultsContent
  const media = useMemo(() => sortByOrder(content.media), [content.media])

  const [type, setType] = useState<MediaType>('placeholder')
  const [orientation, setOrientation] = useState<MediaOrientation>('horizontal')
  const [title, setTitle] = useState('MT5 profits')
  const [mediaUrl, setMediaUrl] = useState('')
  const [externalLink, setExternalLink] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <div className="admin-form-stack">
      <AdminCard>
        <div id="proven-add-form" className="admin-card-body">
          <p className="admin-editor-card-intro">
            Upload image/video cards. If you remove all items, the public Results section can disappear.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="admin-field-label">Type</label>
              <AdminSelect
                value={type}
                onChange={(e) => setType(e.target.value as MediaType)}
                className="w-full"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="placeholder">Placeholder</option>
              </AdminSelect>
            </div>

            <div>
              <label className="admin-field-label">Orientation</label>
              <AdminSelect
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as MediaOrientation)}
                className="w-full"
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </AdminSelect>
            </div>

            <div className="sm:col-span-2">
              <label className="admin-field-label">Title (optional)</label>
              <AdminTextInput value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="sm:col-span-2">
              <label className="admin-field-label">
                Social post link (Share menu)
              </label>
              <AdminTextInput
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://instagram.com/p/... or https://facebook.com/..."
              />
            </div>

            <div className="sm:col-span-2">
              <label
                className={`admin-file-btn ${type === 'placeholder' ? 'opacity-60' : ''}`}
              >
                <input
                  type="file"
                  accept={type === 'video' ? 'video/*' : 'image/*'}
                  disabled={type === 'placeholder' || busy}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setBusy(true)
                    try {
                      const url = type === 'placeholder' ? undefined : await uploadWithFeedback(file, push)
                      if (type !== 'placeholder' && !url) return

                      const next: CMSMedia = {
                        id: `pr-${Math.random().toString(16).slice(2)}`,
                        type,
                        orientation,
                        title: title.trim() ? title.trim() : undefined,
                        mediaDataUrl: url,
                        externalLink: externalLink.trim() ? externalLink.trim() : undefined,
                        order: media.length + 1,
                      }

                      updateDraft((prev) => ({
                        ...prev,
                        provenResults: {
                          ...prev.provenResults,
                          media: sortByOrder([...prev.provenResults.media, next]),
                        },
                      }))
                      setTitle('MT5 profits')
                      setExternalLink('')
                    } finally {
                      setBusy(false)
                    }
                  }}
                />
                {busy
                  ? 'Uploading…'
                  : type === 'placeholder'
                    ? 'Choose Image/Video to upload'
                    : type === 'video'
                      ? 'Upload video file'
                      : 'Upload image file'}
              </label>
            </div>
            <div className="sm:col-span-2 rounded-2xl border border-theme bg-theme-surface/45 p-3">
              <p className="mb-2 text-xs font-semibold text-theme-muted">Media URL (image or video)</p>
              <div className="admin-input-btn-row">
                <AdminTextInput
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={type === 'video' ? 'https://...mp4' : 'https://...jpg'}
                  disabled={type === 'placeholder' || busy}
                  className="w-full"
                />
                <button
                  type="button"
                  disabled={type === 'placeholder' || busy || !mediaUrl.trim()}
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                  onClick={() => {
                    const value = mediaUrl.trim()
                    if (!value) return
                    const next: CMSMedia = {
                      id: `pr-${Math.random().toString(16).slice(2)}`,
                      type,
                      orientation,
                      title: title.trim() ? title.trim() : undefined,
                      mediaDataUrl: value,
                      externalLink: externalLink.trim() ? externalLink.trim() : undefined,
                      order: media.length + 1,
                    }
                    updateDraft((prev) => ({
                      ...prev,
                      provenResults: {
                        ...prev.provenResults,
                        media: sortByOrder([...prev.provenResults.media, next]),
                      },
                    }))
                    setMediaUrl('')
                    setTitle('MT5 profits')
                    setExternalLink('')
                  }}
                >
                  Use URL
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-md font-bold text-theme-primary">Media Items</h3>

          {media.length === 0 ? (
            <AdminEmptyState
              title="No result media yet"
              description="Add MT5 screenshots or win videos for the Results section."
              actionLabel="Add first result"
              scrollToId="proven-add-form"
            />
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {media.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="admin-editor-row admin-editor-row--media"
                >
                  <div className="relative mx-auto h-[90px] w-full max-w-[110px] shrink-0 sm:mx-0 sm:w-[110px]">
                    {item.type === 'image' && item.mediaDataUrl ? (
                      <AdminMediaThumb
                        kind="image"
                        src={item.mediaDataUrl}
                        alt={item.title ?? 'Proven result'}
                        className="h-[90px] w-full"
                      >
                        <img
                          src={item.mediaDataUrl}
                          alt={item.title ?? 'Proven result'}
                          className="h-full w-full object-cover"
                        />
                      </AdminMediaThumb>
                    ) : item.type === 'video' && item.mediaDataUrl ? (
                      <AdminMediaThumb
                        kind="video"
                        src={item.mediaDataUrl}
                        poster={item.posterDataUrl}
                        alt={item.title ?? 'Proven result'}
                        className="h-[90px] w-full"
                      >
                        <video
                          src={item.mediaDataUrl}
                          muted
                          className="h-full w-full object-cover"
                          playsInline
                        />
                      </AdminMediaThumb>
                    ) : (
                      <div className="h-full w-full rounded-2xl border border-theme bg-gradient-to-br from-empire-purple/25 to-empire-blue-electric/10" />
                    )}
                  </div>

                  <div className="min-w-0 flex flex-col gap-2">
                    <p className="break-words text-sm font-semibold text-theme-primary">
                      {item.title ?? `Item ${idx + 1}`}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-theme px-3 py-1 text-[11px] text-theme-muted">
                        {item.type}
                      </span>
                      <span className="rounded-full border border-theme px-3 py-1 text-[11px] text-theme-muted">
                        {item.orientation}
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-theme-muted">Orientation</label>
                        <AdminSelect
                          value={item.orientation}
                          onChange={(e) => {
                            const value = e.target.value as MediaOrientation
                            updateDraft((prev) => ({
                              ...prev,
                              provenResults: {
                                ...prev.provenResults,
                                media: prev.provenResults.media.map((m) =>
                                  m.id === item.id ? { ...m, orientation: value } : m,
                                ),
                              },
                            }))
                          }}
                          className="w-full"
                        >
                          <option value="horizontal">horizontal</option>
                          <option value="vertical">vertical</option>
                        </AdminSelect>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-theme-muted">Title</label>
                        <AdminTextInput
                          value={item.title ?? ''}
                          onChange={(e) => {
                            const value = e.target.value
                            updateDraft((prev) => ({
                              ...prev,
                              provenResults: {
                                ...prev.provenResults,
                                media: prev.provenResults.media.map((m) =>
                                  m.id === item.id ? { ...m, title: value.trim() ? value : undefined } : m,
                                ),
                              },
                            }))
                          }}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-theme-muted">External post link</label>
                      <AdminTextInput
                        value={item.externalLink ?? ''}
                        onChange={(e) => {
                          const value = e.target.value
                          updateDraft((prev) => ({
                            ...prev,
                            provenResults: {
                              ...prev.provenResults,
                              media: prev.provenResults.media.map((m) =>
                                m.id === item.id
                                  ? { ...m, externalLink: value.trim() ? value : undefined }
                                  : m,
                              ),
                            },
                          }))
                        }}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="admin-editor-actions">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          updateDraft((prev) => {
                            const arr = sortByOrder(prev.provenResults.media)
                            const next = arr.slice()
                            const itemFrom = next[idx]
                            next.splice(idx, 1)
                            next.splice(idx - 1, 0, itemFrom)
                            return {
                              ...prev,
                              provenResults: { ...prev.provenResults, media: sortByOrder(next) },
                            }
                          })
                        }}
                        className="admin-btn admin-btn--secondary admin-btn--sm disabled:opacity-40"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        disabled={idx === media.length - 1}
                        onClick={() => {
                          updateDraft((prev) => {
                            const arr = sortByOrder(prev.provenResults.media)
                            const next = arr.slice()
                            const itemFrom = next[idx]
                            next.splice(idx, 1)
                            next.splice(idx + 1, 0, itemFrom)
                            return {
                              ...prev,
                              provenResults: { ...prev.provenResults, media: sortByOrder(next) },
                            }
                          })
                        }}
                        className="admin-btn admin-btn--secondary admin-btn--sm disabled:opacity-40"
                      >
                        Down
                      </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Delete media?',
                          message: 'This proven results item will be removed from your draft.',
                          confirmLabel: 'Delete',
                          variant: 'danger',
                        })
                        if (!ok) return
                        updateDraft((prev) => ({
                          ...prev,
                          provenResults: {
                            ...prev.provenResults,
                            media: prev.provenResults.media.filter((m) => m.id !== item.id),
                          },
                        }))
                      }}
                      className="admin-btn admin-btn--danger admin-btn--sm"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  )
}

