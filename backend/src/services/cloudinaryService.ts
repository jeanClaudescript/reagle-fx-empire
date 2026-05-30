import { v2 as cloudinary } from 'cloudinary'
import { env } from '../config/env.js'

export function isCloudinaryConfigured() {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret)
}

export function configureCloudinary() {
  if (!isCloudinaryConfigured()) return
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  })
}

export async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  resourceType: 'image' | 'video' | 'raw',
) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured on the server')
  }

  const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: env.cloudinaryFolder,
    resource_type: resourceType,
    overwrite: false,
  })

  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
  }
}
