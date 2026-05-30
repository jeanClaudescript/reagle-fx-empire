import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { UpcomingBanner } from '@/cms/types'
import { useCms } from '@/cms/CmsProvider'
import { useAdminConfirm } from '@/admin/confirm'
import { AdminCard } from '@/components/admin/AdminCard'
import { AdminTextInput } from '@/components/admin/AdminInput'
import { uploadWithFeedback } from '@/admin/uploadWithFeedback'
import { useAdminToast } from '@/admin/toast'
import { AdminMediaThumb } from '@/components/admin/media/AdminMediaThumb'

function normalizeByOrder(items: UpcomingBanner[]) {
  return items
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((it, idx) => ({ ...it, order: idx + 1 }))
}

export function UpcomingBannersEditor() {
  const { draft, updateDraft } = useCms()
  const { confirm } = useAdminConfirm()
  const { push } = useAdminToast()
  const banners = useMemo(() => normalizeByOrder(draft.upcomingBanners), [draft.upcomingBanners])

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [ctaLabel, setCtaLabel] = useState('Join WhatsApp')
  const [ctaLink, setCtaLink] = useState('')
  const [externalLink, setExternalLink] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [imageDataUrl, setImageDataUrl] = useState('')

  return (
    <div className="flex flex-col gap-4">
      <AdminCard>
        <div className="admin-card-body">
          <p className="admin-editor-card-intro">
            Hero banner above the chart. Pick date/time for countdown. Use one button link (CTA) and
            optional social post link for Share.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-theme-primary">Title</label>
              <AdminTextInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="June Forex Mentorship Starts June 15"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-theme-primary">
                Event date &amp; time (countdown)
              </label>
              <input
                type="datetime-local"
                value={date.includes('T') ? date.slice(0, 16) : ''}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm text-theme-primary outline-none focus:border-theme-accent/50"
              />
              <p className="mt-1 text-xs text-theme-muted">
                Countdown uses this datetime. Title can show friendly text like &quot;June 15&quot;.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-theme-primary">
                Button link (main CTA)
              </label>
              <AdminTextInput value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="https://wa.me/..." />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-theme-primary">CTA label</label>
              <AdminTextInput value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-theme-primary">
                Social post link (Share / Open post)
              </label>
              <AdminTextInput
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://instagram.com/p/..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-theme-primary">Banner image (optional)</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="inline-flex cursor-pointer items-center rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm font-semibold text-theme-primary">
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const url = await uploadWithFeedback(file, push)
                      if (url) setImageDataUrl(url)
                      e.target.value = ''
                    }}
                  />
                </label>
                <AdminTextInput
                  value={imageDataUrl}
                  onChange={(e) => setImageDataUrl(e.target.value)}
                  placeholder="Or paste image URL"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-theme bg-theme-surface/50 px-4 py-3 text-sm text-theme-primary">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                Enabled
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                if (!title.trim() || !date.trim()) return
                const nextBanner: UpcomingBanner = {
                  id: `banner-${Math.random().toString(16).slice(2)}`,
                  enabled,
                  title: title.trim(),
                  date: date.trim(),
                  imageDataUrl: imageDataUrl.trim() || undefined,
                  ctaLabel: ctaLabel.trim() || 'Join WhatsApp',
                  ctaLink: ctaLink.trim() || 'https://chat.whatsapp.com/IMEUxv246jvFUS2sLrjG8G',
                  externalLink: externalLink.trim() || undefined,
                  order: banners.length + 1,
                }
                updateDraft((prev) => ({
                  ...prev,
                  upcomingBanners: normalizeByOrder([...prev.upcomingBanners, nextBanner]),
                }))
                setTitle('')
                setDate('')
                setImageDataUrl('')
                setExternalLink('')
              }}
              className="h-11 rounded-xl bg-gradient-to-r from-empire-purple to-empire-blue px-5 text-sm font-semibold text-white shadow-glow hover:shadow-glow-blue"
            >
              Add Banner
            </motion.button>

            <p className="text-xs text-theme-muted">
              Tip: toggle off to keep it for later (it will disappear from the public site).
            </p>
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-md font-bold text-theme-primary">Banners</h3>

          {banners.length === 0 ? (
            <div className="mt-4 text-sm text-theme-muted">No banners yet.</div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {banners.map((banner, idx) => (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="admin-editor-row"
                >
                  <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-theme-muted">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-3 rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2">
                          <input
                            type="checkbox"
                            checked={banner.enabled}
                            onChange={(e) => {
                              const enabledNext = e.target.checked
                              updateDraft((prev) => ({
                                ...prev,
                                upcomingBanners: normalizeByOrder(
                                  prev.upcomingBanners.map((b) =>
                                    b.id === banner.id ? { ...b, enabled: enabledNext } : b,
                                  ),
                                ),
                              }))
                            }}
                          />
                          <span className="text-sm font-semibold text-theme-primary">
                            {banner.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-sm font-semibold text-theme-primary">Title</label>
                          <AdminTextInput
                            value={banner.title}
                            onChange={(e) => {
                              const value = e.target.value
                              updateDraft((prev) => ({
                                ...prev,
                                upcomingBanners: normalizeByOrder(
                                  prev.upcomingBanners.map((b) => (b.id === banner.id ? { ...b, title: value } : b)),
                                ),
                              }))
                            }}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-sm font-semibold text-theme-primary">
                            Event date &amp; time (countdown)
                          </label>
                          <input
                            type="datetime-local"
                            value={banner.date.includes('T') ? banner.date.slice(0, 16) : ''}
                            onChange={(e) => {
                              const value = e.target.value
                              updateDraft((prev) => ({
                                ...prev,
                                upcomingBanners: normalizeByOrder(
                                  prev.upcomingBanners.map((b) =>
                                    b.id === banner.id ? { ...b, date: value } : b,
                                  ),
                                ),
                              }))
                            }}
                            className="w-full rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm text-theme-primary outline-none focus:border-theme-accent/50"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-semibold text-theme-primary">
                            Button link (main CTA)
                          </label>
                          <AdminTextInput
                            value={banner.ctaLink}
                            onChange={(e) => {
                              const value = e.target.value
                              updateDraft((prev) => ({
                                ...prev,
                                upcomingBanners: normalizeByOrder(
                                  prev.upcomingBanners.map((b) =>
                                    b.id === banner.id ? { ...b, ctaLink: value } : b,
                                  ),
                                ),
                              }))
                            }}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-semibold text-theme-primary">CTA label</label>
                          <AdminTextInput
                            value={banner.ctaLabel}
                            onChange={(e) => {
                              const value = e.target.value
                              updateDraft((prev) => ({
                                ...prev,
                                upcomingBanners: normalizeByOrder(
                                  prev.upcomingBanners.map((b) =>
                                    b.id === banner.id ? { ...b, ctaLabel: value } : b,
                                  ),
                                ),
                              }))
                            }}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-sm font-semibold text-theme-primary">
                            Social post link (Share / Open post)
                          </label>
                          <AdminTextInput
                            value={banner.externalLink ?? ''}
                            onChange={(e) => {
                              const value = e.target.value
                              updateDraft((prev) => ({
                                ...prev,
                                upcomingBanners: normalizeByOrder(
                                  prev.upcomingBanners.map((b) =>
                                    b.id === banner.id
                                      ? { ...b, externalLink: value.trim() ? value : undefined }
                                      : b,
                                  ),
                                ),
                              }))
                            }}
                            placeholder="https://instagram.com/... or https://facebook.com/..."
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-sm font-semibold text-theme-primary">
                            Banner Image (optional)
                          </label>
                          <div className="space-y-2">
                            {banner.imageDataUrl ? (
                              <div className="max-w-sm overflow-hidden rounded-2xl border border-theme">
                                <AdminMediaThumb
                                  kind="image"
                                  src={banner.imageDataUrl}
                                  alt={banner.title}
                                  className="aspect-[16/6] w-full"
                                >
                                  <img
                                    src={banner.imageDataUrl}
                                    alt={banner.title}
                                    className="h-full w-full object-cover"
                                  />
                                </AdminMediaThumb>
                              </div>
                            ) : null}

                            <label className="inline-flex cursor-pointer items-center rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm font-semibold text-theme-primary">
                              Upload image
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  const url = await uploadWithFeedback(file, push)
                                  if (!url) return
                                  updateDraft((prev) => ({
                                    ...prev,
                                    upcomingBanners: normalizeByOrder(
                                      prev.upcomingBanners.map((b) =>
                                        b.id === banner.id ? { ...b, imageDataUrl: url } : b,
                                      ),
                                    ),
                                  }))
                                  e.target.value = ''
                                }}
                              />
                            </label>

                            <AdminTextInput
                              value={banner.imageDataUrl ?? ''}
                              onChange={(e) => {
                                const value = e.target.value
                                updateDraft((prev) => ({
                                  ...prev,
                                  upcomingBanners: normalizeByOrder(
                                    prev.upcomingBanners.map((b) =>
                                      b.id === banner.id
                                        ? { ...b, imageDataUrl: value.trim() ? value : undefined }
                                        : b,
                                    ),
                                  ),
                                }))
                              }}
                              placeholder="Or paste image URL https://..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="admin-editor-actions lg:max-w-[200px]">
                      <div className="flex w-full gap-2">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            const nextIndex = idx - 1
                            updateDraft((prev) => {
                              const arr = normalizeByOrder(prev.upcomingBanners)
                              const item = arr[idx]
                              const next = arr.slice()
                              next.splice(idx, 1)
                              next.splice(nextIndex, 0, item)
                              return { ...prev, upcomingBanners: normalizeByOrder(next) }
                            })
                          }}
                          className="admin-btn admin-btn--secondary admin-btn--sm disabled:opacity-40"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          disabled={idx === banners.length - 1}
                          onClick={() => {
                            const nextIndex = idx + 1
                            updateDraft((prev) => {
                              const arr = normalizeByOrder(prev.upcomingBanners)
                              const item = arr[idx]
                              const next = arr.slice()
                              next.splice(idx, 1)
                              next.splice(nextIndex, 0, item)
                              return { ...prev, upcomingBanners: normalizeByOrder(next) }
                            })
                          }}
                          className="admin-btn admin-btn--secondary admin-btn--sm disabled:opacity-40"
                        >
                          Down
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete banner?',
                            message: 'This banner will be removed from your draft.',
                            confirmLabel: 'Delete',
                            variant: 'danger',
                          })
                          if (!ok) return
                          updateDraft((prev) => ({
                            ...prev,
                            upcomingBanners: normalizeByOrder(prev.upcomingBanners.filter((b) => b.id !== banner.id)),
                          }))
                        }}
                        className="admin-btn admin-btn--danger admin-btn--sm"
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

