import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Upload } from 'lucide-react'
import { useAdminToast } from '@/admin/toast'
import { uploadWithFeedback } from '@/admin/uploadWithFeedback'

interface MediaUploaderProps {
  accept?: string
  label?: string
  disabled?: boolean
  onUpload: (mediaUrl: string, file: File) => void | Promise<void>
  onUrlSubmit?: (url: string) => void | Promise<void>
  urlLabel?: string
  children?: ReactNode
}

export function MediaUploader({
  accept = 'image/*,video/*',
  label = 'Upload media',
  disabled = false,
  onUpload,
  onUrlSubmit,
  urlLabel = 'Or paste image/video URL',
  children,
}: MediaUploaderProps) {
  const { push } = useAdminToast()
  const [busy, setBusy] = useState(false)
  const [urlValue, setUrlValue] = useState('')

  const canSubmitUrl = !disabled && !busy && Boolean(urlValue.trim())

  return (
    <div className="space-y-3">
      <label
        className={`admin-file-dropzone relative ${disabled || busy ? 'pointer-events-none opacity-60' : ''}`}
      >
        {busy ? (
          <div className="flex w-full flex-col gap-2">
            <div className="cms-shimmer h-3 w-3/4 rounded-full" />
            <div className="cms-shimmer h-3 w-1/2 rounded-full" />
            <div className="cms-shimmer mt-2 h-24 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <Upload className="h-6 w-6 text-theme-accent" />
            <span className="text-sm font-semibold text-theme-primary">{label}</span>
            {children}
          </>
        )}
        <input
          type="file"
          accept={accept}
          disabled={disabled || busy}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setBusy(true)
            try {
              const mediaUrl = await uploadWithFeedback(file, push)
              if (mediaUrl) await onUpload(mediaUrl, file)
            } finally {
              setBusy(false)
              e.target.value = ''
            }
          }}
        />
        {busy && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-theme-muted"
          >
            Processing…
          </motion.span>
        )}
      </label>

      {onUrlSubmit && (
        <div className="rounded-2xl border border-theme bg-theme-surface/45 p-3">
          <p className="mb-2 text-xs font-semibold text-theme-muted">{urlLabel}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://..."
              disabled={disabled || busy}
              className="min-h-10 w-full rounded-xl border border-theme bg-theme-elevated/70 px-3 text-sm text-theme-primary outline-none ring-theme-accent/40 transition focus:ring-2"
            />
            <button
              type="button"
              disabled={!canSubmitUrl}
              className="admin-btn admin-btn--secondary admin-btn--sm"
              onClick={async () => {
                const value = urlValue.trim()
                if (!value) return
                try {
                  await onUrlSubmit(value)
                  setUrlValue('')
                } catch (err) {
                  push(err instanceof Error ? err.message : 'Could not use URL', 'error')
                }
              }}
            >
              Use URL
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
