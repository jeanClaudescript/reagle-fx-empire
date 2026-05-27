import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { connectDatabase } from './db/connect.js'
import { cmsRoutes } from './routes/cmsRoutes.js'
import { messageRoutes } from './routes/messageRoutes.js'

const app = express()

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.frontendOrigins.includes(origin)) {
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
    db: 'mongodb',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/cms', cmsRoutes)
app.use('/api/messages', messageRoutes)

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
  await connectDatabase()
  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`)
  })
}

start().catch((error) => {
  console.error('Failed to start backend:', error)
  process.exit(1)
})
