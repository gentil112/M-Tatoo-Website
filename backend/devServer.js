require('dotenv').config({ path: require('node:path').join(__dirname, '.env') })

const app = require('./server')
const connectToDatabase = require('./connectToDatabase')

async function startServer() {
  await connectToDatabase()

  const port = Number(process.env.PORT) || 5000
  app.listen(port, () => {
    console.log(`Booking API listening on port ${port}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start booking API:', error.message)
  process.exitCode = 1
})
