import dotenv from 'dotenv'

dotenv.config()

export const env = {
  port: Number(process.env.PORT || 4000),
  mongodbUri: process.env.MONGODB_URI?.trim() || '',
  frontendOrigins: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  allowVercelPreviewOrigins: (process.env.ALLOW_VERCEL_PREVIEW_ORIGINS || 'true').toLowerCase() === 'true',
  adminApiKey: process.env.ADMIN_API_KEY?.trim() || '',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY?.trim() || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET?.trim() || '',
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER?.trim() || 'reagle-fx',
}
