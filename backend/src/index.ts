import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { connectDatabase } from './db/connect.js'
import { cmsRoutes } from './routes/cmsRoutes.js'
import { messageRoutes } from './routes/messageRoutes.js'
import { mediaRoutes } from './routes/mediaRoutes.js'
import { configureCloudinary, isCloudinaryConfigured } from './services/cloudinaryService.js'

configureCloudinary()

const app = express()
let dbReady = false

function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true
  if (env.frontendOrigins.includes(origin)) return true
  if (env.allowVercelPreviewOrigins && origin.endsWith('.vercel.app')) return true
  return false
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true)
        return
      }
      callback(null, false)
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '12mb' }))

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'coachpeter250-backend',
    db: dbReady ? 'connected' : 'not_configured',
    media: isCloudinaryConfigured() ? 'cloudinary' : 'not_configured',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/media', mediaRoutes)

app.use('/api/cms', (req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not configured yet' })
  }
  return cmsRoutes(req, res, next)
})
app.use('/api/messages', (req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not configured yet' })
  }
  return messageRoutes(req, res, next)
})

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  },
)

async function start() {
  dbReady = await connectDatabase()
  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`)
  })
}

start().catch((error) => {
  console.error('Failed to start backend:', error)
  process.exit(1)
})
