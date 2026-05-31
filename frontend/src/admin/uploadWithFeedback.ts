import type { CompressImageOptions } from '@/admin/compressImage'
import { uploadAdminMedia } from '@/admin/uploadAdminMedia'

export type UploadToast = (message: string, kind: 'success' | 'error' | 'info') => void

function friendlyUploadError(err: unknown): string {
  const msg = err instanceof Error ? err.message : 'Upload failed'
  if (/401|unauthorized/i.test(msg)) {
    return 'Upload blocked — sign in again at /login?tab=admin (session expired).'
  }
  if (/503|cloudinary/i.test(msg)) {
    return 'Media server not configured on backend (Cloudinary env vars).'
  }
  if (/IMAGE_TOO_LARGE/i.test(msg)) {
    return 'Image too large — use a file under 8MB or compress it first.'
  }
  return msg
}

export async function uploadWithFeedback(
  file: File,
  push: UploadToast,
  compress?: CompressImageOptions,
): Promise<string | null> {
  try {
    push('Uploading…', 'info')
    const url = await uploadAdminMedia(file, compress)
    push('Upload complete', 'success')
    return url
  } catch (err) {
    push(friendlyUploadError(err), 'error')
    return null
  }
}
