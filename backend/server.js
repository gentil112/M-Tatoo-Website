require('dotenv').config({ path: require('node:path').join(__dirname, '.env') })

const mongoose = require('mongoose')
const app = require('./app')

async function startServer() {
  const { MONGODB_URI, JWT_SECRET } = process.env

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is required. Set it in backend/.env before starting the API.')
  }

  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('Set JWT_SECRET to a random secret at least 32 characters long.')
  }

  await mongoose.connect(MONGODB_URI)

  const port = Number(process.env.PORT) || 5000
  app.listen(port, () => {
    console.log(`Booking API listening on port ${port}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start booking API:', error.message)
  process.exitCode = 1
})
