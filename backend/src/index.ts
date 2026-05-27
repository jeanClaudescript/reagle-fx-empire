import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 4000)
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
)
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'coachpeter250-backend',
    timestamp: new Date().toISOString(),
  })
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
