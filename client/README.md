# GoTogether — Frontend

Smart carpool & ride-sharing platform. The React UI is now fully wired to the
Express/MongoDB backend in `../server` — no dummy data remains in the auth,
ride, booking, profile, or dashboard flows.

## Tech stack

- **React 19 + Vite** — app shell and build tooling
- **Tailwind CSS v4** — styling, via `@tailwindcss/vite`
- **React Router DOM v7** — routing, protected routes
- **React Hook Form** — form state and validation
- **Axios** — API client (`src/lib/api.js`) with automatic access-token refresh
- **Socket.io client** — real-time ride chat
- **React Icons** — iconography (Heroicons set)

## Getting started

```bash
npm install
cp .env.example .env   # defaults already point at http://localhost:5000
npm run dev             # start local dev server on http://localhost:5173
npm run build           # production build to /dist
npm run preview         # preview the production build locally
```

The backend in `../server` must be running (see its README) for anything
beyond the static marketing pages to work.

## How auth & API calls work (read this before touching `AuthContext`)

- The **refresh token** lives only in a secure, httpOnly cookie set by the
  server. The browser JS never reads it — this is what keeps it safe from XSS.
- The **access token** is kept only in memory (`src/lib/api.js`), never in
  `localStorage`. On page load, the app silently calls `POST /auth/refresh`
  (the cookie goes along automatically) to restore the session.
- Every 401 response triggers exactly one silent refresh + retry; if that
  also fails, the user is signed out client-side.
- All backend calls go through `src/services/*.js` — one file per resource
  (`authService`, `userService`, `rideService`, `bookingService`,
  `notificationService`, `ratingService`, `chatService`). Pages should never
  call `axios`/`api` directly; add a function to the relevant service instead.
- `src/lib/normalize.js` maps the API's Ride/Booking documents into the flat
  shape the UI components expect (this is what lets `RideCard`,
  `RouteLine`, etc. stay unchanged from the original design pass).
- `src/lib/geocode.js` turns a typed address into coordinates via the free
  OpenStreetMap Nominatim API (no key needed for development). **For real
  production traffic, swap this for a paid geocoder** (Google Places,
  Mapbox) — Nominatim's public instance has a strict ~1 req/sec usage policy.

## Project structure

```
src/
  components/
    layout/        Navbar, Footer, SiteLayout, DashboardLayout, ProtectedRoute
    ui/             Button, Card, Badge, Field, RouteLine, StatCard, EmptyState
    ride/           RideCard
    chat/           ChatPanel (Socket.io ride chat)
  context/
    AuthContext.jsx Real session management: register/verify-otp/login/logout/
                     forgot+reset-password, silent refresh on load
  services/         One file per backend resource — the only place that calls the API
  lib/
    api.js          Axios instance, in-memory access token, auto-refresh
    socket.js       Authenticated Socket.io connection factory
    geocode.js       Address → coordinates + distance/duration estimates
    normalize.js     API shape → UI shape mappers
  pages/            One file per route
    dashboard/      PassengerDashboard, DriverDashboard
```

## Pages implemented

| Route | Page | Notes |
|---|---|---|
| `/` | Landing page | |
| `/about`, `/features`, `/contact` | Marketing pages | |
| `/login` | Login | |
| `/signup` | Signup | real register → email OTP → verify flow |
| `/forgot-password` | Forgot/reset password | OTP-based |
| `/search-ride` | Search Ride | geocodes typed addresses, hits `/rides/search` |
| `/offer-ride` | Offer Ride | manages vehicles, geocodes route, posts `/rides` |
| `/ride/:id` | Ride Details | booking flow + live ride chat |
| `/dashboard/passenger` | Passenger Dashboard *(protected)* | |
| `/dashboard/driver` | Driver Dashboard *(protected)* | accept/decline requests |
| `/bookings` | My Bookings *(protected)* | |
| `/ride-history` | Ride History *(protected)* | |
| `/notifications` | Notifications *(protected)* | |
| `/profile` | Profile *(protected)* | avatar upload, name/phone edit |
| `/settings` | Settings *(protected)* | change password, delete account |
| `*` | 404 | |

Protected routes redirect to `/login` and return the user to their original
destination after logging in.

## Design system

The visual identity is a "night route" palette — asphalt ink, signal amber,
transit green — built around a signature **RouteLine** component: a dashed
road connecting waypoint pins. Typography pairs Space Grotesk (display) with
Inter (body) and JetBrains Mono (labels/data). All tokens live in
`src/index.css` under `@theme`.

## Known trade-offs / next steps

- Geocoding uses free Nominatim; swap it for a paid provider before real launch.
- There's no map view yet (route entry is address-text-based); adding one is
  a natural next step once a maps API key is available.
- The driver dashboard aggregates pending requests by calling
  `GET /bookings/ride/:id` once per active ride — fine at small scale, but a
  dedicated "my pending requests" backend endpoint would be more efficient
  at higher ride volumes.
