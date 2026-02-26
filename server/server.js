import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

import eobsRouter from './routes/eobs.js'
import stripeRouter, { handleWebhook } from './routes/stripe.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3000

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }))

// Stripe webhook needs raw body for signature verification - must be before express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleWebhook)
app.use(express.json())

// API routes
app.use('/api/eobs', eobsRouter)
app.use('/api/stripe', stripeRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve React build in production
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
  if (!process.env.DATABASE_URL) {
    console.warn('Warning: DATABASE_URL not set. Database features will fail.')
  }
})
