import mongoose from 'mongoose'
import { env } from '../config/env.js'

export async function connectDatabase(): Promise<boolean> {
  if (!env.mongodbUri) {
    console.warn('MONGODB_URI is missing. Backend started in limited mode (no DB-backed routes).')
    return false
  }
  mongoose.set('strictQuery', true)
  await mongoose.connect(env.mongodbUri)
  console.log('MongoDB connected')
  return true
}
