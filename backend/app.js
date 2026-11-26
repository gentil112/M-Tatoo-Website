const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const Booking = require('./models/Booking')
const adminRouter = require('./routes/admin')
const userRouter = require('./routes/user')

const app = express()
app.set('trust proxy', 1)
const allowedStyles = new Set([
  'Fine line',
  'Blackwork',
  'Botanical',
  'Custom work',
  'Not sure yet',
])

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '16kb' }))
app.use(cookieParser())

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

app.post('/api/bookings', async (request, response, next) => {
  try {
    const { name, email, style, placement, idea } = request.body || {}

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof idea !== 'string' ||
      !name.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      !idea.trim()
    ) {
      return response.status(400).json({ message: 'Enter a name, valid email, and tattoo idea.' })
    }

    if (style && !allowedStyles.has(style)) {
      return response.status(400).json({ message: 'Choose a valid tattoo style.' })
    }

    if (placement !== undefined && typeof placement !== 'string') {
      return response.status(400).json({ message: 'Placement must be text.' })
    }

    const booking = await Booking.create({
      name,
      email,
      style: style || 'Not sure yet',
      placement: placement || '',
      idea,
    })

    response.status(201).json({
      message: 'Consultation request received.',
      booking: {
        id: booking.id,
        status: booking.status,
        createdAt: booking.createdAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

app.use('/api/admin', adminRouter)
app.use('/api/user', userRouter)

app.use((error, _request, response, _next) => {
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ message: 'The request is too large.' })
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ message: 'Request body must be valid JSON.' })
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return response.status(400).json({ message: 'Please check the booking details and try again.' })
  }

  console.error('Booking API error:', error)
  response.status(500).json({ message: 'Unable to submit your request right now.' })
})

module.exports = app
