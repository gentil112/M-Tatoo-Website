const express = require('express')
const app = require('./app')
const connectToDatabase = require('./connectToDatabase')

const api = express()

api.use(async (_request, response, next) => {
  try {
    await connectToDatabase()
    next()
  } catch (error) {
    console.error('Failed to initialize booking API:', error.message)
    response.status(500).json({ message: 'Booking API is unavailable.' })
  }
})

api.use(app)

module.exports = api
