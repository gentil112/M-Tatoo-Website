const mongoose = require('mongoose')

let connectionPromise

async function connectToDatabase() {
  const { MONGODB_URI, JWT_SECRET } = process.env

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is required.')
  }

  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long.')
  }

  if (mongoose.connection.readyState === 1) return
  if (mongoose.connection.readyState !== 2) connectionPromise = null

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(MONGODB_URI).catch((error) => {
      connectionPromise = null
      throw error
    })
  }

  await connectionPromise
}

module.exports = connectToDatabase
