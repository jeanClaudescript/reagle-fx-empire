import { useState } from 'react'
import { motion } from 'framer-motion'
import { AdminCard } from '@/components/admin/AdminCard'
import { AdminTextArea, AdminTextInput } from '@/components/admin/AdminInput'
import { useCms } from '@/cms/CmsProvider'
import { useCmsValidation } from '@/admin/CmsValidationContext'
import { AdminMediaThumb } from '@/components/admin/media/AdminMediaThumb'
import { useAdminToast } from '@/admin/toast'
import { CmsStorageError } from '@/cms/storage'
import { uploadCoachImage } from '@/admin/uploadAdminMedia'

export function AboutEditor() {
  const { draft, updateDraft } = useCms()
  const { hasFieldError } = useCmsValidation()
  const { push } = useAdminToast()
  const [busy, setBusy] = useState(false)
  const [bgBusy, setBgBusy] = useState(false)
  const [coachImageUrl, setCoachImageUrl] = useState('')
  const [backgroundUrl, setBackgroundUrl] = useState('')

  const coach = draft.about

  const handleUpload = async (
    file: File,
    field: 'coachImageDataUrl' | 'coachBackgroundDataUrl',
    setLoading: (v: boolean) => void,
  ) => {
    setLoading(true)
    try {
      const url = await uploadCoachImage(file, field === 'coachImageDataUrl' ? 'profile' : 'background')
      updateDraft((prev) => ({
        ...prev,
        about: { ...prev.about, [field]: url },
      }))
      push(field === 'coachImageDataUrl' ? 'Coach photo updated.' : 'Card background updated.', 'success')
    } catch (err) {
      if (err instanceof Error && err.message === 'IMAGE_TOO_LARGE') {
        push('Image is too large. Please use a file under 8MB.', 'error')
      } else if (err instanceof CmsStorageError) {
        push(err.message, 'error')
      } else {
        push('Upload failed. Try a smaller JPG or PNG.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-form-stack">
      <AdminCard>
        <div className="admin-card-body">
          <p className="admin-editor-card-intro">
            Upload images to Cloudinary (synced across devices). JPG/PNG recommended.
          </p>

          <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
            <div>
              <p className="admin-field-label">Coach Image</p>
              <div className="flex flex-col items-start gap-3 rounded-3xl border border-theme bg-theme-surface/50 p-4">
                <div className="relative h-28 w-28">
                  {coach.coachImageDataUrl ? (
                    <AdminMediaThumb
                      kind="image"
                      src={coach.coachImageDataUrl}
                      alt="Coach"
                      className="h-28 w-28 rounded-full"
                    >
                      <img
                        src={coach.coachImageDataUrl}
                        alt="Coach"
                        className="h-full w-full rounded-full object-cover"
                        loading="lazy"
                      />
                    </AdminMediaThumb>
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-theme bg-theme-elevated/60">
                      <span className="font-display text-3xl font-bold text-theme-accent">CP</span>
                    </div>
                  )}
                </div>

                <label className="cursor-pointer rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm font-semibold text-theme-primary">
                  {busy ? 'Uploading…' : 'Upload'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={busy || bgBusy}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (!file) return
                      await handleUpload(file, 'coachImageDataUrl', setBusy)
                    }}
                  />
                </label>
                <div className="w-full space-y-2">
                  <p className="text-xs font-semibold text-theme-muted">Or paste image URL</p>
                  <div className="admin-input-btn-row">
                    <AdminTextInput
                      type="url"
                      value={coachImageUrl}
                      onChange={(e) => setCoachImageUrl(e.target.value)}
                      placeholder="https://..."
                      disabled={busy || bgBusy}
                      className="w-full"
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary admin-btn--sm"
                      disabled={busy || bgBusy || !coachImageUrl.trim()}
                      onClick={() => {
                        const value = coachImageUrl.trim()
                        if (!value) return
                        updateDraft((prev) => ({
                          ...prev,
                          about: { ...prev.about, coachImageDataUrl: value },
                        }))
                        setCoachImageUrl('')
                        push('Coach photo URL set.', 'success')
                      }}
                    >
                      Use URL
                    </button>
                  </div>
                </div>
              </div>

              <p className="mb-2 mt-4 text-sm font-semibold text-theme-primary">
                Coach Card Background (optional)
              </p>
              <div className="flex flex-col items-start gap-3 rounded-3xl border border-theme bg-theme-surface/50 p-4">
                <div className="relative h-24 w-full">
                  {coach.coachBackgroundDataUrl ? (
                    <AdminMediaThumb
                      kind="image"
                      src={coach.coachBackgroundDataUrl}
                      alt="Coach card background"
                      className="h-24 w-full"
                    >
                      <img
                        src={coach.coachBackgroundDataUrl}
                        alt="Coach card background"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </AdminMediaThumb>
                  ) : (
                    <div className="h-24 w-full rounded-2xl border border-theme bg-gradient-to-br from-empire-purple/30 via-empire-navy to-empire-blue/20" />
                  )}
                </div>

                <label className="cursor-pointer rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2 text-sm font-semibold text-theme-primary">
                  {bgBusy ? 'Uploading…' : 'Upload Background'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={busy || bgBusy}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (!file) return
                      await handleUpload(file, 'coachBackgroundDataUrl', setBgBusy)
                    }}
                  />
                </label>
                <div className="w-full space-y-2">
                  <p className="text-xs font-semibold text-theme-muted">Or paste background image URL</p>
                  <div className="admin-input-btn-row">
                    <AdminTextInput
                      type="url"
                      value={backgroundUrl}
                      onChange={(e) => setBackgroundUrl(e.target.value)}
                      placeholder="https://..."
                      disabled={busy || bgBusy}
                      className="w-full"
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary admin-btn--sm"
                      disabled={busy || bgBusy || !backgroundUrl.trim()}
                      onClick={() => {
                        const value = backgroundUrl.trim()
                        if (!value) return
                        updateDraft((prev) => ({
                          ...prev,
                          about: { ...prev.about, coachBackgroundDataUrl: value },
                        }))
                        setBackgroundUrl('')
                        push('Background URL set.', 'success')
                      }}
                    >
                      Use URL
                    </button>
                  </div>
                </div>

                {coach.coachBackgroundDataUrl && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-400"
                    onClick={() =>
                      updateDraft((prev) => ({
                        ...prev,
                        about: { ...prev.about, coachBackgroundDataUrl: undefined },
                      }))
                    }
                  >
                    Remove background
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="admin-field-label">Title</label>
                <AdminTextInput
                  value={coach.title}
                  hasError={hasFieldError('about.title')}
                  onChange={(e) =>
                    updateDraft((prev) => ({ ...prev, about: { ...prev.about, title: e.target.value } }))
                  }
                />
              </div>

              <div>
                <label className="admin-field-label">Short Bio</label>
                <AdminTextArea
                  value={coach.bio}
                  hasError={hasFieldError('about.bio')}
                  onChange={(e) =>
                    updateDraft((prev) => ({ ...prev, about: { ...prev.about, bio: e.target.value } }))
                  }
                />
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-theme bg-theme-surface/60 p-4"
              >
                <p className="text-sm font-semibold text-theme-primary">Preview tip</p>
                <p className="mt-1 text-sm text-theme-muted">
                  Open Live preview after upload. Large photos are compressed automatically so the page
                  stays responsive.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </AdminCard>
    </div>
  )
}
