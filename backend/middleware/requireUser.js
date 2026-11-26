const jwt = require('jsonwebtoken')

const cookieName = 'moise_user_session'

function requireUser(request, response, next) {
  const token = request.cookies[cookieName]

  if (!token) {
    return response.status(401).json({ message: 'Authentication required.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      audience: 'moise-tattoo-user',
      issuer: 'moise-tattoo-api',
    })

    if (
      payload.role !== 'user' ||
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      return response.status(401).json({ message: 'Authentication required.' })
    }

    request.userId = payload.sub
    request.userEmail = payload.email
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return response.status(401).json({ message: 'Authentication required.' })
    }

    next(error)
  }
}

module.exports = { cookieName, requireUser }
