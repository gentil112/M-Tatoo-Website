# Moise Tattoo booking API

## Setup

1. Install Node.js 20.19 or newer.
2. From this folder, run `npm install`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` to your MongoDB Atlas connection string. Replace the placeholders with your Atlas database user, password, cluster, and database name.
4. Generate a session secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and set it as `JWT_SECRET` in `.env`.
5. In Atlas, allow network access from the API host and grant the database user access to the selected database.
6. Run `npm run dev` for development or `npm start` for production.

The API listens on port 5000 by default. `POST /api/bookings` stores consultation requests, and `GET /api/health` reports API and database readiness. Anyone can register at `/register`; new accounts receive the `user` role. To grant admin access, change that account's `role` to `admin` in the MongoDB `admins` collection. Everyone signs in at `/login`; admins are sent to `/admin`, while user accounts go to `/account`. Only accounts whose database role is `admin` can enter `/admin` or use admin APIs. Login and registration attempts are rate limited. Set `FRONTEND_URL` to the frontend origin when it is not running on Vite's default local URL.

Account passwords are stored as bcrypt hashes in MongoDB. The existing `primary` admin and booking data are preserved. Previously registered non-primary accounts are treated as customer accounts; public registration no longer creates admins.

Vercel loads `server.js` as the exported Express app and connects to MongoDB on request. Local `npm start` and `npm run dev` use `devServer.js` to listen on port 5000.

For production, serve the frontend and API on the same origin (or configure a same-origin reverse proxy), use HTTPS, and set `NODE_ENV=production` so session cookies are marked secure. Never commit `.env` or share the Atlas connection string or session secret.

For Vercel, deploy this repository as one **Services** project so the root `vercel.json` can route `/api/*` to the Express backend and all other paths to the Vite frontend. Keep the project root at the repository root. Set `MONGODB_URI` and `JWT_SECRET` in the project's environment variables. `backend/.env` is local-only. Redeploy after changing environment variables, and use the project's production domain rather than a deployment-specific URL.
