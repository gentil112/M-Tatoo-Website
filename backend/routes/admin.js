const express = require('express')
const mongoose = require('mongoose')
const Booking = require('../models/Booking')
const { cookieName, requireAdmin } = require('../middleware/requireAdmin')

const router = express.Router()
const bookingStatuses = ['new', 'contacted', 'confirmed', 'cancelled']
const bookingPageSize = 20

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/admin',
  }
}

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
