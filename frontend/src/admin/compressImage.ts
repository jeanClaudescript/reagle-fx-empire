import { fileToDataUrl } from '@/admin/fileToDataUrl'

export type CompressImageOptions = {
  maxWidth: number
  maxHeight: number
  quality?: number
  maxBytes?: number
}

const DEFAULT_MAX_BYTES = 8 * 1024 * 1024

export async function compressImageToFile(
  file: File,
  { maxWidth, maxHeight, quality = 0.82, maxBytes = DEFAULT_MAX_BYTES }: CompressImageOptions,
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file
  }

  if (file.size > maxBytes) {
    throw new Error('IMAGE_TOO_LARGE')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close?.()
    throw new Error('CANVAS_UNAVAILABLE')
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  })
  if (!blob) throw new Error('COMPRESS_FAILED')

  const name = file.name.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
}

/** Legacy helper — returns data URL (local fallback only). */
export async function compressImageFile(
  file: File,
  options: CompressImageOptions,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return fileToDataUrl(file)
  }
  const compressed = await compressImageToFile(file, options)
  return fileToDataUrl(compressed)
}
