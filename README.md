# TrainMitra

**Real train status, from real passengers.**

IRCTC gives you the official timetable, but nothing about what's actually happening on a train right now — is it delayed, where is it, how fast does Tatkal really sell out. TrainMitra fills exactly that gap: real passengers report delays and live location in real time, and share honest Tatkal and journey experience ratings — no fake GPS, no fabricated ticket-availability predictions, just crowdsourced data from people actually on board.

No official IRCTC data. Not affiliated with Indian Railways. Free to use, no ads, no paid tiers.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Design philosophy](#design-philosophy)
- [AI chat assistant](#ai-chat-assistant)
- [Moderation & anti-abuse](#moderation--anti-abuse)
- [Security](#security)
- [Contributing](#contributing)

## Features

| | Feature | What it does |
|---|---|---|
| 🔐 | **Accounts & roles** | Register/login with JWT access + refresh tokens (bcrypt-hashed passwords). Every account has a role — guest, user, moderator, or admin — that governs what it can do. |
| 🔎 | **Train lookup** | Search any train by number or name, or find every direct train between two stations — including city-alias resolution, so searching "Kolkata" surfaces Howrah Jn and Sealdah even though neither name contains the word. |
| ⏱️ | **Tatkal booking info** | A fixed, transparent rule, not a live feed: AC classes open at 10:00 AM and Sleeper/Second Sitting at 11:00 AM, one day before the journey, from the train's origin station — computed and countdown-timed for every train, plus a direct link to book on IRCTC. |
| 📣 | **Delay reports** | Crowdsourced delay reasons, ranked by community upvotes/downvotes. Resets automatically at midnight IST every day. |
| 🛰️ | **Live status feed** | Real-time station/platform updates from passengers actually on board, pushed live to everyone else tracking that train via Socket.io — no GPS, no satellite, just people. |
| 🏅 | **Contributor trust** | A persistent reputation score per user, separate from a report's own daily-reset upvote/downvote count — built from the net votes other people (never yourself) give your reports over time. Crosses a threshold and a trusted-contributor badge shows next to your name. |
| 💬 | **Passenger experience** | Tatkal Experience (crowdsourced minutes-to-sellout per seat class) and Journey Experience (1–5 ratings for cleanliness, food, staff behaviour, punctuality, and safety, plus written comments). |
| 📊 | **Live stats badges** | The "online now" and "registered" counters on the homepage are driven live over Socket.io — not a static number. |
| 🤖 | **AI chat assistant** | Answers using real TrainMitra data via tool-calling, or just chats like a general assistant. Details [below](#ai-chat-assistant). |
| 🛡️ | **Admin dashboard** | Restricted to a single admin account (role checked server-side off the JWT, not just the frontend). Overview analytics, a live view of who's online right now by name, a moderation feed, and user management with a ban toggle. |
| 📴 | **Offline-friendly PWA** | Installable as an app. Train search/route/schedule lookups are cached, so a train you've already opened stays viewable with no signal. Submitting a report while offline queues it locally and sends automatically once you're back online. |
| 🌐 | **Regional language support** | The site's own UI switches live across 9 languages (English, Hindi, Bengali, Tamil, Marathi, Kannada, Punjabi, Odia, Telugu). What a passenger actually types into a report is always shown exactly as written — never auto-translated. |

## Tech stack

**Frontend** — React 18, Vite, React Router, Tailwind CSS, Framer Motion, Axios, Socket.io Client, Recharts, react-i18next, vite-plugin-pwa (Workbox)

**Backend** — Node.js, Express, MongoDB + Mongoose, Socket.io, JSON Web Tokens, bcrypt, node-cron, Resend (email)

**AI** — Google Gemini API, `@google/genai` SDK

## Getting started

**Prerequisites**
- Node.js 18+ and npm
- A MongoDB database — a free MongoDB Atlas cluster works fine
- A free Gemini API key for the AI chat assistant — from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- A Resend API key, only if you want outgoing email (verification etc.) to actually send — [resend.com](https://resend.com)

**Backend**
```bash
cd backend
npm install
cp .env.example .env   # fill in the values — see Environment variables below
npm run dev             # starts the API on http://localhost:5000 with auto-reload
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env   # the default already points at http://localhost:5000/api
npm run dev             # starts the site on http://localhost:5173
```

**Seed the database** (so train search/lookup has something to return)
```bash
cd backend
npm run seed:trains
```

## Environment variables

> ⚠️ **Never commit real values.** Both `.env` files are gitignored. Use your own MongoDB cluster, your own JWT secrets, and your own API keys — never ask anyone for the real production credentials.

**Backend** (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the API listens on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/trainmitra` |
| `JWT_ACCESS_SECRET` | Signing secret for access tokens | a 64+ char random string |
| `JWT_REFRESH_SECRET` | Signing secret for refresh tokens — must differ from the access secret | a different 64+ char string |
| `JWT_ACCESS_EXPIRES` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh token lifetime | `7d` |
| `CLIENT_ORIGIN` | Comma-separated frontend origin(s) allowed by CORS | `http://localhost:5173` |
| `RESEND_API_KEY` | Resend API key for outgoing email (optional) | `re_...` |
| `EMAIL_FROM` | From-address used for outgoing email | `TrainMitra <onboarding@resend.dev>` |
| `GEMINI_API_KEY` | Google Gemini API key — powers the AI chat assistant | `AIza...` |

**Frontend** (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL the frontend calls for the API | `http://localhost:5000/api` |

## API reference

All routes are prefixed with `/api`. **Auth** column: `public` = no token needed, `token` = any logged-in user, `admin` = admin role required (enforced server-side off the JWT, not just the frontend).

<details>
<summary><strong>Health</strong> — <code>/api/health</code></summary>

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | public | Liveness check |
| GET | `/admin-only` | admin | Diagnostic route to sanity-check auth + role middleware |
</details>

<details>
<summary><strong>Auth</strong> — <code>/api/auth</code></summary>

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | public | Create an account |
| POST | `/login` | public | Log in — returns an access token and a refresh token |
| POST | `/refresh` | public | Exchange a refresh token for a new access token |
| POST | `/verify-email` | public | Verify an email address using its token |
| POST | `/resend-verification` | public | Resend the verification email |
</details>

<details>
<summary><strong>Users</strong> — <code>/api/users</code></summary>

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | token | Get the logged-in user's profile |
| PATCH | `/me` | token | Update the logged-in user's profile |
</details>

<details>
<summary><strong>Trains</strong> — <code>/api/trains</code></summary>

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/search?q=` | public | Search trains by number or name |
| GET | `/stations/search?q=` | public | Resolve a city/station name to station codes |
| GET | `/route?from=&to=` | public | Find direct trains between two station codes |
| GET | `/:trainNumber` | public | One train's full details and stop-by-stop timings |
</details>

<details>
<summary><strong>Delay reports</strong> — <code>/api/delay-reports</code></summary>

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/quota` | token | Check the caller's remaining daily posting quota |
| GET | `/:train` | public | Today's delay reports for a train, ranked by votes |
| POST | `/` | token | Submit a delay report |
| POST | `/:id/vote` | token | Upvote or downvote a report |
</details>

<details>
<summary><strong>Live status</strong> — <code>/api/live-status</code></summary>

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/quota` | token | Check the caller's remaining daily posting quota |
| GET | `/:train` | public | Today's live status updates for a train |
| POST | `/` | token | Submit a live status update |
| POST | `/:id/vote` | token | Upvote or downvote an update |
</details>

<details>
<summary><strong>Tatkal experience</strong> — <code>/api/tatkal-experience</code></summary>

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:train` | public | Average minutes-to-sellout for a train, by seat class |
| POST | `/` | token | Submit a Tatkal sellout-time estimate |
</details>

<details>
<summary><strong>Journey experience</strong> — <code>/api/journey-experience</code></summary>

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:train/mine` | token | The caller's own rating for a train |
| GET | `/:train` | public | Average ratings and recent comments for a train |
| POST | `/` | token | Submit or update a journey experience rating |
</details>

<details>
<summary><strong>Chat</strong> — <code>/api/chat</code></summary>

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | public | Send a message to the AI assistant (rate-limited per IP) |
</details>

<details>
<summary><strong>Admin</strong> — <code>/api/admin</code></summary>

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/overview` | admin | Platform-wide counts (users, online now, today's reports, experience totals) |
| GET | `/online-users` | admin | Who is currently online, by name (from the JWT sent on socket connect); anonymous connections listed as guests |
| GET | `/delay-reports` | admin | Every delay report posted today, across all trains, worst-voted first |
| DELETE | `/delay-reports/:id` | admin | Remove a delay report |
| GET | `/live-status` | admin | Every live status update posted today, across all trains, worst-voted first |
| DELETE | `/live-status/:id` | admin | Remove a live status update |
| GET | `/users` | admin | List every registered user with role, reputation, and ban status |
| PATCH | `/users/:id/ban` | admin | Toggle a user's ban status (blocks login; an admin account can't be banned) |
</details>

## Design philosophy

**No fake data, ever.** There's no official GPS feed and no real IRCTC seat-availability feed behind this app. Every delay reason, every live location update, every Tatkal sellout estimate comes from a passenger typing it in — never a simulation dressed up as fact.

**Server decides the date, never the client.** For delay reports and live status updates, "today" is computed server-side in IST (UTC+5:30) at the moment of posting — never taken from the request body. That closes off backdating or forward-dating a report to dodge the daily reset or moderation limits.

**One shared clock drives the whole visual language.** A single `useTimeOfDay` hook (morning / noon / evening / night, by real local hour) drives the sky gradient, sun/moon/stars, and accent colors across the whole site — so the entire mood shifts together with the actual time of day.

**Built incrementally, one step at a time.** Nothing shipped in one giant push. Each feature was built, explained, and confirmed before the next one started.

## AI chat assistant

- **Model**: Google Gemini (`gemini-3.1-flash-lite`) via the `@google/genai` SDK, with thinking effort set low — this is a lookup-and-answer assistant, not a reasoning task.
- **Tool-calling into real data**: eight tools let the model query TrainMitra's own database live — `search_trains`, `get_train_details`, `search_stations`, `search_route`, `get_delay_reports`, `get_live_status`, `get_journey_experience`, `get_tatkal_experience`.
- **Scope**: open-ended — it can chat about anything — but it always presents crowdsourced data as passenger reports, never as guaranteed fact, and never claims it can book tickets or handle payments (that always routes to IRCTC).
- **Guardrails**: Gemini's default safety filters are on, and the backend applies a per-IP rate limit to protect the free API quota. The API key lives server-side only.

## Moderation & anti-abuse

- Everyone gets a daily limit on how many delay reports and live status updates they can post.
- If one of a user's posts gets downvoted heavily enough, that user is blocked from posting again until the next day — automatically.
- One vote per person per report/update; voting the same way twice toggles the vote off.
- Delay reports and live status updates both wipe at midnight IST — Tatkal Experience and Journey Experience are long-running community averages, so those are never reset.
- The admin account can delete individual reports/updates directly, and can ban a user — both logged as an explicit action, never automatic.

## Security

- Short-lived JWT access tokens plus longer-lived refresh tokens, with automatic silent refresh on the frontend.
- Passwords are hashed with bcrypt — never stored or logged in plain text.
- CORS is locked to an explicit allow-list of origins, not left open.
- All secrets (JWT signing keys, database URI, email API key, Gemini API key) live in a server-side `.env` file that is gitignored and never reaches the frontend bundle or version control.

## Contributing

This has been a solo, incrementally-built project — if you're picking up a copy of the code, here's how to work on it without fighting the existing patterns:

- Match what's already there: no comments unless something is genuinely non-obvious, no new abstraction for a one-off case, Tailwind utility classes instead of new CSS files.
- Run both the backend and frontend locally (see [Getting started](#getting-started)) and actually click through whatever you changed before calling it done — a build passing isn't the same as a feature working.

---

Designed & developed by **Kaushik Banik**. Full project spec: [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md).
