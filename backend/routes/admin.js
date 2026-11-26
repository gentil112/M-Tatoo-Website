const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const mongoose = require('mongoose')
const { timingSafeEqual } = require('node:crypto')
const Account = require('../models/Account')
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
  message: { message: 'Too many setup attempts. Try again in 15 minutes.' },
})

function isValidEmail(email) {
  return typeof email === 'string' &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function createSession(admin, response) {
  const token = jwt.sign(
    { email: admin.email, role: 'admin' },
    process.env.JWT_SECRET,
    {
      audience: 'moise-tattoo-admin',
      expiresIn: '8h',
      issuer: 'moise-tattoo-api',
      subject: String(admin._id),
    },
  )

  response.cookie(cookieName, token, {
    ...sessionCookieOptions(),
    maxAge: sessionDurationMs,
  })
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/admin',
  }
}

router.post('/register', registerLimiter, async (request, response, next) => {
  try {
    if (await Account.exists({ _id: 'primary' })) {
      return response.status(409).json({ message: 'Admin setup is already complete. Sign in instead.' })
    }

    const configuredKey = process.env.ADMIN_SETUP_KEY
    const configuredKeyLength = configuredKey
      ? Buffer.byteLength(configuredKey, 'utf8')
      : 0
    if (configuredKeyLength < 32 || configuredKeyLength > 256) {
      return response.status(503).json({ message: 'First-admin setup is not enabled.' })
    }

    const { email, password, confirmPassword, setupKey } = request.body || {}
    if (
      typeof setupKey !== 'string' ||
      Buffer.byteLength(setupKey, 'utf8') > 256 ||
      Buffer.byteLength(setupKey, 'utf8') !== Buffer.byteLength(configuredKey, 'utf8') ||
      !timingSafeEqual(Buffer.from(setupKey, 'utf8'), Buffer.from(configuredKey, 'utf8'))
    ) {
      return response.status(403).json({ message: 'The admin setup key is invalid.' })
    }

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

    const normalizedEmail = email.trim().toLowerCase()
    if (await Account.exists({ email: normalizedEmail })) {
      return response.status(409).json({
        message: 'This email is already used by an account. Choose another email.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const admin = await Account.create({
      _id: 'primary',
      email: normalizedEmail,
      passwordHash,
      role: 'admin',
    })

    createSession(admin, response)
    response.status(201).json({ email: admin.email })
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({
        message: 'Admin setup is already complete or this email is already in use.',
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

    const admin = await Account.findById('primary').select('+passwordHash')
    const passwordMatches = admin
      ? await bcrypt.compare(password, admin.passwordHash)
      : false
    const emailMatches = admin &&
      email.trim().toLowerCase() === admin.email

    if (!admin || admin.role !== 'admin' || !passwordMatches || !emailMatches) {
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
