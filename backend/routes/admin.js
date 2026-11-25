const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const mongoose = require('mongoose')
const Admin = require('../models/Admin')
const Booking = require('../models/Booking')
const { cookieName, requireAdmin } = require('../middleware/requireAdmin')

const router = express.Router()
const bookingStatuses = ['new', 'contacted', 'confirmed', 'cancelled']
const bookingPageSize = 20
const sessionDurationMs = 8 * 60 * 60 * 1000
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Try again in 15 minutes.' },
})
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registration attempts. Try again in 15 minutes.' },
})

function isValidEmail(email) {
  return typeof email === 'string' &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function createSession(admin, response) {
  const token = jwt.sign(
    { email: admin.email },
    process.env.JWT_SECRET,
    {
      audience: 'moise-tattoo-admin',
      expiresIn: '8h',
      issuer: 'moise-tattoo-api',
      subject: 'admin',
    },
  )

  response.cookie(cookieName, token, sessionCookieOptions())
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/admin',
    maxAge: sessionDurationMs,
  }
}

router.post('/register', registerLimiter, async (request, response, next) => {
  try {
    const { email, password, confirmPassword } = request.body || {}

    if (
      !isValidEmail(email) ||
      typeof password !== 'string' ||
      typeof confirmPassword !== 'string' ||
      password !== confirmPassword ||
      Buffer.byteLength(password, 'utf8') < 16 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return response.status(400).json({
        message: 'Enter a valid email and matching password of 16 to 72 bytes.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const admin = await Admin.create({
      email: email.trim().toLowerCase(),
      passwordHash,
    })

    createSession(admin, response)
    response.status(201).json({ email: admin.email })
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({
        message: 'Admin registration is closed because an admin already exists.',
      })
    }

    next(error)
  }
})

router.post('/login', loginLimiter, async (request, response, next) => {
  try {
    const { email, password } = request.body || {}

    if (
      !isValidEmail(email) ||
      typeof password !== 'string' ||
      !password ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return response.status(400).json({ message: 'Enter a valid email and password.' })
    }

    const admin = await Admin.findById('primary').select('+passwordHash')
    const passwordMatches = admin
      ? await bcrypt.compare(password, admin.passwordHash)
      : false
    const emailMatches = admin &&
      email.trim().toLowerCase() === admin.email

    if (!admin || !passwordMatches || !emailMatches) {
      return response.status(401).json({ message: 'Email or password is incorrect.' })
    }

    createSession(admin, response)
    response.json({ email: admin.email })
  } catch (error) {
    next(error)
  }
})

router.post('/logout', (_request, response) => {
  response.clearCookie(cookieName, sessionCookieOptions())
  response.status(204).end()
})

router.get('/session', requireAdmin, (request, response) => {
  response.json({ email: request.adminEmail })
})

router.get('/summary', requireAdmin, async (_request, response, next) => {
  try {
    const [total, newRequests, contacted, confirmed, cancelled] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'new' }),
      Booking.countDocuments({ status: 'contacted' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
    ])

    response.json({ total, new: newRequests, contacted, confirmed, cancelled })
  } catch (error) {
    next(error)
  }
})

router.get('/bookings', requireAdmin, async (request, response, next) => {
  try {
    const status = request.query.status
    const search = request.query.q
    const requestedPage = request.query.page === undefined ? '1' : request.query.page

    if (
      status !== undefined &&
      status !== 'all' &&
      (typeof status !== 'string' || !bookingStatuses.includes(status))
    ) {
      return response.status(400).json({ message: 'Choose a valid booking status.' })
    }

    if (search !== undefined && (typeof search !== 'string' || search.length > 120)) {
      return response.status(400).json({ message: 'Search text must be 120 characters or fewer.' })
    }

    if (
      typeof requestedPage !== 'string' ||
      !/^\d+$/.test(requestedPage) ||
      Number(requestedPage) < 1 ||
      Number(requestedPage) > 100000
    ) {
      return response.status(400).json({ message: 'Choose a valid page number.' })
    }

    const page = Number(requestedPage)
    const filter = status && status !== 'all' ? { status } : {}
    const normalizedSearch = search ? search.trim() : ''

    if (normalizedSearch) {
      const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = ['name', 'email', 'style', 'placement', 'idea'].map((field) => ({
        [field]: { $regex: escapedSearch, $options: 'i' },
      }))
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .select('_id name email style placement idea status createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * bookingPageSize)
        .limit(bookingPageSize)
        .lean(),
      Booking.countDocuments(filter),
    ])

    response.json({
      bookings,
      total,
      page,
      pageSize: bookingPageSize,
      pages: Math.ceil(total / bookingPageSize),
    })
  } catch (error) {
    next(error)
  }
})

router.patch('/bookings/:id/status', requireAdmin, async (request, response, next) => {
  try {
    const { status } = request.body || {}

    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ message: 'Invalid booking ID.' })
    }

    if (!bookingStatuses.includes(status)) {
      return response.status(400).json({ message: 'Choose a valid booking status.' })
    }

    const booking = await Booking.findByIdAndUpdate(
      request.params.id,
      { status },
      { new: true, runValidators: true },
    )
      .select('_id name email style placement idea status createdAt')
      .lean()

    if (!booking) {
      return response.status(404).json({ message: 'Booking not found.' })
    }

    response.json({ booking })
  } catch (error) {
    next(error)
  }
})

module.exports = router
