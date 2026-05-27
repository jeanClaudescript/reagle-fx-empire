import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Upload } from 'lucide-react'
import { fileToDataUrl } from '@/admin/fileToDataUrl'

interface MediaUploaderProps {
  accept?: string
  label?: string
  disabled?: boolean
  onUpload: (dataUrl: string, file: File) => void | Promise<void>
  children?: ReactNode
}

export function MediaUploader({
  accept = 'image/*,video/*',
  label = 'Upload media',
  disabled = false,
  onUpload,
  children,
}: MediaUploaderProps) {
  const [busy, setBusy] = useState(false)

  return (
    <label
      className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-theme-accent/30 bg-theme-surface/50 px-4 py-6 text-center transition hover:border-theme-accent/50 hover:bg-theme-accent/5 ${
        disabled || busy ? 'pointer-events-none opacity-60' : ''
      }`}
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
            const dataUrl = await fileToDataUrl(file)
            await onUpload(dataUrl, file)
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
  )
}
