import dotenv from 'dotenv'

dotenv.config()

function required(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value.trim()
}

export const env = {
  port: Number(process.env.PORT || 4000),
  mongodbUri: required('MONGODB_URI', process.env.MONGODB_URI),
  frontendOrigins: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  adminApiKey: process.env.ADMIN_API_KEY?.trim() || '',
}
