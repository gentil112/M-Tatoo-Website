const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const Account = require('../models/Account')
const { cookieName, requireUser } = require('../middleware/requireUser')

const router = express.Router()
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

function createSession(user, response) {
  const token = jwt.sign(
    { email: user.email, role: 'user' },
    process.env.JWT_SECRET,
    {
      audience: 'moise-tattoo-user',
      expiresIn: '8h',
      issuer: 'moise-tattoo-api',
      subject: String(user._id),
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
    path: '/api/user',
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

    const normalizedEmail = email.trim().toLowerCase()
    const existingAccount = await Account.exists({ email: normalizedEmail })
    if (existingAccount) {
      return response.status(409).json({ message: 'An account with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await Account.create({
      email: normalizedEmail,
      passwordHash,
      role: 'user',
    })

    createSession(user, response)
    response.status(201).json({ email: user.email })
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: 'An account with this email already exists.' })
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

    const user = await Account.findOne({
      email: email.trim().toLowerCase(),
    }).select('+passwordHash')
    const passwordMatches = user && user.role === 'user'
      ? await bcrypt.compare(password, user.passwordHash)
      : false

    if (!user || user.role !== 'user' || !passwordMatches) {
      return response.status(401).json({ message: 'Email or password is incorrect.' })
    }

    createSession(user, response)
    response.json({ email: user.email })
  } catch (error) {
    next(error)
  }
})

router.post('/logout', (_request, response) => {
  response.clearCookie(cookieName, sessionCookieOptions())
  response.status(204).end()
})

router.get('/session', requireUser, (request, response) => {
  response.json({ email: request.userEmail })
})

module.exports = router
