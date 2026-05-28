import { compressImageToFile, type CompressImageOptions } from '@/admin/compressImage'
import { mediaApi } from '@/services/api'

export async function uploadAdminMedia(file: File, compress?: CompressImageOptions): Promise<string> {
  const prepared = file.type.startsWith('image/')
    ? await compressImageToFile(
        file,
        compress ?? { maxWidth: 1920, maxHeight: 1920, quality: 0.82 },
      )
    : file

  const { url } = await mediaApi.upload(prepared)
  return url
}

export async function uploadCoachImage(file: File, kind: 'profile' | 'background') {
  const isProfile = kind === 'profile'
  return uploadAdminMedia(file, {
    maxWidth: isProfile ? 640 : 1200,
    maxHeight: isProfile ? 640 : 1600,
    quality: isProfile ? 0.85 : 0.8,
    maxBytes: 8 * 1024 * 1024,
  })
}
