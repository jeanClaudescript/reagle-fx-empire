import { fileToDataUrl } from '@/admin/fileToDataUrl'

export type CompressImageOptions = {
  maxWidth: number
  maxHeight: number
  quality?: number
  maxBytes?: number
}

const DEFAULT_MAX_BYTES = 8 * 1024 * 1024

export async function compressImageFile(
  file: File,
  { maxWidth, maxHeight, quality = 0.82, maxBytes = DEFAULT_MAX_BYTES }: CompressImageOptions,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return fileToDataUrl(file)
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

  return canvas.toDataURL('image/jpeg', quality)
}
