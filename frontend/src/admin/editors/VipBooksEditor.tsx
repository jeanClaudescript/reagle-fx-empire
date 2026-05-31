import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { VipBook } from '@/cms/types'
import { useCms } from '@/cms/CmsProvider'
import { uploadWithFeedback } from '@/admin/uploadWithFeedback'
import { useAdminToast } from '@/admin/toast'
import { useAdminConfirm } from '@/admin/confirm'
import { AdminCard } from '@/components/admin/AdminCard'
import { AdminTextInput } from '@/components/admin/AdminInput'
import { AdminMediaThumb } from '@/components/admin/media/AdminMediaThumb'

function normalize(items: VipBook[]) {
  return items
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((it, idx) => ({ ...it, order: idx + 1 }))
}

export function VipBooksEditor() {
  const { draft, updateDraft } = useCms()
  const { confirm } = useAdminConfirm()
  const { push } = useAdminToast()
  const books = useMemo(() => normalize(draft.vipBooks ?? []), [draft.vipBooks])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [uploadBusy, setUploadBusy] = useState(false)

  const addDisabled = uploadBusy || !fileUrl.trim() || !title.trim()

  const addBook = () => {
    if (addDisabled) return
    const next: VipBook = {
      id: `book-${Math.random().toString(16).slice(2)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
      fileUrl: fileUrl.trim(),
      fileName: fileName.trim() || undefined,
      enabled: true,
      order: books.length + 1,
      createdAt: new Date().toISOString(),
    }
    updateDraft((prev) => ({
      ...prev,
      vipBooks: normalize([...(prev.vipBooks ?? []), next]),
    }))
    setTitle('')
    setDescription('')
    setCoverUrl('')
    setFileUrl('')
    setFileName('')
  }

  return (
    <div className="admin-form-stack">
      <AdminCard>
        <div className="admin-card-body">
          <p className="admin-editor-card-intro">
            Upload PDF books and guides for paid VIP members. Files are stored on Cloudinary — not in CMS JSON.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="admin-field-label">Title</label>
              <AdminTextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Risk Management Playbook" />
            </div>

            <div className="sm:col-span-2">
              <label className="admin-field-label">Description (optional)</label>
              <AdminTextInput
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary for students"
              />
            </div>

            <div>
              <label
                className={`cursor-pointer rounded-2xl border border-theme bg-theme-surface/60 px-4 py-3 text-sm font-semibold text-theme-primary ${
                  uploadBusy ? 'opacity-60' : ''
                }`}
              >
                {uploadBusy ? 'Uploading…' : 'Upload cover image'}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadBusy}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploadBusy(true)
                    try {
                      const url = await uploadWithFeedback(file, push)
                      if (url) setCoverUrl(url)
                    } finally {
                      setUploadBusy(false)
                      e.target.value = ''
                    }
                  }}
                />
              </label>
            </div>

            <div>
              <label
                className={`cursor-pointer rounded-2xl border border-theme bg-theme-surface/60 px-4 py-3 text-sm font-semibold text-theme-primary ${
                  uploadBusy ? 'opacity-60' : ''
                }`}
              >
                {uploadBusy ? 'Uploading…' : 'Upload PDF book'}
                <input
                  type="file"
                  accept="application/pdf"
                  disabled={uploadBusy}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploadBusy(true)
                    try {
                      const url = await uploadWithFeedback(file, push)
                      if (!url) return
                      setFileUrl(url)
                      setFileName(file.name)
                      if (!title.trim()) setTitle(file.name.replace(/\.pdf$/i, ''))
                    } finally {
                      setUploadBusy(false)
                      e.target.value = ''
                    }
                  }}
                />
              </label>
            </div>

            {coverUrl ? (
              <div className="sm:col-span-2">
                <AdminMediaThumb kind="image" src={coverUrl} alt="Cover preview" className="h-32 w-24 rounded-xl object-cover" />
              </div>
            ) : null}

            {fileUrl ? (
              <p className="sm:col-span-2 text-xs text-emerald-400">
                PDF ready{fileName ? `: ${fileName}` : ''}
              </p>
            ) : null}

            <div className="sm:col-span-2">
              <button type="button" disabled={addDisabled} className="admin-btn admin-btn--primary" onClick={addBook}>
                Add book to library
              </button>
            </div>
          </div>
        </div>
      </AdminCard>

      {books.map((book) => (
        <motion.div key={book.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AdminCard>
            <div className="admin-card-body flex flex-col gap-3 sm:flex-row sm:items-start">
              {book.coverUrl ? (
                <AdminMediaThumb kind="image" src={book.coverUrl} alt={book.title} className="h-28 w-20 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-xl border border-theme bg-theme-surface/50 text-xs text-theme-muted">
                  PDF
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <AdminTextInput
                    value={book.title}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        vipBooks: normalize(
                          (prev.vipBooks ?? []).map((b) => (b.id === book.id ? { ...b, title: e.target.value } : b)),
                        ),
                      }))
                    }
                    className="font-semibold"
                  />
                  <label className="flex items-center gap-2 text-sm text-theme-muted">
                    <input
                      type="checkbox"
                      checked={book.enabled}
                      onChange={(e) =>
                        updateDraft((prev) => ({
                          ...prev,
                          vipBooks: (prev.vipBooks ?? []).map((b) =>
                            b.id === book.id ? { ...b, enabled: e.target.checked } : b,
                          ),
                        }))
                      }
                    />
                    Visible to VIP
                  </label>
                </div>
                {book.description ? <p className="mt-1 text-sm text-theme-muted">{book.description}</p> : null}
                <p className="mt-2 truncate text-xs text-theme-muted">{book.fileName || book.fileUrl}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary admin-btn--sm"
                    disabled={book.order <= 1}
                    onClick={() =>
                      updateDraft((prev) => {
                        const arr = normalize(prev.vipBooks ?? [])
                        const idx = arr.findIndex((b) => b.id === book.id)
                        if (idx <= 0) return prev
                        const nextArr = [...arr]
                        ;[nextArr[idx - 1], nextArr[idx]] = [nextArr[idx], nextArr[idx - 1]]
                        return { ...prev, vipBooks: normalize(nextArr) }
                      })
                    }
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary admin-btn--sm"
                    disabled={book.order >= books.length}
                    onClick={() =>
                      updateDraft((prev) => {
                        const arr = normalize(prev.vipBooks ?? [])
                        const idx = arr.findIndex((b) => b.id === book.id)
                        if (idx < 0 || idx >= arr.length - 1) return prev
                        const nextArr = [...arr]
                        ;[nextArr[idx], nextArr[idx + 1]] = [nextArr[idx + 1], nextArr[idx]]
                        return { ...prev, vipBooks: normalize(nextArr) }
                      })
                    }
                  >
                    Move down
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger admin-btn--sm"
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Remove book?',
                        message: `"${book.title}" will be removed from the VIP library.`,
                        confirmLabel: 'Remove',
                        variant: 'danger',
                      })
                      if (!ok) return
                      updateDraft((prev) => ({
                        ...prev,
                        vipBooks: normalize((prev.vipBooks ?? []).filter((b) => b.id !== book.id)),
                      }))
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </AdminCard>
        </motion.div>
      ))}
    </div>
  )
}
