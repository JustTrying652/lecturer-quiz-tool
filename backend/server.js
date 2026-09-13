import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'

import { connectDB } from './db.js'
import authRoutes from './routes/auth.js'
import questionSetRoutes from './routes/questionsets.js'

dotenv.config()

const app = express()
app.use(cors({ origin: 'http://127.0.0.1:5173' }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/question-sets', questionSetRoutes)


const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: 'http://127.0.0.1:5173' },
})

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 4000

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`)
  })
})