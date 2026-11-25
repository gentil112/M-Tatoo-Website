# Moise Tattoo booking API

## Setup

1. Install Node.js 20.19 or newer.
2. From this folder, run `npm install`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` to your MongoDB Atlas connection string. Replace the placeholders with your Atlas database user, password, cluster, and database name.
4. Generate a session secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and set it as `JWT_SECRET` in `.env`.
5. In Atlas, allow network access from the API host and grant the database user access to the selected database.
6. Run `npm run dev` for development or `npm start` for production.

The API listens on port 5000 by default. `POST /api/bookings` stores consultation requests, and `GET /api/health` reports API and database readiness. The unlinked login page is available at `/login`. Before making the site public, open it locally and register the first admin there; registration closes automatically once the account is created. Sign-in redirects to `/admin`, and direct dashboard access redirects unauthenticated visitors to `/login`. The dashboard supports viewing/filtering the latest 100 requests and updating request status. Admin sessions use an eight-hour, HttpOnly cookie and login/registration attempts are rate limited. Set `FRONTEND_URL` to the frontend origin when it is not running on Vite's default local URL.

Admin credentials are stored as a bcrypt hash in MongoDB. Existing `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` entries in `.env` are no longer used and can be removed.

For production, serve the frontend and API on the same origin (or configure a same-origin reverse proxy), use HTTPS, and set `NODE_ENV=production` so the session cookie is marked secure. Never commit `.env` or share the Atlas connection string, password hash, or session secret.
