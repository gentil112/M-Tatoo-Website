const jwt = require('jsonwebtoken')

const cookieName = 'moise_admin_session'

function requireAdmin(request, response, next) {
  const token = request.cookies[cookieName]

  if (!token) {
    return response.status(401).json({ message: 'Authentication required.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      audience: 'moise-tattoo-admin',
      issuer: 'moise-tattoo-api',
    })

    if (
      payload.role !== 'admin' ||
      payload.sub !== 'primary' ||
      typeof payload.email !== 'string'
    ) {
      return response.status(401).json({ message: 'Authentication required.' })
    }

    request.adminEmail = payload.email
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return response.status(401).json({ message: 'Authentication required.' })
    }

    next(error)
  }
}

module.exports = { cookieName, requireAdmin }
