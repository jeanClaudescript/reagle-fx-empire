import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Certificate } from '@/cms/types'
import { useCms } from '@/cms/CmsProvider'
import { fileToDataUrl } from '@/admin/fileToDataUrl'
import { useAdminConfirm } from '@/admin/confirm'
import { AdminCard } from '@/components/admin/AdminCard'
import { AdminTextInput } from '@/components/admin/AdminInput'
import { AdminMediaThumb } from '@/components/admin/media/AdminMediaThumb'

function normalize(items: Certificate[]) {
  return items
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((it, idx) => ({ ...it, order: idx + 1 }))
}

export function CertificatesEditor() {
  const { draft, updateDraft } = useCms()
  const { confirm } = useAdminConfirm()
  const certificates = useMemo(() => normalize(draft.certificates), [draft.certificates])

  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploadBusy, setUploadBusy] = useState(false)

  const addDisabled = uploadBusy

  return (
    <div className="flex flex-col gap-4">
      <AdminCard>
        <div className="admin-card-body">
          <p className="admin-editor-card-intro">
            Add certificate images and reorder them (shown in a swipeable horizontal carousel).
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-theme-primary">Certificate Title (optional)</label>
              <AdminTextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Risk Management Certificate" />
            </div>

            <div className="sm:col-span-2">
              <label
                className={`cursor-pointer rounded-2xl border border-theme bg-theme-surface/60 px-4 py-3 text-sm font-semibold text-theme-primary ${
                  addDisabled ? 'opacity-60' : ''
                }`}
              >
                {uploadBusy ? 'Uploading…' : 'Upload Certificate Image'}
                <input
                  type="file"
                  accept="image/*"
                  disabled={addDisabled}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploadBusy(true)
                    try {
                      const dataUrl = await fileToDataUrl(file)
                      const next: Certificate = {
                        id: `cert-${Math.random().toString(16).slice(2)}`,
                        imageDataUrl: dataUrl,
                        title: title.trim() ? title.trim() : undefined,
                        order: certificates.length + 1,
                      }
                      updateDraft((prev) => ({
                        ...prev,
                        certificates: normalize([...prev.certificates, next]),
                      }))
                      setTitle('')
                    } finally {
                      setUploadBusy(false)
                      e.target.value = ''
                    }
                  }}
                />
              </label>
            </div>
            <div className="sm:col-span-2 rounded-2xl border border-theme bg-theme-surface/45 p-3">
              <p className="mb-2 text-xs font-semibold text-theme-muted">Or paste image URL</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <AdminTextInput
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={addDisabled}
                  className="w-full"
                />
                <button
                  type="button"
                  disabled={addDisabled || !imageUrl.trim()}
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                  onClick={() => {
                    const next: Certificate = {
                      id: `cert-${Math.random().toString(16).slice(2)}`,
                      imageDataUrl: imageUrl.trim(),
                      title: title.trim() ? title.trim() : undefined,
                      order: certificates.length + 1,
                    }
                    updateDraft((prev) => ({
                      ...prev,
                      certificates: normalize([...prev.certificates, next]),
                    }))
                    setImageUrl('')
                    setTitle('')
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
          <h3 className="font-display text-md font-bold text-theme-primary">Your Certificates</h3>

          {certificates.length === 0 ? (
            <div className="mt-4 text-sm text-theme-muted">No certificates yet.</div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {certificates.map((cert, idx) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="admin-editor-row admin-editor-row--media"
                >
                  <AdminMediaThumb
                    kind="image"
                    src={cert.imageDataUrl}
                    alt={cert.title ?? 'Certificate'}
                    gallery={certificates.map((c) => ({
                      src: c.imageDataUrl,
                      alt: c.title ?? 'Certificate',
                    }))}
                    className="relative mx-auto h-[84px] w-[84px] shrink-0 sm:mx-0"
                  >
                    <img
                      src={cert.imageDataUrl}
                      alt={cert.title ?? 'Certificate'}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </AdminMediaThumb>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-theme-primary">#{idx + 1}</p>
                    <p className="mt-1 break-words text-xs text-theme-muted">{cert.title ?? 'Untitled'}</p>
                  </div>

                  <div className="admin-editor-actions">
                    <div className="flex w-full gap-2 sm:w-auto">
                      <button
                        type="button"
                        disabled={idx === 0}
                        className="admin-btn admin-btn--secondary admin-btn--sm disabled:opacity-40"
                        onClick={() => {
                          updateDraft((prev) => {
                            const arr = normalize(prev.certificates)
                            const item = arr[idx]
                            const next = arr.slice()
                            next.splice(idx, 1)
                            next.splice(idx - 1, 0, item)
                            return { ...prev, certificates: normalize(next) }
                          })
                        }}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        disabled={idx === certificates.length - 1}
                        className="admin-btn admin-btn--secondary admin-btn--sm disabled:opacity-40"
                        onClick={() => {
                          updateDraft((prev) => {
                            const arr = normalize(prev.certificates)
                            const item = arr[idx]
                            const next = arr.slice()
                            next.splice(idx, 1)
                            next.splice(idx + 1, 0, item)
                            return { ...prev, certificates: normalize(next) }
                          })
                        }}
                      >
                        Down
                      </button>
                    </div>

                    <button
                      type="button"
                      className="admin-btn admin-btn--danger admin-btn--sm"
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Delete certificate?',
                          message: 'This certificate will be removed from your draft.',
                          confirmLabel: 'Delete',
                          variant: 'danger',
                        })
                        if (!ok) return
                        updateDraft((prev) => ({
                          ...prev,
                          certificates: normalize(prev.certificates.filter((c) => c.id !== cert.id)),
                        }))
                      }}
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

