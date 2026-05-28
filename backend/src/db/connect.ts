import mongoose from 'mongoose'
import { env } from '../config/env.js'

let lastConnectionError: string | null = null

export function getLastConnectionError() {
  return lastConnectionError
}

export async function connectDatabase(): Promise<boolean> {
  lastConnectionError = null

  if (!env.mongodbUri) {
    console.warn('MONGODB_URI is missing. Backend started in limited mode (no DB-backed routes).')
    return false
  }

  try {
    mongoose.set('strictQuery', true)
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 12_000,
    })
    console.log('MongoDB connected')
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown connection error'
    lastConnectionError = message
    console.error(
      'MongoDB connection failed. Backend started in limited mode (CMS, payments, students, live unavailable).',
      message,
    )
    return false
  }
}
