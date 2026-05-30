import cors from 'cors'
import express from 'express'
import { createServer } from 'http'
import { env } from './config/env.js'
import { connectDatabase, getLastConnectionError } from './db/connect.js'
import { cmsRoutes } from './routes/cmsRoutes.js'
import { messageRoutes } from './routes/messageRoutes.js'
import { mediaRoutes } from './routes/mediaRoutes.js'
import { paymentRoutes } from './routes/paymentRoutes.js'
import { studentRoutes } from './routes/studentRoutes.js'
import { authRoutes } from './routes/authRoutes.js'
import { liveRoutes } from './routes/liveRoutes.js'
import { classroomRoutes } from './routes/classroomRoutes.js'
import { deskChatRoutes } from './routes/deskChatRoutes.js'
import { marketRoutes } from './routes/marketRoutes.js'
import { initClassroomSocket } from './socket/classroomSocket.js'
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
  const dbError = getLastConnectionError()
  res.status(200).json({
    ok: true,
    service: 'coachpeter250-backend',
    db: dbReady ? 'connected' : dbError ? 'connection_failed' : 'not_configured',
    dbError: dbError ?? undefined,
    media: isCloudinaryConfigured() ? 'cloudinary' : 'not_configured',
    auth: 'role-based',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/media', mediaRoutes)
app.use('/api/market', marketRoutes)

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
app.use('/api/payments', (req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not configured yet' })
  }
  return paymentRoutes(req, res, next)
})
app.use('/api/students', (req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not configured yet' })
  }
  return studentRoutes(req, res, next)
})
app.use('/api/auth', (req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not configured yet' })
  }
  return authRoutes(req, res, next)
})
app.use('/api/live', (req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not configured yet' })
  }
  return liveRoutes(req, res, next)
})
app.use('/api/classroom', (req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not configured yet' })
  }
  return classroomRoutes(req, res, next)
})
app.use('/api/desk-chat', (req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not configured yet' })
  }
  return deskChatRoutes(req, res, next)
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
    const isBadRequest =
      err instanceof Error &&
      /^(Invalid |Phone |Email |Payment not found|Only pending|Transaction ID|Amount must|Custom amounts|Payments are temporarily|Merchant phone|Default amount|Referral reward|USSD template|already registered|is required|No matching|Student not found|status must be)/.test(
        err.message,
      )
    res.status(isBadRequest ? 400 : 500).json({ error: message })
  },
)

async function start() {
  dbReady = await connectDatabase()
  const httpServer = createServer(app)
  initClassroomSocket(httpServer)
  httpServer.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`)
    console.log(`Socket.IO classroom on ws://localhost:${env.port}/socket.io`)
  })
}

start().catch((error) => {
  console.error('Failed to start backend:', error)
  process.exit(1)
})
