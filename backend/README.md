# Moise Tattoo booking API

## Setup

1. Install Node.js 20.19 or newer.
2. From this folder, run `npm install`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` to your MongoDB Atlas connection string. Replace the placeholders with your Atlas database user, password, cluster, and database name.
4. Generate a session secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and set it as `JWT_SECRET` in `.env`.
5. Generate a separate setup key with the same command and set it as `ADMIN_SETUP_KEY` in `.env`. Keep it secret; remove it after creating the first admin.
6. In Atlas, allow network access from the API host and grant the database user access to the selected database.
7. Run `npm run dev` for development or `npm start` for production.

The API listens on port 5000 by default. `POST /api/bookings` stores consultation requests, and `GET /api/health` reports API and database readiness. Customers register at `/register`, sign in at `/login`, and use `/account` for their basic profile. Customer accounts cannot access booking records or admin APIs. The first admin can be set up at `/admin/register` using `ADMIN_SETUP_KEY`; setup closes after the `primary` admin account is created. Admins sign in at `/admin/login`, and `/admin` is restricted to the primary admin account. Login and registration attempts are rate limited. Set `FRONTEND_URL` to the frontend origin when it is not running on Vite's default local URL.

Account passwords are stored as bcrypt hashes in MongoDB. The existing `primary` admin and booking data are preserved. Previously registered non-primary accounts are treated as customer accounts; public registration no longer creates admins.

Vercel loads `server.js` as the exported Express app and connects to MongoDB on request. Local `npm start` and `npm run dev` use `devServer.js` to listen on port 5000.

For production, serve the frontend and API on the same origin (or configure a same-origin reverse proxy), use HTTPS, and set `NODE_ENV=production` so session cookies are marked secure. Never commit `.env` or share the Atlas connection string or session secret.

For Vercel, deploy this repository as one **Services** project so the root `vercel.json` can route `/api/*` to the Express backend and all other paths to the Vite frontend. Keep the project root at the repository root. Set `MONGODB_URI` and `JWT_SECRET` in the project's environment variables; set `ADMIN_SETUP_KEY` for the deployment where first-admin setup will happen, then remove it after setup. `backend/.env` is local-only. Redeploy after changing environment variables, and use the project's production domain rather than a deployment-specific URL.
