# 🚗 GoTogether — Backend API

Production-grade REST + real-time backend for **GoTogether**, a smart carpooling platform, built with **Node.js, Express, MongoDB (Mongoose), and Socket.io**.

This implements Phase 2–6 of the project roadmap: Authentication & Security, Ride Management, Booking System, Ratings & Reviews, Notifications, Real-Time Chat, and an Admin Panel API.

---

## ✨ Features

- **Authentication**: Register → Email OTP verification → JWT (access + rotating refresh token in httpOnly cookie) → Forgot/Reset password
- **Security**: Helmet, CORS (credentialed), rate limiting (global + strict auth/OTP limiters), NoSQL-injection sanitization, HTTP parameter pollution protection, bcrypt password hashing (cost 12), body-size limits
- **Rides**: Create rides, geo-based smart route search (`$geoWithin`/`$centerSphere`), live location broadcast, status lifecycle (scheduled → ongoing → completed/cancelled)
- **Bookings**: Instant or approval-based booking, **MongoDB transactions** to prevent seat overbooking under concurrent requests, cancellation with seat release
- **Ratings**: Post-ride mutual ratings with participation verification and running average recalculation
- **Notifications**: Persisted, paginated, read/unread tracking
- **Real-time Chat**: Socket.io with JWT-authenticated handshake, ride-scoped rooms, typing indicators
- **Admin Panel API**: Dashboard stats, user search/ban/unban, ride oversight
- **Production hygiene**: centralized error handling, structured Winston logging, graceful shutdown, DB reconnect/retry logic, environment validation at boot (fails fast if secrets are missing)

---

## 🗂 Project Structure

```
src/
  config/        # env, db, logger, cloudinary
  models/        # Mongoose schemas (User, Vehicle, Ride, Booking, Message, Rating, Notification)
  controllers/   # business logic per domain
  routes/        # Express routers
  middleware/    # auth, error handling, validation, rate limiting, upload
  validators/    # express-validator rule chains
  services/      # email (nodemailer), upload (cloudinary), stateless helpers
  sockets/       # Socket.io auth + event handlers
  utils/         # ApiError, ApiResponse, token, otp, asyncHandler
  app.js         # Express app assembly
  server.js      # HTTP + Socket.io bootstrap, graceful shutdown
```

## 🚀 Getting Started

```bash
npm install
cp .env.example .env   # fill in your real secrets
npm run dev             # nodemon, local development
npm start                # production
```

**Requirements**: Node.js ≥ 18, a MongoDB deployment that supports **transactions** (any MongoDB Atlas cluster, or a local replica set — a standalone `mongod` will NOT work because booking creation/approval uses multi-document transactions to prevent overbooking).

## 🔑 Environment Variables

See `.env.example` for the full list: MongoDB URI, JWT secrets, SMTP credentials for OTP emails, Cloudinary keys for avatar/vehicle-document uploads, and rate-limit tuning.

Never commit `.env`. In production, use your host's secret manager (Render/Vercel/Fly/Railway env vars, AWS Secrets Manager, etc.).

## 📡 API Overview

Base URL: `/api/v1`

| Domain | Base path | Notes |
|---|---|---|
| Auth | `/auth` | register, verify-otp, resend-otp, login, refresh, logout, forgot/reset-password |
| Users | `/users` | profile, avatar upload, change password, delete account, vehicle CRUD |
| Rides | `/rides` | create, geo search, status updates, live location |
| Bookings | `/bookings` | create, approve/reject, cancel, list mine/for-ride |
| Ratings | `/ratings` | submit + fetch per user |
| Notifications | `/notifications` | list, mark read |
| Chat | `/chat/:rideId/messages` | REST history; live send via Socket.io |
| Admin | `/admin` | dashboard, user ban/unban, ride oversight (role: admin) |

Full request/response contracts are documented inline in each controller as `// @route METHOD /path` comments.

### Auth flow
1. `POST /auth/register` → creates unverified user, emails 6-digit OTP
2. `POST /auth/verify-otp` → verifies account, returns access token + sets refresh-token cookie
3. `POST /auth/login` → returns access token (send as `Authorization: Bearer <token>`) + refresh cookie
4. `POST /auth/refresh` → rotates refresh token, issues new access token (cookie-based, no body needed)
5. `POST /auth/logout` → revokes refresh token server-side and clears cookie

### Socket.io
Connect with `{ auth: { token: accessToken } }`. Events: `ride:join`, `ride:leave`, `chat:send`, `chat:typing`, `chat:message` (broadcast), `driver:location` (broadcast).

## 🧱 Design notes worth knowing

- **Seat overbooking** is prevented with `mongoose.startSession()` + `withTransaction`, not just application-level checks — this matters under real concurrent load.
- **Refresh tokens** are httpOnly cookies scoped to `/api/v1/auth`, rotated on every refresh, and invalidated server-side on logout/password reset — access tokens never touch cookies (CSRF-safer), and refresh tokens never touch client JS (XSS-safer).
- **Cross-origin cookie behavior**: in production the refresh cookie defaults to `SameSite=None; Secure`, which is required if your frontend and API are on different domains (e.g. a Vercel frontend + a Render API — the common case). If you deploy both under the exact same domain, you can tighten this by setting `COOKIE_SAME_SITE=lax` or `strict`.
- `GET /rides/search` accepts origin/destination coordinates as **optional** — passing none returns all upcoming rides (used for a generic "browse" view), passing one or both pairs narrows by geo-radius.
- **OTPs and reset tokens are hashed** (SHA-256) before storage — a DB leak doesn't leak usable codes.
- **`forgotPassword` responds identically** whether or not the email exists, to avoid user enumeration.
- Mongoose `autoIndex` is disabled in production (`NODE_ENV=production`) — build indexes explicitly via a migration step or `mongoose syncIndexes()` during deploy, not on every boot.

## 🧪 Verified in this build
All source files pass `node --check`, the full dependency tree installs with **0 npm audit vulnerabilities**, and the Express app was booted and smoke-tested (health check, 404 handler, validation-error responses) end-to-end. Full integration testing against a real MongoDB Atlas cluster is recommended before first deploy — wire up `MONGO_URI` and run through the auth → ride → booking flow once.

## 📦 Suggested deployment (per your doc)
- Backend → Render / Railway / Fly.io
- Database → MongoDB Atlas (enables transactions out of the box)
- Set `NODE_ENV=production`, real JWT secrets, and your deployed frontend URL as `CLIENT_URL`
