import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { DailyUpdate, DailyUpdateType } from '@/cms/types'
import { useCms } from '@/cms/CmsProvider'
import { useAdminConfirm } from '@/admin/confirm'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminCard } from '@/components/admin/AdminCard'
import { AdminField } from '@/components/admin/AdminField'
import { AdminSelect, AdminTextArea, AdminTextInput } from '@/components/admin/AdminInput'
import { uploadWithFeedback } from '@/admin/uploadWithFeedback'
import { useAdminToast } from '@/admin/toast'
import { AdminMediaThumb } from '@/components/admin/media/AdminMediaThumb'

function normalize(items: DailyUpdate[]) {
  return items
    .slice()
    .sort((a, b) => {
      const ta = Date.parse(a.createdAt) || 0
      const tb = Date.parse(b.createdAt) || 0
      if (tb !== ta) return tb - ta
      return a.order - b.order
    })
    .map((it, idx) => ({ ...it, order: idx + 1 }))
}

export function DailyUpdatesEditor() {
  const { draft, updateDraft } = useCms()
  const { confirm } = useAdminConfirm()
  const { push } = useAdminToast()
  const updates = useMemo(() => normalize(draft.dailyUpdates ?? []), [draft.dailyUpdates])

  const [type, setType] = useState<DailyUpdateType>('text')
  const [caption, setCaption] = useState('')
  const [mediaDataUrl, setMediaDataUrl] = useState('')
  const [externalLink, setExternalLink] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [busy, setBusy] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <AdminCard
        title="New daily update"
        description="Text, image, or video — shows like stories / WhatsApp status."
      >
        <div id="daily-update-form" className="admin-card-body">
          <div className="admin-form-grid">
            <AdminField label="Post type" htmlFor="daily-update-type">
              <AdminSelect
                id="daily-update-type"
                value={type}
                onChange={(e) => setType(e.target.value as DailyUpdateType)}
                className="w-full"
              >
                <option value="text">Text only</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </AdminSelect>
            </AdminField>

            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-theme bg-theme-surface/50 px-4 py-3 text-sm text-theme-primary">
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                Publish now
              </label>
            </div>

            <div className="sm:col-span-2">
              <AdminField label="Message / caption" htmlFor="daily-update-caption">
                <AdminTextArea
                  id="daily-update-caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  placeholder="EUR/USD daily outlook, gold setup, session reminder..."
                />
              </AdminField>
            </div>

            {type !== 'text' ? (
              <div className="space-y-2 sm:col-span-2">
                <AdminField label="Media">
                  <label className="admin-file-btn">
                    Upload {type}
                    <input
                      type="file"
                      accept={type === 'video' ? 'video/*' : 'image/*'}
                      className="hidden"
                      disabled={busy}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setBusy(true)
                        try {
                          const url = await uploadWithFeedback(file, push)
                          if (url) setMediaDataUrl(url)
                        } finally {
                          setBusy(false)
                          e.target.value = ''
                        }
                      }}
                    />
                  </label>
                </AdminField>
                <AdminTextInput
                  value={mediaDataUrl}
                  onChange={(e) => setMediaDataUrl(e.target.value)}
                  placeholder={type === 'video' ? 'https://...mp4' : 'https://...jpg'}
                />
              </div>
            ) : null}

            <div className="sm:col-span-2">
              <AdminField label="External link (optional)" htmlFor="daily-update-link">
                <AdminTextInput
                  id="daily-update-link"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="Instagram / Facebook / WhatsApp post URL"
                />
              </AdminField>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={busy || (type === 'text' ? !caption.trim() : !mediaDataUrl.trim())}
            onClick={() => {
              const next: DailyUpdate = {
                id: `update-${Math.random().toString(16).slice(2)}`,
                enabled,
                type,
                caption: caption.trim(),
                mediaDataUrl: type === 'text' ? undefined : mediaDataUrl.trim() || undefined,
                externalLink: externalLink.trim() || undefined,
                createdAt: new Date().toISOString(),
                order: updates.length + 1,
              }
              updateDraft((prev) => ({
                ...prev,
                dailyUpdates: normalize([...(prev.dailyUpdates ?? []), next]),
              }))
              setCaption('')
              setMediaDataUrl('')
              setExternalLink('')
              setType('text')
            }}
            className="admin-btn admin-btn--primary mt-4 w-full sm:w-auto"
          >
            Post update
          </motion.button>
        </div>
      </AdminCard>

      <AdminCard title="Live updates" description="Published posts appear on the public site.">
        <div className="admin-card-body">
          {updates.length === 0 ? (
            <AdminEmptyState
              title="No updates yet"
              description="Post your first market news — text, image, or video."
              actionLabel="Create first update"
              scrollToId="daily-update-form"
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {updates.map((item, idx) => (
                <motion.div key={item.id} className="admin-editor-row">
                  <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start">
                    <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-2xl border border-theme">
                      {item.type === 'image' && item.mediaDataUrl ? (
                        <AdminMediaThumb kind="image" src={item.mediaDataUrl} alt={item.caption} className="h-full w-full">
                          <img src={item.mediaDataUrl} alt="" className="h-full w-full object-cover" />
                        </AdminMediaThumb>
                      ) : item.type === 'video' && item.mediaDataUrl ? (
                        <AdminMediaThumb kind="video" src={item.mediaDataUrl} alt={item.caption} className="h-full w-full">
                          <video src={item.mediaDataUrl} muted className="h-full w-full object-cover" playsInline />
                        </AdminMediaThumb>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-empire-purple/30 to-empire-blue/20 p-2 text-center text-[10px] font-semibold text-theme-primary">
                          {item.caption.slice(0, 48)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-theme px-2 py-0.5 text-[10px] uppercase text-theme-muted">
                          {item.type}
                        </span>
                        <span className="text-[10px] text-theme-muted">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                        <label className="ml-auto flex items-center gap-2 text-xs text-theme-primary">
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            onChange={(e) => {
                              const on = e.target.checked
                              updateDraft((prev) => ({
                                ...prev,
                                dailyUpdates: normalize(
                                  (prev.dailyUpdates ?? []).map((u) =>
                                    u.id === item.id ? { ...u, enabled: on } : u,
                                  ),
                                ),
                              }))
                            }}
                          />
                          Live
                        </label>
                      </div>
                      <AdminTextArea
                        value={item.caption}
                        rows={2}
                        onChange={(e) => {
                          const value = e.target.value
                          updateDraft((prev) => ({
                            ...prev,
                            dailyUpdates: normalize(
                              (prev.dailyUpdates ?? []).map((u) =>
                                u.id === item.id ? { ...u, caption: value } : u,
                              ),
                            ),
                          }))
                        }}
                      />
                      <AdminField label="External link">
                        <AdminTextInput
                        value={item.externalLink ?? ''}
                        onChange={(e) => {
                          const value = e.target.value
                          updateDraft((prev) => ({
                            ...prev,
                            dailyUpdates: normalize(
                              (prev.dailyUpdates ?? []).map((u) =>
                                u.id === item.id
                                  ? { ...u, externalLink: value.trim() ? value : undefined }
                                  : u,
                              ),
                            ),
                          }))
                        }}
                        placeholder="Optional external link"
                        />
                      </AdminField>
                    </div>

                    <div className="admin-editor-actions">
                      <button
                        type="button"
                        disabled={idx === 0}
                        className="admin-btn admin-btn--secondary admin-btn--sm disabled:opacity-40"
                        onClick={() => {
                          updateDraft((prev) => {
                            const arr = normalize(prev.dailyUpdates ?? [])
                            const moved = arr[idx]
                            const next = arr.slice()
                            next.splice(idx, 1)
                            next.splice(idx - 1, 0, moved)
                            return { ...prev, dailyUpdates: normalize(next) }
                          })
                        }}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        disabled={idx === updates.length - 1}
                        className="admin-btn admin-btn--secondary admin-btn--sm disabled:opacity-40"
                        onClick={() => {
                          updateDraft((prev) => {
                            const arr = normalize(prev.dailyUpdates ?? [])
                            const moved = arr[idx]
                            const next = arr.slice()
                            next.splice(idx, 1)
                            next.splice(idx + 1, 0, moved)
                            return { ...prev, dailyUpdates: normalize(next) }
                          })
                        }}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger admin-btn--sm"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete update?',
                            message: 'This daily update will be removed from your draft.',
                            confirmLabel: 'Delete',
                            variant: 'danger',
                          })
                          if (!ok) return
                          updateDraft((prev) => ({
                            ...prev,
                            dailyUpdates: normalize((prev.dailyUpdates ?? []).filter((u) => u.id !== item.id)),
                          }))
                        }}
                      >
                        Delete
                      </button>
                    </div>
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
