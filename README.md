(Files content cropped to 300k characters, download full ingest to see more)
================================================
FILE: README.md
================================================
# TrainMitra

**🔗 Live: [train-mitra.vercel.app](https://train-mitra.vercel.app)**

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

## design 
<img src="https://github.com/user-attachments/assets/b80b8670-cc0e-44af-bdaa-19bb4b5192eb" alt="diagram" style="max-width: 100%; height: auto;">


- Match what's already there: no comments unless something is genuinely non-obvious, no new abstraction for a one-off case, Tailwind utility classes instead of new CSS files.
- Run both the backend and frontend locally (see [Getting started](#getting-started)) and actually click through whatever you changed before calling it done — a build passing isn't the same as a feature working.

---

Designed & developed by **Kaushik Banik**.



================================================
FILE: backend/package.json
================================================
{
  "name": "trainmitra-backend",
  "version": "1.0.0",
  "description": "Backend for TrainMitra - Crowdsourced Train Status & Tatkal Tracker",
  "main": "src/server.js",
  "type": "commonjs",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "seed:trains": "node src/seed/seedTrains.js",
    "seed:import": "node src/seed/importTrains.js",
    "promote:admin": "node scripts/promote-admin.js"
  },
  "dependencies": {
    "@google/genai": "^2.18.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.5.1",
    "node-cron": "^4.6.0",
    "resend": "^6.20.0",
    "socket.io": "^4.8.3"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}



================================================
FILE: backend/.env.example
================================================
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/trainmitra?retryWrites=true&w=majority
JWT_ACCESS_SECRET=replace_with_a_long_random_string
JWT_REFRESH_SECRET=replace_with_a_different_long_random_string
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_ORIGIN=http://localhost:5173
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=TrainMitra <onboarding@resend.dev>
GEMINI_API_KEY=your_gemini_api_key



================================================
FILE: backend/backend/src/socket.js
================================================
const { Server } = require('socket.io');

let io = null;

function roomName(trainNumber, journeyDate) {
  return `${trainNumber}:${journeyDate}`;
}

function initSocket(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins },
  });

  io.on('connection', (socket) => {
    socket.on('join_train_room', ({ trainNumber, journeyDate }) => {
      if (!trainNumber || !journeyDate) return;
      socket.join(roomName(trainNumber, journeyDate));
    });

    socket.on('leave_train_room', ({ trainNumber, journeyDate }) => {
      if (!trainNumber || !journeyDate) return;
      socket.leave(roomName(trainNumber, journeyDate));
    });
  });

  return io;
}

function emitToTrainRoom(trainNumber, journeyDate, event, payload) {
  if (!io) return;
  io.to(roomName(trainNumber, journeyDate)).emit(event, payload);
}

module.exports = { initSocket, emitToTrainRoom };



================================================
FILE: backend/backend/src/controllers/liveStatusController.js
================================================
const LiveStatusUpdate = require('../models/LiveStatusUpdate');
const Train = require('../models/Train');
const { emitToTrainRoom } = require('../socket');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const RECENT_LIMIT = 50;

async function listUpdates(req, res) {
  try {
    const { train, date } = req.params;
    if (!DATE_RE.test(date)) {
      return res.status(400).json({ message: 'date must be in YYYY-MM-DD format' });
    }

    const updates = await LiveStatusUpdate.find({ trainNumber: train, journeyDate: date })
      .populate('reportedBy', 'name')
      .sort({ timestamp: -1 })
      .limit(RECENT_LIMIT)
      .lean();

    res.json(updates);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch live status updates', error: err.message });
  }
}

async function createUpdate(req, res) {
  try {
    const { trainNumber, journeyDate, stationName, message } = req.body;
    if (!trainNumber || !journeyDate || !stationName || !message) {
      return res.status(400).json({ message: 'trainNumber, journeyDate, stationName and message are required' });
    }
    if (!DATE_RE.test(journeyDate)) {
      return res.status(400).json({ message: 'journeyDate must be in YYYY-MM-DD format' });
    }

    const train = await Train.findOne({ trainNumber });
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    const validStation = train.stops.some((s) => s.stationName === stationName)
      || train.origin.stationName === stationName
      || train.destination.stationName === stationName;
    if (!validStation) {
      return res.status(400).json({ message: 'stationName must be one of this train\'s stops' });
    }

    const update = await LiveStatusUpdate.create({
      trainNumber,
      journeyDate,
      stationName,
      message: message.trim(),
      reportedBy: req.user.userId,
    });
    await update.populate('reportedBy', 'name');

    emitToTrainRoom(trainNumber, journeyDate, 'live_status_update', update);

    res.status(201).json(update);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit live status update', error: err.message });
  }
}

module.exports = { listUpdates, createUpdate };



================================================
FILE: backend/backend/src/models/LiveStatusUpdate.js
================================================
const mongoose = require('mongoose');

const liveStatusUpdateSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, trim: true },
  journeyDate: { type: String, required: true, trim: true }, // "YYYY-MM-DD"
  stationName: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true, maxlength: 300 },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

liveStatusUpdateSchema.index({ trainNumber: 1, journeyDate: 1, timestamp: -1 });

module.exports = mongoose.model('LiveStatusUpdate', liveStatusUpdateSchema);



================================================
FILE: backend/backend/src/routes/liveStatusRoutes.js
================================================
const express = require('express');
const { listUpdates, createUpdate } = require('../controllers/liveStatusController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:train/:date', listUpdates);
router.post('/', verifyToken, createUpdate);

module.exports = router;



================================================
FILE: backend/scripts/generate-backend-source.mjs
================================================
import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const SRC_DIR = join(import.meta.dirname, '..', 'src');
const OUT_FILE = join(import.meta.dirname, '..', '..', 'frontend', 'src', 'content', 'backendSource.generated.js');

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (entry.endsWith('.js') && !entry.endsWith('.json')) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(SRC_DIR).sort();
const entries = files.map((f) => {
  const relPath = 'backend/src/' + relative(SRC_DIR, f).replace(/\\/g, '/');
  const content = readFileSync(f, 'utf8');
  return { path: relPath, content };
});

const out = `// AUTO-GENERATED by backend/scripts/generate-backend-source.mjs - do not hand-edit.
// Re-run that script whenever backend source changes, so the Learner > Backend page
// always shows the real, current code instead of a stale copy.
export const backendSource = ${JSON.stringify(entries, null, 2)};
`;

writeFileSync(OUT_FILE, out, 'utf8');
console.log(`Wrote ${entries.length} backend files to ${OUT_FILE}`);



================================================
FILE: backend/scripts/promote-admin.js
================================================
// One-time (or rerunnable) script to grant the admin role to a specific account.
// Usage: node scripts/promote-admin.js [email]  (defaults to the site owner's email)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const email = (process.argv[2] || 'iamkaushik018@gmail.com').toLowerCase();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOneAndUpdate(
    { email },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    console.error(`No user found with email ${email} - register the account first, then rerun this script.`);
  } else {
    console.log(`${user.email} is now role: ${user.role}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});



================================================
FILE: backend/src/server.js
================================================
require('dotenv').config();

// Last-resort safety net: Express 4 doesn't catch a rejected promise from an async
// route handler on its own, so a bug that somehow slips past a controller's own
// try/catch would otherwise surface as an unhandled rejection - which crashes the
// whole process on modern Node. Log it clearly and exit so the host (nodemon locally,
// Render/Railway in production) restarts into a clean process instead of hanging in
// an undefined state or dying with no explanation.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

const http = require('http');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { initSocket, setRegisteredCount } = require('./socket');
const User = require('./models/User');
const { scheduleDailyCleanup } = require('./jobs/dailyCleanup');
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const trainRoutes = require('./routes/trainRoutes');
const userRoutes = require('./routes/userRoutes');
const delayReportRoutes = require('./routes/delayReportRoutes');
const liveStatusRoutes = require('./routes/liveStatusRoutes');
const tatkalExperienceRoutes = require('./routes/tatkalExperienceRoutes');
const journeyExperienceRoutes = require('./routes/journeyExperienceRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/users', userRoutes);
app.use('/api/delay-reports', delayReportRoutes);
app.use('/api/live-status', liveStatusRoutes);
app.use('/api/tatkal-experience', tatkalExperienceRoutes);
app.use('/api/journey-experience', journeyExperienceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server, allowedOrigins);

connectDB()
  .then(async () => {
    setRegisteredCount(await User.countDocuments());
    scheduleDailyCleanup();
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });



================================================
FILE: backend/src/socket.js
================================================
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

let io = null;

// Total registered users doesn't change on connect/disconnect, so it's kept as an
// in-memory counter (seeded once from the DB at startup, see server.js) instead of
// re-querying Mongo on every socket event - only registration bumps it.
let registeredCount = 0;

// socket.id -> { userId, name, role, connectedAt }. Populated from the JWT sent on
// connect (if any); sockets with no/invalid token stay as anonymous guest entries
// rather than being rejected, since presence viewing shouldn't require login.
const onlineUsers = new Map();

function roomName(trainNumber, journeyDate) {
  return `${trainNumber}:${journeyDate}`;
}

async function identifySocket(socket) {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(payload.userId).select('name role').lean();
      if (user) {
        onlineUsers.set(socket.id, {
          userId: String(user._id),
          name: user.name,
          role: user.role,
          connectedAt: new Date(),
        });
        return;
      }
    } catch (err) {
      // Invalid/expired token - fall through to a guest entry rather than erroring,
      // since a stale token shouldn't stop someone from just browsing anonymously.
    }
  }
  onlineUsers.set(socket.id, { userId: null, name: null, role: 'guest', connectedAt: new Date() });
}

// Collapses multiple tabs/devices from the same signed-in user into one row (keeping
// the earliest connection time), while guests are listed per-connection since they
// have no identity to dedupe on.
function getOnlineUsers() {
  const named = new Map();
  const guests = [];
  for (const entry of onlineUsers.values()) {
    if (entry.userId) {
      const existing = named.get(entry.userId);
      if (!existing || entry.connectedAt < existing.connectedAt) {
        named.set(entry.userId, entry);
      }
    } else {
      guests.push(entry);
    }
  }
  return [...named.values(), ...guests].sort((a, b) => a.connectedAt - b.connectedAt);
}

function setRegisteredCount(count) {
  registeredCount = count;
}

function incrementRegisteredCount() {
  registeredCount += 1;
  if (io) io.emit('stats:registered', registeredCount);
}

function broadcastOnlineCount() {
  if (io) io.emit('stats:online', io.engine.clientsCount);
}

function getOnlineCount() {
  return io ? io.engine.clientsCount : 0;
}

function initSocket(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins },
  });

  io.on('connection', (socket) => {
    identifySocket(socket);

    // A fresh connection changes the online count for everyone, but registered
    // count only needs to reach this one new client.
    broadcastOnlineCount();
    socket.emit('stats:registered', registeredCount);

    // The pushes above can race ahead of the frontend's listener being ready
    // (e.g. this socket connects before the badge component mounts and
    // subscribes) - so also answer an explicit request with current values,
    // which the frontend sends once its listener is actually attached.
    socket.on('stats:request', () => {
      socket.emit('stats:online', io.engine.clientsCount);
      socket.emit('stats:registered', registeredCount);
    });

    socket.on('join_train_room', ({ trainNumber, journeyDate }) => {
      if (!trainNumber || !journeyDate) return;
      socket.join(roomName(trainNumber, journeyDate));
    });

    socket.on('leave_train_room', ({ trainNumber, journeyDate }) => {
      if (!trainNumber || !journeyDate) return;
      socket.leave(roomName(trainNumber, journeyDate));
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      broadcastOnlineCount();
    });
  });

  return io;
}

function emitToTrainRoom(trainNumber, journeyDate, event, payload) {
  if (!io) return;
  io.to(roomName(trainNumber, journeyDate)).emit(event, payload);
}

module.exports = { initSocket, emitToTrainRoom, setRegisteredCount, incrementRegisteredCount, getOnlineCount, getOnlineUsers };



================================================
FILE: backend/src/config/db.js
================================================
const dns = require('dns');
const mongoose = require('mongoose');

// Windows' registered DNS resolver intermittently refuses the SRV lookup
// Node's driver needs for mongodb+srv:// URIs (unrelated to Atlas IP access
// lists). Pointing Node's resolver straight at Google DNS avoids that.
dns.setServers(['8.8.8.8', '8.8.4.4']);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Without these, a connection-level 'error' event (e.g. the DB dropping mid-session,
// long after startup) has no listener - Node's EventEmitter treats an unhandled
// 'error' event as fatal and crashes the whole process. Mongoose's driver already
// retries reconnecting on its own; these just make sure that a blip is logged
// instead of taking the server down.
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected - driver will attempt to reconnect automatically.');
});
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected.');
});

// On wake-from-lock, Windows' network adapter can take a few seconds to
// reassociate, so the first DNS lookup right after nodemon starts fails
// even though connectivity is fine moments later. Retry instead of
// crashing so the server self-heals without a manual `rs`/file save.
async function connectDB(retries = 10, delayMs = 3000) {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set in .env');
  }

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(uri);
      console.log(`MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      const isLastAttempt = attempt === retries;
      console.error(
        `MongoDB connection attempt ${attempt}/${retries} failed: ${err.message}`,
      );
      if (isLastAttempt) {
        throw err;
      }
      await sleep(delayMs);
    }
  }
}

module.exports = connectDB;



================================================
FILE: backend/src/controllers/adminController.js
================================================
const User = require('../models/User');
const DelayReport = require('../models/DelayReport');
const LiveStatusUpdate = require('../models/LiveStatusUpdate');
const TatkalExperience = require('../models/TatkalExperience');
const JourneyExperience = require('../models/JourneyExperience');
const { todayIST } = require('../utils/dateUtils');
const { getOnlineCount, getOnlineUsers } = require('../socket');

async function getOverview(req, res) {
  try {
    const journeyDate = todayIST();
    const [users, delayReportsToday, liveStatusToday, tatkalExperienceTotal, journeyExperienceTotal] = await Promise.all([
      User.countDocuments(),
      DelayReport.countDocuments({ journeyDate }),
      LiveStatusUpdate.countDocuments({ journeyDate }),
      TatkalExperience.countDocuments(),
      JourneyExperience.countDocuments(),
    ]);

    res.json({
      users,
      onlineNow: getOnlineCount(),
      delayReportsToday,
      liveStatusToday,
      tatkalExperienceTotal,
      journeyExperienceTotal,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch overview', error: err.message });
  }
}

// Flat across all trains (not per-train like the public endpoint) so a spam wave
// on any train surfaces here, sorted worst-first by downvotes.
async function listDelayReports(req, res) {
  try {
    const journeyDate = todayIST();
    const reports = await DelayReport.find({ journeyDate })
      .populate('reportedBy', 'name email reputationScore')
      .sort({ downvotes: -1, createdAt: -1 })
      .lean();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch delay reports', error: err.message });
  }
}

async function deleteDelayReport(req, res) {
  try {
    const report = await DelayReport.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Delay report not found' });
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete delay report', error: err.message });
  }
}

async function listLiveStatus(req, res) {
  try {
    const journeyDate = todayIST();
    const updates = await LiveStatusUpdate.find({ journeyDate })
      .populate('reportedBy', 'name email reputationScore')
      .sort({ downvotes: -1, timestamp: -1 })
      .lean();
    res.json(updates);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch live status updates', error: err.message });
  }
}

async function deleteLiveStatus(req, res) {
  try {
    const update = await LiveStatusUpdate.findByIdAndDelete(req.params.id);
    if (!update) {
      return res.status(404).json({ message: 'Live status update not found' });
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete live status update', error: err.message });
  }
}

function listOnlineUsers(req, res) {
  res.json(getOnlineUsers());
}

async function listUsers(req, res) {
  try {
    const users = await User.find()
      .select('name email role isBanned reputationScore createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
}

async function toggleBan(req, res) {
  try {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (target.role === 'admin') {
      return res.status(400).json({ message: "Can't ban an admin account" });
    }
    target.isBanned = !target.isBanned;
    await target.save();
    res.json({ id: target._id, isBanned: target.isBanned });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update ban status', error: err.message });
  }
}

module.exports = {
  getOverview,
  listDelayReports,
  deleteDelayReport,
  listLiveStatus,
  deleteLiveStatus,
  listOnlineUsers,
  listUsers,
  toggleBan,
};



================================================
FILE: backend/src/controllers/authController.js
================================================
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const { sendVerificationEmail } = require('../utils/email');
const { incrementRegisteredCount } = require('../socket');

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      name,
      email,
      passwordHash,
      verificationToken,
      verificationTokenExpires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    });

    // Best-effort: verification is not required to use the account right now,
    // so a failed send here shouldn't affect registration.
    sendVerificationEmail(user, verificationToken).catch((emailErr) => {
      console.error('Failed to send verification email:', emailErr.message);
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    incrementRegisteredCount();

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        links: user.links,
        phone: user.phone,
        homeStation: user.homeStation,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
}

async function verifyEmail(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'token is required' });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user || user.verificationTokenExpires < new Date()) {
      return res.status(400).json({ message: 'Verification link is invalid or has expired' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.json({ message: 'Email verified. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Email verification failed', error: err.message });
  }
}

async function resendVerification(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond the same way regardless of whether the account exists,
    // so this endpoint can't be used to probe for registered emails.
    if (!user || user.isVerified) {
      return res.json({ message: 'If that account needs verification, a new email has been sent.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    await user.save();

    await sendVerificationEmail(user, verificationToken);

    res.json({ message: 'If that account needs verification, a new email has been sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not resend verification email', error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'This account has been banned.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        links: user.links,
        phone: user.phone,
        homeStation: user.homeStation,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Refresh token not recognized' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(500).json({ message: 'Token refresh failed', error: err.message });
  }
}

module.exports = { register, login, refresh, verifyEmail, resendVerification };



================================================
FILE: backend/src/controllers/chatController.js
================================================
const { sendChatMessage } = require('../services/geminiChat');

const MAX_MESSAGE_LENGTH = 1000;

async function chat(req, res) {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'message is required' });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `message must be ${MAX_MESSAGE_LENGTH} characters or fewer` });
    }

    const reply = await sendChatMessage({ message: message.trim(), history });
    res.json({ reply });
  } catch (err) {
    console.error('Chat request failed:', err);
    res.status(500).json({ message: 'Chat request failed', error: err.message });
  }
}

module.exports = { chat };



================================================
FILE: backend/src/controllers/delayReportController.js
================================================
const mongoose = require('mongoose');
const DelayReport = require('../models/DelayReport');
const Train = require('../models/Train');
const { emitToTrainRoom } = require('../socket');
const { todayIST } = require('../utils/dateUtils');
const {
  DAILY_DELAY_REPORT_LIMIT,
  isBlockedToday,
  hasReachedDelayReportLimit,
  getDelayReportUsage,
} = require('../utils/moderation');
const { applyReputationDelta } = require('../utils/reputation');

async function getQuota(req, res) {
  try {
    const journeyDate = todayIST();
    const [usage, blocked] = await Promise.all([
      getDelayReportUsage(req.user.userId, journeyDate),
      isBlockedToday(req.user.userId, journeyDate),
    ]);
    res.json({ ...usage, blocked });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch quota', error: err.message });
  }
}

async function listReports(req, res) {
  try {
    const { train } = req.params;
    const journeyDate = todayIST();

    const reports = await DelayReport.find({ trainNumber: train, journeyDate })
      .populate('reportedBy', 'name reputationScore')
      .sort({ createdAt: -1 })
      .lean();

    reports.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch delay reports', error: err.message });
  }
}

async function createReport(req, res) {
  try {
    const { trainNumber, reason } = req.body;
    if (!trainNumber || !reason || !reason.trim()) {
      return res.status(400).json({ message: 'trainNumber and reason are required' });
    }

    const train = await Train.findOne({ trainNumber });
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    // journeyDate is never taken from the client - always "today" in IST, computed
    // server-side, so reports can't be backdated/forward-dated to dodge the daily wipe.
    const journeyDate = todayIST();

    if (await isBlockedToday(req.user.userId, journeyDate)) {
      return res.status(403).json({
        message: 'One of your posts today got too many false/dislike votes, so posting is blocked until tomorrow.',
      });
    }
    if (await hasReachedDelayReportLimit(req.user.userId, journeyDate)) {
      return res.status(429).json({
        message: `You've reached today's limit of ${DAILY_DELAY_REPORT_LIMIT} delay reports. Try again after midnight IST.`,
      });
    }

    const report = await DelayReport.create({
      trainNumber,
      journeyDate,
      reason: reason.trim(),
      reportedBy: req.user.userId,
    });
    await report.populate('reportedBy', 'name reputationScore');

    emitToTrainRoom(trainNumber, journeyDate, 'new_delay_report', report);

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit delay report', error: err.message });
  }
}

async function voteReport(req, res) {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid report id' });
    }
    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({ message: "voteType must be 'up' or 'down'" });
    }

    const report = await DelayReport.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Delay report not found' });
    }
    const existingVote = report.votedBy.find((v) => v.userId.equals(req.user.userId));
    const netBefore = report.upvotes - report.downvotes;

    if (!existingVote) {
      report.votedBy.push({ userId: req.user.userId, voteType });
      if (voteType === 'up') report.upvotes += 1;
      else report.downvotes += 1;
    } else if (existingVote.voteType === voteType) {
      // Same vote again -> toggle off
      report.votedBy = report.votedBy.filter((v) => !v.userId.equals(req.user.userId));
      if (voteType === 'up') report.upvotes -= 1;
      else report.downvotes -= 1;
    } else {
      // Switching vote direction
      existingVote.voteType = voteType;
      if (voteType === 'up') {
        report.upvotes += 1;
        report.downvotes -= 1;
      } else {
        report.downvotes += 1;
        report.upvotes -= 1;
      }
    }

    const netAfter = report.upvotes - report.downvotes;
    await applyReputationDelta(report.reportedBy, req.user.userId, netAfter - netBefore);

    await report.save();
    await report.populate('reportedBy', 'name reputationScore');

    emitToTrainRoom(report.trainNumber, report.journeyDate, 'vote_updated', report);

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to register vote', error: err.message });
  }
}

module.exports = { getQuota, listReports, createReport, voteReport };



================================================
FILE: backend/src/controllers/journeyExperienceController.js
================================================
const JourneyExperience = require('../models/JourneyExperience');
const Train = require('../models/Train');

const RATING_FIELDS = ['cleanliness', 'food', 'staffBehaviour', 'punctuality', 'safety'];
const RECENT_COMMENTS_LIMIT = 10;

async function getInsight(req, res) {
  try {
    const { train } = req.params;

    const groupStage = { _id: null, count: { $sum: 1 } };
    RATING_FIELDS.forEach((field) => {
      groupStage[field] = { $avg: `$${field}` };
    });

    const [summary] = await JourneyExperience.aggregate([
      { $match: { trainNumber: train } },
      { $group: groupStage },
    ]);

    let averages = null;
    if (summary) {
      averages = { count: summary.count };
      RATING_FIELDS.forEach((field) => {
        averages[field] = Math.round(summary[field] * 10) / 10;
      });
      const overallSum = RATING_FIELDS.reduce((sum, field) => sum + summary[field], 0);
      averages.overall = Math.round((overallSum / RATING_FIELDS.length) * 10) / 10;
    }

    const recentComments = await JourneyExperience.find({ trainNumber: train, comment: { $ne: '' } })
      .sort({ createdAt: -1 })
      .limit(RECENT_COMMENTS_LIMIT)
      .populate('reportedBy', 'name')
      .select('comment createdAt reportedBy');

    res.json({
      averages,
      recentComments: recentComments.map((c) => ({
        comment: c.comment,
        createdAt: c.createdAt,
        name: c.reportedBy?.name || 'A passenger',
      })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch journey experience insight', error: err.message });
  }
}

async function getMine(req, res) {
  try {
    const { train } = req.params;
    const existing = await JourneyExperience.findOne({ trainNumber: train, reportedBy: req.user.userId });
    res.json(existing || null);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your journey experience', error: err.message });
  }
}

async function submitExperience(req, res) {
  try {
    const { trainNumber, comment } = req.body;
    if (!trainNumber) {
      return res.status(400).json({ message: 'trainNumber is required' });
    }

    const ratings = {};
    for (const field of RATING_FIELDS) {
      const value = Number(req.body[field]);
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        return res.status(400).json({ message: `${field} must be a whole number between 1 and 5` });
      }
      ratings[field] = value;
    }

    if (comment !== undefined && typeof comment === 'string' && comment.length > 300) {
      return res.status(400).json({ message: 'comment must be 300 characters or fewer' });
    }

    const train = await Train.findOne({ trainNumber });
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    const experience = await JourneyExperience.findOneAndUpdate(
      { trainNumber, reportedBy: req.user.userId },
      { ...ratings, comment: comment?.trim() || '', trainNumber, reportedBy: req.user.userId },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(experience);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit journey experience', error: err.message });
  }
}

module.exports = { getInsight, getMine, submitExperience };



================================================
FILE: backend/src/controllers/liveStatusController.js
================================================
const mongoose = require('mongoose');
const LiveStatusUpdate = require('../models/LiveStatusUpdate');
const Train = require('../models/Train');
const { emitToTrainRoom } = require('../socket');
const { todayIST } = require('../utils/dateUtils');
const {
  DAILY_LIVE_STATUS_LIMIT,
  isBlockedToday,
  hasReachedLiveStatusLimit,
  getLiveStatusUsage,
} = require('../utils/moderation');
const { applyReputationDelta } = require('../utils/reputation');

const RECENT_LIMIT = 50;

async function getQuota(req, res) {
  try {
    const journeyDate = todayIST();
    const [usage, blocked] = await Promise.all([
      getLiveStatusUsage(req.user.userId, journeyDate),
      isBlockedToday(req.user.userId, journeyDate),
    ]);
    res.json({ ...usage, blocked });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch quota', error: err.message });
  }
}

async function listUpdates(req, res) {
  try {
    const { train } = req.params;
    const journeyDate = todayIST();

    const updates = await LiveStatusUpdate.find({ trainNumber: train, journeyDate })
      .populate('reportedBy', 'name reputationScore')
      .sort({ timestamp: -1 })
      .limit(RECENT_LIMIT)
      .lean();

    res.json(updates);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch live status updates', error: err.message });
  }
}

async function createUpdate(req, res) {
  try {
    const { trainNumber, stationName, message, platformNumber } = req.body;
    if (!trainNumber || !stationName || !message || !message.trim()) {
      return res.status(400).json({ message: 'trainNumber, stationName and message are required' });
    }
    if (platformNumber && platformNumber.trim().length > 10) {
      return res.status(400).json({ message: 'platformNumber is too long' });
    }

    const train = await Train.findOne({ trainNumber });
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    const validStation = train.stops.some((s) => s.stationName === stationName)
      || train.origin.stationName === stationName
      || train.destination.stationName === stationName;
    if (!validStation) {
      return res.status(400).json({ message: 'stationName must be one of this train\'s stops' });
    }

    // journeyDate is never taken from the client - always "today" in IST, computed
    // server-side, so updates can't be backdated/forward-dated to dodge the daily wipe.
    const journeyDate = todayIST();

    if (await isBlockedToday(req.user.userId, journeyDate)) {
      return res.status(403).json({
        message: 'One of your posts today got too many false/dislike votes, so posting is blocked until tomorrow.',
      });
    }
    if (await hasReachedLiveStatusLimit(req.user.userId, journeyDate)) {
      return res.status(429).json({
        message: `You've reached today's limit of ${DAILY_LIVE_STATUS_LIMIT} live status updates. Try again after midnight IST.`,
      });
    }

    const update = await LiveStatusUpdate.create({
      trainNumber,
      journeyDate,
      stationName,
      platformNumber: platformNumber?.trim() || undefined,
      message: message.trim(),
      reportedBy: req.user.userId,
    });
    await update.populate('reportedBy', 'name reputationScore');

    emitToTrainRoom(trainNumber, journeyDate, 'live_status_update', update);

    res.status(201).json(update);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit live status update', error: err.message });
  }
}

async function voteUpdate(req, res) {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid update id' });
    }
    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({ message: "voteType must be 'up' or 'down'" });
    }

    const update = await LiveStatusUpdate.findById(id);
    if (!update) {
      return res.status(404).json({ message: 'Live status update not found' });
    }
    const existingVote = update.votedBy.find((v) => v.userId.equals(req.user.userId));
    const netBefore = update.upvotes - update.downvotes;

    if (!existingVote) {
      update.votedBy.push({ userId: req.user.userId, voteType });
      if (voteType === 'up') update.upvotes += 1;
      else update.downvotes += 1;
    } else if (existingVote.voteType === voteType) {
      update.votedBy = update.votedBy.filter((v) => !v.userId.equals(req.user.userId));
      if (voteType === 'up') update.upvotes -= 1;
      else update.downvotes -= 1;
    } else {
      existingVote.voteType = voteType;
      if (voteType === 'up') {
        update.upvotes += 1;
        update.downvotes -= 1;
      } else {
        update.downvotes += 1;
        update.upvotes -= 1;
      }
    }

    const netAfter = update.upvotes - update.downvotes;
    await applyReputationDelta(update.reportedBy, req.user.userId, netAfter - netBefore);

    await update.save();
    await update.populate('reportedBy', 'name reputationScore');

    emitToTrainRoom(update.trainNumber, update.journeyDate, 'live_status_vote_updated', update);

    res.json(update);
  } catch (err) {
    res.status(500).json({ message: 'Failed to register vote', error: err.message });
  }
}

module.exports = { getQuota, listUpdates, createUpdate, voteUpdate };



================================================
FILE: backend/src/controllers/tatkalExperienceController.js
================================================
const TatkalExperience = require('../models/TatkalExperience');
const Train = require('../models/Train');

const SEAT_CATEGORIES = ['AC', 'Sleeper'];

async function getInsight(req, res) {
  try {
    const { train } = req.params;

    const rows = await TatkalExperience.aggregate([
      { $match: { trainNumber: train } },
      { $group: { _id: '$seatCategory', avgMinutes: { $avg: '$estimatedMinutesToSellOut' }, count: { $sum: 1 } } },
    ]);

    const insight = { AC: null, Sleeper: null };
    rows.forEach((row) => {
      insight[row._id] = { avgMinutes: Math.round(row.avgMinutes * 10) / 10, count: row.count };
    });

    res.json(insight);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch Tatkal experience insight', error: err.message });
  }
}

async function submitExperience(req, res) {
  try {
    const { trainNumber, seatCategory, estimatedMinutesToSellOut } = req.body;
    if (!trainNumber || !seatCategory || estimatedMinutesToSellOut === undefined) {
      return res.status(400).json({ message: 'trainNumber, seatCategory and estimatedMinutesToSellOut are required' });
    }
    if (!SEAT_CATEGORIES.includes(seatCategory)) {
      return res.status(400).json({ message: "seatCategory must be 'AC' or 'Sleeper'" });
    }
    const minutes = Number(estimatedMinutesToSellOut);
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 180) {
      return res.status(400).json({ message: 'estimatedMinutesToSellOut must be a number between 0 and 180' });
    }

    const train = await Train.findOne({ trainNumber });
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    const experience = await TatkalExperience.create({
      trainNumber,
      seatCategory,
      estimatedMinutesToSellOut: minutes,
      reportedBy: req.user.userId,
    });

    res.status(201).json(experience);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit Tatkal experience', error: err.message });
  }
}

module.exports = { getInsight, submitExperience };



================================================
FILE: backend/src/controllers/trainController.js
================================================
const Train = require('../models/Train');
const CITY_ALIASES = require('../data/cityAliases');

async function searchTrains(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }

    const regex = new RegExp(q, 'i');
    const trains = await Train.find({
      $or: [{ trainNumber: regex }, { trainName: regex }],
    })
      .select('trainNumber trainName origin destination')
      .limit(10);

    res.json(trains);
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
}

async function getTrainByNumber(req, res) {
  try {
    const train = await Train.findOne({ trainNumber: req.params.trainNumber });
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    res.json(train);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch train', error: err.message });
  }
}

async function searchStations(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }

    const regex = new RegExp(q, 'i');
    const nameOrCodeMatches = await Train.aggregate([
      { $unwind: '$stops' },
      { $match: { $or: [{ 'stops.stationName': regex }, { 'stops.stationCode': regex }] } },
      { $group: { _id: '$stops.stationCode', stationName: { $first: '$stops.stationName' } } },
      { $project: { _id: 0, stationCode: '$_id', stationName: 1 } },
    ]);

    // City aliasing: e.g. "kolkata" should also surface Howrah Jn / Sealdah, whose
    // names don't contain the word "Kolkata" at all.
    const normalizedQuery = q.toLowerCase().replace(/\s+/g, '');
    const cityKey = Object.keys(CITY_ALIASES).find(
      (city) => city.startsWith(normalizedQuery) || normalizedQuery.startsWith(city)
    );

    let cityMatches = [];
    if (cityKey) {
      cityMatches = await Train.aggregate([
        { $unwind: '$stops' },
        { $match: { 'stops.stationCode': { $in: CITY_ALIASES[cityKey] } } },
        { $group: { _id: '$stops.stationCode', stationName: { $first: '$stops.stationName' } } },
        { $project: { _id: 0, stationCode: '$_id', stationName: 1 } },
      ]);
    }

    const seen = new Set();
    const stations = [...cityMatches, ...nameOrCodeMatches].filter((s) => {
      if (seen.has(s.stationCode)) return false;
      seen.add(s.stationCode);
      return true;
    });
    stations.sort((a, b) => a.stationName.localeCompare(b.stationName));

    res.json(stations.slice(0, 10));
  } catch (err) {
    res.status(500).json({ message: 'Station search failed', error: err.message });
  }
}

function toAbsoluteMinutes(dayOfJourney, time) {
  const [h, m] = time.split(':').map(Number);
  return (dayOfJourney - 1) * 1440 + h * 60 + m;
}

async function findDirectTrains(from, to) {
  const trains = await Train.find({
    'stops.stationCode': from,
    $and: [{ 'stops.stationCode': to }],
  }).select('trainNumber trainName stops');

  return trains
    .map((t) => {
      const fromStop = t.stops.find((s) => s.stationCode === from);
      const toStop = t.stops.find((s) => s.stationCode === to);
      if (!fromStop || !toStop || fromStop.sequence >= toStop.sequence) return null;

      return {
        trainNumber: t.trainNumber,
        trainName: t.trainName,
        from: {
          stationName: fromStop.stationName,
          stationCode: fromStop.stationCode,
          departureTime: fromStop.departureTime,
          dayOfJourney: fromStop.dayOfJourney,
        },
        to: {
          stationName: toStop.stationName,
          stationCode: toStop.stationCode,
          arrivalTime: toStop.arrivalTime,
          dayOfJourney: toStop.dayOfJourney,
        },
        durationMinutes:
          toAbsoluteMinutes(toStop.dayOfJourney, toStop.arrivalTime) -
          toAbsoluteMinutes(fromStop.dayOfJourney, fromStop.departureTime),
      };
    })
    .filter(Boolean);
}

// Every other station code sharing a city cluster with `code`, e.g. HWH -> [SDAH, SHM, KOAA].
function sameCityCodes(code) {
  const merged = new Set();
  for (const codes of Object.values(CITY_ALIASES)) {
    if (codes.includes(code)) codes.forEach((c) => merged.add(c));
  }
  merged.delete(code);
  return [...merged];
}

function sortByDeparture(matches) {
  return matches.sort((a, b) => (a.from.departureTime || '').localeCompare(b.from.departureTime || ''));
}

async function searchByRoute(req, res) {
  try {
    const from = (req.query.from || '').trim().toUpperCase();
    const to = (req.query.to || '').trim().toUpperCase();
    if (!from || !to) {
      return res.status(400).json({ message: 'Both from and to station codes are required' });
    }
    if (from === to) {
      return res.status(400).json({ message: 'From and to stations must be different' });
    }

    const direct = sortByDeparture(await findDirectTrains(from, to));
    if (direct.length > 0) {
      return res.json({ exact: true, results: direct });
    }

    // No exact match - fall back to trains reaching a different station in the same
    // city as `from` and/or `to` (e.g. searched Howrah, real train only reaches Sealdah).
    const altToCodes = sameCityCodes(to);
    const altFromCodes = sameCityCodes(from);

    const nearbyBatches = await Promise.all([
      ...altToCodes.map((altTo) => findDirectTrains(from, altTo)),
      ...altFromCodes.map((altFrom) => findDirectTrains(altFrom, to)),
    ]);

    const seen = new Set();
    const nearby = sortByDeparture(
      nearbyBatches.flat().filter((m) => {
        if (seen.has(m.trainNumber)) return false;
        seen.add(m.trainNumber);
        return true;
      })
    );

    res.json({ exact: false, results: nearby });
  } catch (err) {
    res.status(500).json({ message: 'Route search failed', error: err.message });
  }
}

module.exports = { searchTrains, getTrainByNumber, searchStations, searchByRoute };



================================================
FILE: backend/src/controllers/userController.js
================================================
const User = require('../models/User');

const MAX_AVATAR_BYTES = 500 * 1024;

function toProfile(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio,
    avatar: user.avatar,
    links: user.links,
    phone: user.phone,
    homeStation: user.homeStation,
  };
}

async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(toProfile(user));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
}

async function updateMe(req, res) {
  try {
    const { name, bio, avatar, links, phone, homeStation } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      user.name = name.trim();
    }
    if (bio !== undefined) {
      user.bio = bio.trim().slice(0, 200);
    }
    if (avatar !== undefined) {
      if (avatar && (!avatar.startsWith('data:image/') || avatar.length > MAX_AVATAR_BYTES)) {
        return res.status(400).json({ message: 'Avatar must be an image under 500KB' });
      }
      user.avatar = avatar;
    }
    if (links !== undefined) {
      if (!Array.isArray(links)) {
        return res.status(400).json({ message: 'Links must be a list' });
      }
      if (links.length > 10) {
        return res.status(400).json({ message: 'You can add up to 10 links' });
      }
      const normalizedLinks = [];
      for (const raw of links) {
        const trimmed = String(raw).trim();
        if (!trimmed) continue;
        const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
        try {
          new URL(normalized);
        } catch {
          return res.status(400).json({ message: `"${trimmed}" is not a valid URL` });
        }
        normalizedLinks.push(normalized.slice(0, 200));
      }
      user.links = normalizedLinks;
    }
    if (phone !== undefined) {
      const trimmed = phone.trim();
      if (trimmed && !/^[0-9+\-\s]{6,15}$/.test(trimmed)) {
        return res.status(400).json({ message: 'Phone must be a valid number' });
      }
      user.phone = trimmed;
    }
    if (homeStation !== undefined) {
      user.homeStation = homeStation.trim().slice(0, 100);
    }

    await user.save();
    res.json(toProfile(user));
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
}

module.exports = { getMe, updateMe };



================================================
FILE: backend/src/data/cityAliases.js
================================================
// Maps a city/metro name to the station codes that serve it, so searching "Kolkata"
// surfaces Howrah Jn + Sealdah even though neither station name contains the word "Kolkata".
// Same city can have multiple official IR station codes across different eras/sources
// (e.g. Mumbai Central is both MMCT and BCT) - list every variant seen in the data.
// Extend this as more stations are added.
module.exports = {
  kolkata: ['HWH', 'SDAH', 'SHM', 'KOAA'],
  calcutta: ['HWH', 'SDAH', 'SHM', 'KOAA'],
  delhi: ['NDLS', 'NZM', 'DLI', 'DEE', 'ANDI', 'ANVT'],
  mumbai: ['MMCT', 'CSMT', 'BDTS', 'LTT', 'BCT', 'DR', 'CSTM', 'DDR'],
  bombay: ['MMCT', 'CSMT', 'BDTS', 'BCT', 'DR', 'CSTM', 'DDR'],
  bangalore: ['SBC', 'YPR', 'BNC'],
  bengaluru: ['SBC', 'YPR', 'BNC'],
  hyderabad: ['SC', 'HYB'],
  secunderabad: ['SC', 'HYB'],
  chennai: ['MAS', 'MSB', 'MS'],
  madras: ['MAS', 'MSB', 'MS'],
};



================================================
FILE: backend/src/jobs/dailyCleanup.js
================================================
const cron = require('node-cron');
const DelayReport = require('../models/DelayReport');
const LiveStatusUpdate = require('../models/LiveStatusUpdate');
const { todayIST } = require('../utils/dateUtils');

// Delay reports and live status updates only ever get created with today's IST date
// (the server, not the client, decides "today" - see dateUtils.todayIST). So anything
// left with a journeyDate that isn't today is, by definition, from a previous day and
// gets wiped here. Runs at 00:00 IST daily, which is also when "today" rolls over, so
// this always clears exactly yesterday's data before anyone can post under today's date.
function runCleanup() {
  const today = todayIST();
  return Promise.all([
    DelayReport.deleteMany({ journeyDate: { $ne: today } }),
    LiveStatusUpdate.deleteMany({ journeyDate: { $ne: today } }),
  ]).then(([reportsResult, statusResult]) => {
    console.log(
      `Daily cleanup: removed ${reportsResult.deletedCount} delay reports, ${statusResult.deletedCount} live status updates`
    );
  }).catch((err) => {
    console.error('Daily cleanup failed:', err.message);
  });
}

function scheduleDailyCleanup() {
  cron.schedule('0 0 * * *', runCleanup, { timezone: 'Asia/Kolkata' });
}

module.exports = { scheduleDailyCleanup, runCleanup };



================================================
FILE: backend/src/middleware/auth.js
================================================
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };



================================================
FILE: backend/src/middleware/chatRateLimit.js
================================================
// Simple in-memory sliding-window limiter, scoped to this single-instance hobby
// deployment - protects the free Gemini quota from being drained by one abusive client.
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 8;

const hits = new Map();

function chatRateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const timestamps = (hits.get(key) || []).filter((t) => t > windowStart);
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ message: "You're sending messages too fast. Wait a bit and try again." });
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  next();
}

module.exports = chatRateLimit;



================================================
FILE: backend/src/models/DelayReport.js
================================================
const mongoose = require('mongoose');
const voteSchema = require('./voteSchema');

const delayReportSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, trim: true },
  journeyDate: { type: String, required: true, trim: true }, // "YYYY-MM-DD"
  reason: { type: String, required: true, trim: true, maxlength: 300 },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  votedBy: { type: [voteSchema], default: [] },
}, { timestamps: { createdAt: true, updatedAt: false } });

delayReportSchema.index({ trainNumber: 1, journeyDate: 1 });

module.exports = mongoose.model('DelayReport', delayReportSchema);



================================================
FILE: backend/src/models/JourneyExperience.js
================================================
const mongoose = require('mongoose');

const journeyExperienceSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, trim: true },
  cleanliness: { type: Number, required: true, min: 1, max: 5 },
  food: { type: Number, required: true, min: 1, max: 5 },
  staffBehaviour: { type: Number, required: true, min: 1, max: 5 },
  punctuality: { type: Number, required: true, min: 1, max: 5 },
  safety: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 300, default: '' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// One rating per user per train - resubmitting updates the existing rating (upsert)
// instead of creating a duplicate, so this doubles as its own anti-spam limit.
journeyExperienceSchema.index({ trainNumber: 1, reportedBy: 1 }, { unique: true });

module.exports = mongoose.model('JourneyExperience', journeyExperienceSchema);



================================================
FILE: backend/src/models/LiveStatusUpdate.js
================================================
const mongoose = require('mongoose');
const voteSchema = require('./voteSchema');

const liveStatusUpdateSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, trim: true },
  journeyDate: { type: String, required: true, trim: true }, // "YYYY-MM-DD"
  stationName: { type: String, required: true, trim: true },
  platformNumber: { type: String, trim: true, maxlength: 10 },
  message: { type: String, required: true, trim: true, maxlength: 300 },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  votedBy: { type: [voteSchema], default: [] },
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

liveStatusUpdateSchema.index({ trainNumber: 1, journeyDate: 1, timestamp: -1 });

module.exports = mongoose.model('LiveStatusUpdate', liveStatusUpdateSchema);



================================================
FILE: backend/src/models/TatkalExperience.js
================================================
const mongoose = require('mongoose');

const tatkalExperienceSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, trim: true },
  seatCategory: { type: String, required: true, enum: ['AC', 'Sleeper'] },
  estimatedMinutesToSellOut: { type: Number, required: true, min: 0, max: 180 },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

tatkalExperienceSchema.index({ trainNumber: 1, seatCategory: 1 });

module.exports = mongoose.model('TatkalExperience', tatkalExperienceSchema);



================================================
FILE: backend/src/models/Train.js
================================================
const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  stationName: { type: String, required: true, trim: true },
  stationCode: { type: String, required: true, trim: true, uppercase: true },
}, { _id: false });

const stopSchema = new mongoose.Schema({
  stationName: { type: String, required: true, trim: true },
  stationCode: { type: String, required: true, trim: true, uppercase: true },
  distanceKm: { type: Number, required: true },
  dayOfJourney: { type: Number, required: true, default: 1 },
  sequence: { type: Number, required: true },
  // "HH:MM" 24h, estimated from distance/avg-speed — null at origin (no arrival) / terminus (no departure)
  arrivalTime: { type: String, default: null },
  departureTime: { type: String, default: null },
}, { _id: false });

const trainSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, unique: true, trim: true },
  trainName: { type: String, required: true, trim: true },
  origin: { type: stationSchema, required: true },
  destination: { type: stationSchema, required: true },
  stops: { type: [stopSchema], default: [] },
}, { timestamps: { createdAt: true, updatedAt: false } });

trainSchema.index({ trainName: 'text' });

module.exports = mongoose.model('Train', trainSchema);



================================================
FILE: backend/src/models/User.js
================================================
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['guest', 'user', 'moderator', 'admin'],
    default: 'user',
  },
  bio: { type: String, default: '', trim: true, maxlength: 200 },
  avatar: { type: String, default: '' },
  links: {
    type: [{ type: String, trim: true, maxlength: 200 }],
    default: [],
    validate: { validator: (v) => v.length <= 10, message: 'You can add up to 10 links' },
  },
  phone: { type: String, default: '', trim: true, maxlength: 15 },
  homeStation: { type: String, default: '', trim: true, maxlength: 100 },
  reputationScore: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false },
  refreshToken: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationTokenExpires: { type: Date, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('User', userSchema);



================================================
FILE: backend/src/models/voteSchema.js
================================================
const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  voteType: { type: String, enum: ['up', 'down'], required: true },
}, { _id: false });

module.exports = voteSchema;



================================================
FILE: backend/src/routes/adminRoutes.js
================================================
const express = require('express');
const {
  getOverview,
  listDelayReports,
  deleteDelayReport,
  listLiveStatus,
  deleteLiveStatus,
  listOnlineUsers,
  listUsers,
  toggleBan,
} = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Every route below requires a real 'admin' role, checked server-side off the JWT -
// not just a frontend email check, since these routes can delete data and ban users.
router.use(verifyToken, requireRole('admin'));

router.get('/overview', getOverview);
router.get('/delay-reports', listDelayReports);
router.delete('/delay-reports/:id', deleteDelayReport);
router.get('/live-status', listLiveStatus);
router.delete('/live-status/:id', deleteLiveStatus);
router.get('/online-users', listOnlineUsers);
router.get('/users', listUsers);
router.patch('/users/:id/ban', toggleBan);

module.exports = router;



================================================
FILE: backend/src/routes/authRoutes.js
================================================
const express = require('express');
const { register, login, refresh, verifyEmail, resendVerification } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

module.exports = router;



================================================
FILE: backend/src/routes/chatRoutes.js
================================================
const express = require('express');
const { chat } = require('../controllers/chatController');
const chatRateLimit = require('../middleware/chatRateLimit');

const router = express.Router();

router.post('/', chatRateLimit, chat);

module.exports = router;



================================================
FILE: backend/src/routes/delayReportRoutes.js
================================================
const express = require('express');
const { getQuota, listReports, createReport, voteReport } = require('../controllers/delayReportController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Must come before '/:train' or Express would match "quota" as a train number.
router.get('/quota', verifyToken, getQuota);
router.get('/:train', listReports);
router.post('/', verifyToken, createReport);
router.post('/:id/vote', verifyToken, voteReport);

module.exports = router;



================================================
FILE: backend/src/routes/healthRoutes.js
================================================
const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Temporary route to sanity-check auth + RBAC middleware during Step 1
router.get('/admin-only', verifyToken, requireRole('admin'), (req, res) => {
  res.json({ message: `Hello admin ${req.user.userId}` });
});

module.exports = router;



================================================
FILE: backend/src/routes/journeyExperienceRoutes.js
================================================
const express = require('express');
const { getInsight, getMine, submitExperience } = require('../controllers/journeyExperienceController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:train/mine', verifyToken, getMine);
router.get('/:train', getInsight);
router.post('/', verifyToken, submitExperience);

module.exports = router;



================================================
FILE: backend/src/routes/liveStatusRoutes.js
================================================
const express = require('express');
const { getQuota, listUpdates, createUpdate, voteUpdate } = require('../controllers/liveStatusController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Must come before '/:train' or Express would match "quota" as a train number.
router.get('/quota', verifyToken, getQuota);
router.get('/:train', listUpdates);
router.post('/', verifyToken, createUpdate);
router.post('/:id/vote', verifyToken, voteUpdate);

module.exports = router;



================================================
FILE: backend/src/routes/tatkalExperienceRoutes.js
================================================
const express = require('express');
const { getInsight, submitExperience } = require('../controllers/tatkalExperienceController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:train', getInsight);
router.post('/', verifyToken, submitExperience);

module.exports = router;



================================================
FILE: backend/src/routes/trainRoutes.js
================================================
const express = require('express');
const { searchTrains, getTrainByNumber, searchStations, searchByRoute } = require('../controllers/trainController');

const router = express.Router();

router.get('/search', searchTrains);
router.get('/stations/search', searchStations);
router.get('/route', searchByRoute);
router.get('/:trainNumber', getTrainByNumber);

module.exports = router;



================================================
FILE: backend/src/routes/userRoutes.js
================================================
const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { getMe, updateMe } = require('../controllers/userController');

const router = express.Router();

router.get('/me', verifyToken, getMe);
router.patch('/me', verifyToken, updateMe);

module.exports = router;



================================================
FILE: backend/src/seed/importTrains.js
================================================
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Train = require('../models/Train');
const rows = require('./data/irctcTrains2016.json');

// Sourced from datameet/railways (CC0), a 2016 snapshot of real Indian Railways
// train numbers/names/routes. No per-station stop schedule was reliable enough to
// import (spot-checked and found corrupted - see project notes), so each imported
// train only has its real origin and destination as stops, with real departure/
// arrival times and distance. Hand-curated trains (seedTrains.js) keep their full
// multi-stop timelines and are never overwritten by this import.
function dayOfJourneyForArrival(departure, durationMinutes) {
  const [h, m] = departure.split(':').map(Number);
  const departureMinutes = h * 60 + m;
  return 1 + Math.floor((departureMinutes + durationMinutes) / 1440);
}

async function importTrains() {
  await connectDB();

  const existingNumbers = new Set(await Train.distinct('trainNumber'));
  const seen = new Set();
  const docs = [];

  for (const row of rows) {
    if (existingNumbers.has(row.trainNumber) || seen.has(row.trainNumber)) continue;
    seen.add(row.trainNumber);

    docs.push({
      trainNumber: row.trainNumber,
      trainName: row.trainName,
      origin: { stationName: row.fromName, stationCode: row.fromCode },
      destination: { stationName: row.toName, stationCode: row.toCode },
      stops: [
        {
          sequence: 1,
          stationName: row.fromName,
          stationCode: row.fromCode,
          distanceKm: 0,
          dayOfJourney: 1,
          arrivalTime: null,
          departureTime: row.departure,
        },
        {
          sequence: 2,
          stationName: row.toName,
          stationCode: row.toCode,
          distanceKm: row.distanceKm,
          dayOfJourney: dayOfJourneyForArrival(row.departure, row.durationMinutes),
          arrivalTime: row.arrival,
          departureTime: null,
        },
      ],
    });
  }

  if (docs.length) {
    await Train.insertMany(docs, { ordered: false });
  }

  console.log(`Imported ${docs.length} trains (skipped ${rows.length - docs.length} already present).`);
  await mongoose.disconnect();
}

importTrains().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});



================================================
FILE: backend/src/seed/seedTrains.js
================================================
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Train = require('../models/Train');

// No real timetable data available; times are estimated from an average speed per
// train category plus a fixed halt at each intermediate stop, not scraped/real IRCTC data.
function classify(trainName) {
  const n = trainName.toLowerCase();
  if (n.includes('vande bharat')) return { speedKmph: 90, haltMin: 2 };
  if (n.includes('rajdhani')) return { speedKmph: 85, haltMin: 3 };
  if (n.includes('shatabdi')) return { speedKmph: 85, haltMin: 2 };
  if (n.includes('duronto')) return { speedKmph: 80, haltMin: 2 };
  if (n.includes('garib rath')) return { speedKmph: 70, haltMin: 4 };
  if (n.includes('jan shatabdi') || n.includes('intercity')) return { speedKmph: 65, haltMin: 3 };
  return { speedKmph: 55, haltMin: 5 }; // Mail/Express and everything else
}

// Deterministic per-train origin departure time so re-seeding is reproducible.
function originDepartureMinutes(trainNumber) {
  const num = parseInt(trainNumber, 10) || 0;
  const hour = (num % 20) + 4; // 04:00 - 23:xx
  const minute = (Math.round(((num * 7) % 60) / 5) * 5) % 60;
  return hour * 60 + minute;
}

function formatClock(totalMinutes) {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function train(trainNumber, trainName, routeStops) {
  const { speedKmph, haltMin } = classify(trainName);
  const originMinutes = originDepartureMinutes(trainNumber);
  let runningHalt = 0;

  const stops = routeStops.map(([stationName, stationCode, distanceKm], i) => {
    const isOrigin = i === 0;
    const isLast = i === routeStops.length - 1;
    const travelMinutes = Math.round((distanceKm / speedKmph) * 60);
    const elapsed = isOrigin ? 0 : travelMinutes + runningHalt;
    const arrivalTime = isOrigin ? null : formatClock(originMinutes + elapsed);
    const departureTime = isLast ? null : formatClock(originMinutes + elapsed + (isOrigin ? 0 : haltMin));

    if (!isOrigin && !isLast) runningHalt += haltMin;

    return {
      sequence: i + 1,
      stationName,
      stationCode: stationCode.toUpperCase(),
      distanceKm,
      dayOfJourney: 1 + Math.floor((originMinutes + elapsed) / 1440),
      arrivalTime,
      departureTime,
    };
  });
  return {
    trainNumber,
    trainName,
    origin: { stationName: stops[0].stationName, stationCode: stops[0].stationCode },
    destination: { stationName: stops[stops.length - 1].stationName, stationCode: stops[stops.length - 1].stationCode },
    stops,
  };
}

// Defines one route in the "up" direction; auto-generates the reverse "down" train
// by reversing stop order and recomputing distances from the new origin.
function pair(numUp, numDown, name, routeStops) {
  const total = routeStops[routeStops.length - 1][2];
  const downStops = [...routeStops].reverse().map(([n, c, km]) => [n, c, total - km]);
  return [train(numUp, name, routeStops), train(numDown, name, downStops)];
}

const routePairs = [
  // Rajdhani Express
  pair('12301', '12302', 'Howrah Rajdhani Express', [
    ['Howrah Jn', 'HWH', 0], ['Dhanbad Jn', 'DHN', 259], ['Gaya Jn', 'GAYA', 470],
    ['Pt Deen Dayal Upadhyaya Jn', 'DDU', 610], ['Kanpur Central', 'CNB', 1000], ['New Delhi', 'NDLS', 1447],
  ]),
  pair('12951', '12952', 'Mumbai Rajdhani Express', [
    ['Mumbai Central', 'MMCT', 0], ['Surat', 'ST', 263], ['Vadodara Jn', 'BRC', 392],
    ['Ratlam Jn', 'RTM', 691], ['Kota Jn', 'KOTA', 939], ['New Delhi', 'NDLS', 1384],
  ]),
  pair('12953', '12954', 'August Kranti Rajdhani Express', [
    ['Mumbai Central', 'MMCT', 0], ['Surat', 'ST', 263], ['Vadodara Jn', 'BRC', 392],
    ['Kota Jn', 'KOTA', 939], ['Hazrat Nizamuddin', 'NZM', 1384],
  ]),
  pair('12309', '12310', 'Rajendra Nagar Rajdhani Express', [
    ['Rajendra Nagar Terminal', 'RJPB', 0], ['Danapur', 'DNR', 10], ['Buxar', 'BXR', 110],
    ['Pt Deen Dayal Upadhyaya Jn', 'DDU', 225], ['Kanpur Central', 'CNB', 615], ['New Delhi', 'NDLS', 995],
  ]),
  pair('12313', '12314', 'Sealdah Rajdhani Express', [
    ['Sealdah', 'SDAH', 0], ['Asansol Jn', 'ASN', 215], ['Dhanbad Jn', 'DHN', 280],
    ['Gaya Jn', 'GAYA', 491], ['Kanpur Central', 'CNB', 1021], ['New Delhi', 'NDLS', 1447],
  ]),
  pair('12423', '12424', 'Dibrugarh Rajdhani Express', [
    ['Dibrugarh', 'DBRG', 0], ['Guwahati', 'GHY', 480], ['New Jalpaiguri', 'NJP', 870],
    ['Patna Jn', 'PNBE', 1500], ['Kanpur Central', 'CNB', 1980], ['New Delhi', 'NDLS', 2438],
  ]),
  pair('12425', '12426', 'Jammu Rajdhani Express', [
    ['Jammu Tawi', 'JAT', 0], ['Pathankot Jn', 'PTK', 105], ['Ludhiana Jn', 'LDH', 280],
    ['Ambala Cantt', 'UMB', 400], ['New Delhi', 'NDLS', 581],
  ]),
  pair('12429', '12430', 'Bangalore Rajdhani Express', [
    ['KSR Bengaluru', 'SBC', 0], ['Guntakal Jn', 'GTL', 415], ['Secunderabad Jn', 'SC', 740],
    ['Nagpur Jn', 'NGP', 1420], ['Bhopal Jn', 'BPL', 1830], ['Hazrat Nizamuddin', 'NZM', 2365],
  ]),
  pair('12431', '12432', 'Trivandrum Rajdhani Express', [
    ['Thiruvananthapuram Central', 'TVC', 0], ['Ernakulam Jn', 'ERS', 220], ['Coimbatore Jn', 'CBE', 440],
    ['Chennai Central', 'MAS', 860], ['Nagpur Jn', 'NGP', 2100], ['Hazrat Nizamuddin', 'NZM', 3149],
  ]),
  pair('12433', '12434', 'Chennai Rajdhani Express', [
    ['Chennai Central', 'MAS', 0], ['Vijayawada Jn', 'BZA', 430], ['Nagpur Jn', 'NGP', 1180],
    ['Bhopal Jn', 'BPL', 1590], ['Hazrat Nizamuddin', 'NZM', 2180],
  ]),

  // Shatabdi Express
  pair('12001', '12002', 'Bhopal Shatabdi Express', [
    ['New Delhi', 'NDLS', 0], ['Agra Cantt', 'AGC', 188], ['Gwalior Jn', 'GWL', 307],
    ['Jhansi Jn', 'JHS', 403], ['Bhopal Jn', 'BPL', 701],
  ]),
  pair('12003', '12004', 'Lucknow Shatabdi Express', [
    ['New Delhi', 'NDLS', 0], ['Kanpur Central', 'CNB', 440], ['Lucknow Charbagh', 'LKO', 511],
  ]),
  pair('12005', '12006', 'Kalka Shatabdi Express', [
    ['New Delhi', 'NDLS', 0], ['Ambala Cantt', 'UMB', 200], ['Chandigarh', 'CDG', 245], ['Kalka', 'KLK', 296],
  ]),
  pair('12009', '12010', 'Shatabdi Express', [
    ['Mumbai Central', 'MMCT', 0], ['Surat', 'ST', 263], ['Vadodara Jn', 'BRC', 392], ['Ahmedabad Jn', 'ADI', 493],
  ]),
  pair('12027', '12028', 'Shatabdi Express', [
    ['Chennai Central', 'MAS', 0], ['Jolarpettai Jn', 'JTJ', 210], ['Bangarpet', 'BWT', 300], ['KSR Bengaluru', 'SBC', 362],
  ]),
  pair('12029', '12030', 'Swarna Shatabdi Express', [
    ['New Delhi', 'NDLS', 0], ['Ambala Cantt', 'UMB', 200], ['Ludhiana Jn', 'LDH', 310],
    ['Jalandhar City', 'JUC', 370], ['Amritsar Jn', 'ASR', 448],
  ]),

  // Duronto Express
  pair('12273', '12274', 'Howrah Duronto Express', [
    ['Howrah Jn', 'HWH', 0], ['Pt Deen Dayal Upadhyaya Jn', 'DDU', 610], ['New Delhi', 'NDLS', 1447],
  ]),
  pair('12259', '12260', 'Sealdah Duronto Express', [
    ['Sealdah', 'SDAH', 0], ['Asansol Jn', 'ASN', 215], ['Kanpur Central', 'CNB', 1021], ['New Delhi', 'NDLS', 1447],
  ]),
  pair('12283', '12284', 'Ernakulam Duronto Express', [
    ['Ernakulam Jn', 'ERS', 0], ['Coimbatore Jn', 'CBE', 220], ['Chennai Central', 'MAS', 640],
    ['Nagpur Jn', 'NGP', 1880], ['Hazrat Nizamuddin', 'NZM', 2650],
  ]),
  pair('12213', '12214', 'Yesvantpur Duronto Express', [
    ['Yesvantpur Jn', 'YPR', 0], ['Guntakal Jn', 'GTL', 415], ['Bhopal Jn', 'BPL', 1900], ['Hazrat Nizamuddin', 'NZM', 2444],
  ]),

  // Vande Bharat Express
  pair('22439', '22440', 'Vande Bharat Express', [
    ['New Delhi', 'NDLS', 0], ['Kanpur Central', 'CNB', 440], ['Prayagraj Jn', 'PRYJ', 633], ['Varanasi Jn', 'BSBS', 771],
  ]),
  pair('22435', '22436', 'Vande Bharat Express', [
    ['New Delhi', 'NDLS', 0], ['Ambala Cantt', 'UMB', 200], ['Jammu Tawi', 'JAT', 581],
    ['Shri Mata Vaishno Devi Katra', 'SVDK', 655],
  ]),
  pair('20901', '20902', 'Vande Bharat Express', [
    ['Mumbai Central', 'MMCT', 0], ['Surat', 'ST', 263], ['Vadodara Jn', 'BRC', 392],
    ['Ahmedabad Jn', 'ADI', 493], ['Gandhinagar Capital', 'GNC', 522],
  ]),
  pair('22221', '22222', 'Vande Bharat Express', [
    ['Chennai Central', 'MAS', 0], ['Jolarpettai Jn', 'JTJ', 210], ['KSR Bengaluru', 'SBC', 362], ['Mysuru Jn', 'MYS', 497],
  ]),

  // Iconic Mail / Express / Superfast
  pair('12621', '12622', 'Tamil Nadu Express', [
    ['New Delhi', 'NDLS', 0], ['Bhopal Jn', 'BPL', 701], ['Nagpur Jn', 'NGP', 1091],
    ['Vijayawada Jn', 'BZA', 1750], ['Chennai Central', 'MAS', 2180],
  ]),
  pair('12625', '12626', 'Kerala Express', [
    ['New Delhi', 'NDLS', 0], ['Bhopal Jn', 'BPL', 701], ['Nagpur Jn', 'NGP', 1091],
    ['Chennai Central', 'MAS', 2320], ['Coimbatore Jn', 'CBE', 2760], ['Thiruvananthapuram Central', 'TVC', 3043],
  ]),
  pair('12723', '12724', 'Telangana Express', [
    ['New Delhi', 'NDLS', 0], ['Gwalior Jn', 'GWL', 307], ['Bhopal Jn', 'BPL', 701],
    ['Nagpur Jn', 'NGP', 1091], ['Secunderabad Jn', 'SC', 1671],
  ]),
  pair('12137', '12138', 'Punjab Mail', [
    ['Mumbai CSMT', 'CSMT', 0], ['Vadodara Jn', 'BRC', 493], ['Kota Jn', 'KOTA', 739],
    ['New Delhi', 'NDLS', 1184], ['Ludhiana Jn', 'LDH', 1420], ['Firozpur Cantt', 'FZR', 1587],
  ]),
  pair('12615', '12616', 'Grand Trunk Express', [
    ['Hazrat Nizamuddin', 'NZM', 0], ['Bhopal Jn', 'BPL', 590], ['Nagpur Jn', 'NGP', 980],
    ['Vijayawada Jn', 'BZA', 1650], ['Chennai Central', 'MAS', 2194],
  ]),
  pair('12839', '12840', 'Howrah Chennai Mail', [
    ['Howrah Jn', 'HWH', 0], ['Bhubaneswar', 'BBS', 443], ['Visakhapatnam', 'VSKP', 873],
    ['Vijayawada Jn', 'BZA', 1103], ['Chennai Central', 'MAS', 1663],
  ]),
  pair('12859', '12860', 'Gitanjali Express', [
    ['Howrah Jn', 'HWH', 0], ['Kharagpur Jn', 'KGP', 116], ['Nagpur Jn', 'NGP', 1180],
    ['Pune Jn', 'PUNE', 1750], ['Mumbai CSMT', 'CSMT', 1968],
  ]),
  pair('12841', '12842', 'Coromandel Express', [
    ['Howrah Jn', 'HWH', 0], ['Bhubaneswar', 'BBS', 443], ['Vijayawada Jn', 'BZA', 1103], ['Chennai Central', 'MAS', 1663],
  ]),
  pair('12627', '12628', 'Karnataka Express', [
    ['New Delhi', 'NDLS', 0], ['Bhopal Jn', 'BPL', 701], ['Nagpur Jn', 'NGP', 1091],
    ['Guntakal Jn', 'GTL', 1830], ['KSR Bengaluru', 'SBC', 2444],
  ]),
  pair('12903', '12904', 'Golden Temple Mail', [
    ['Amritsar Jn', 'ASR', 0], ['New Delhi', 'NDLS', 448], ['Kota Jn', 'KOTA', 933],
    ['Vadodara Jn', 'BRC', 1434], ['Mumbai CSMT', 'CSMT', 1927],
  ]),
  pair('12925', '12926', 'Paschim Express', [
    ['Amritsar Jn', 'ASR', 0], ['New Delhi', 'NDLS', 448], ['Kota Jn', 'KOTA', 933],
    ['Vadodara Jn', 'BRC', 1434], ['Mumbai Bandra Terminus', 'BDTS', 1886],
  ]),
  pair('12123', '12124', 'Deccan Queen', [
    ['Mumbai CSMT', 'CSMT', 0], ['Lonavala', 'LNL', 128], ['Pune Jn', 'PUNE', 192],
  ]),
  pair('12049', '12050', 'Gatimaan Express', [
    ['Hazrat Nizamuddin', 'NZM', 0], ['Agra Cantt', 'AGC', 188],
  ]),
  pair('12801', '12802', 'Purushottam Express', [
    ['New Delhi', 'NDLS', 0], ['Pt Deen Dayal Upadhyaya Jn', 'DDU', 759], ['Dhanbad Jn', 'DHN', 900],
    ['Kharagpur Jn', 'KGP', 1250], ['Bhubaneswar', 'BBS', 1817],
  ]),
  pair('12639', '12640', 'Brindavan Express', [
    ['Chennai Central', 'MAS', 0], ['Jolarpettai Jn', 'JTJ', 210], ['KSR Bengaluru', 'SBC', 362],
  ]),
  pair('12695', '12696', 'Kovai Express', [
    ['Chennai Central', 'MAS', 0], ['Salem Jn', 'SA', 340], ['Erode Jn', 'ED', 400], ['Coimbatore Jn', 'CBE', 497],
  ]),
  pair('12633', '12634', 'Vaigai Express', [
    ['Chennai Central', 'MAS', 0], ['Tiruchirapalli Jn', 'TPJ', 330], ['Madurai Jn', 'MDU', 444],
  ]),
  pair('16127', '16128', 'Chennai Trivandrum Mail', [
    ['Chennai Central', 'MAS', 0], ['Coimbatore Jn', 'CBE', 497], ['Ernakulam Jn', 'ERS', 650],
    ['Thiruvananthapuram Central', 'TVC', 726],
  ]),
  pair('19019', '19020', 'Dehradun Express', [
    ['Mumbai Bandra Terminus', 'BDTS', 0], ['Vadodara Jn', 'BRC', 493], ['Kota Jn', 'KOTA', 739],
    ['New Delhi', 'NDLS', 1184], ['Haridwar Jn', 'HW', 1420], ['Dehradun', 'DDN', 1508],
  ]),
  pair('12471', '12472', 'Swaraj Express', [
    ['Mumbai Bandra Terminus', 'BDTS', 0], ['Vadodara Jn', 'BRC', 493], ['Kota Jn', 'KOTA', 933],
    ['New Delhi', 'NDLS', 1438], ['Amritsar Jn', 'ASR', 1886],
  ]),
  pair('12875', '12876', 'Neelachal Express', [
    ['New Delhi', 'NDLS', 0], ['Pt Deen Dayal Upadhyaya Jn', 'DDU', 759], ['Kharagpur Jn', 'KGP', 1250],
    ['Bhubaneswar', 'BBS', 1817], ['Puri', 'PURI', 1837],
  ]),
  pair('12295', '12296', 'Sanghamitra Express', [
    ['KSR Bengaluru', 'SBC', 0], ['Guntakal Jn', 'GTL', 415], ['Secunderabad Jn', 'SC', 740],
    ['Nagpur Jn', 'NGP', 1420], ['Gaya Jn', 'GAYA', 1950], ['Patna Jn', 'PNBE', 2098],
  ]),
  pair('12649', '12650', 'Karnataka Sampark Kranti Express', [
    ['KSR Bengaluru', 'SBC', 0], ['Guntakal Jn', 'GTL', 415], ['Secunderabad Jn', 'SC', 740],
    ['Bhopal Jn', 'BPL', 1830], ['Hazrat Nizamuddin', 'NZM', 2365],
  ]),
  pair('10103', '10104', 'Mandovi Express', [
    ['Mumbai CSMT', 'CSMT', 0], ['Ratnagiri', 'RN', 354], ['Madgaon Jn', 'MAO', 581],
  ]),
  pair('12051', '12052', 'Jan Shatabdi Express', [
    ['Mumbai CSMT', 'CSMT', 0], ['Panvel Jn', 'PNVL', 60], ['Ratnagiri', 'RN', 354], ['Madgaon Jn', 'MAO', 581],
  ]),
  pair('11301', '11302', 'Udyan Express', [
    ['Mumbai CSMT', 'CSMT', 0], ['Pune Jn', 'PUNE', 192], ['Guntakal Jn', 'GTL', 700], ['KSR Bengaluru', 'SBC', 1180],
  ]),
];

// Trains with real published stop-level timings (verified against public timetables),
// unlike routePairs above where times are computed estimates. Built directly rather
// than via train()/pair() so the real arrival/departure/day values aren't overwritten
// by the speed-based estimator.
function realTrain(trainNumber, trainName, stops) {
  const stopDocs = stops.map(([stationName, stationCode, distanceKm, dayOfJourney, arrivalTime, departureTime], i) => ({
    sequence: i + 1,
    stationName,
    stationCode: stationCode.toUpperCase(),
    distanceKm,
    dayOfJourney,
    arrivalTime,
    departureTime,
  }));
  return {
    trainNumber,
    trainName,
    origin: { stationName: stopDocs[0].stationName, stationCode: stopDocs[0].stationCode },
    destination: { stationName: stopDocs[stopDocs.length - 1].stationName, stationCode: stopDocs[stopDocs.length - 1].stationCode },
    stops: stopDocs,
  };
}

const realTrains = [
  realTrain('13173', 'Kanchanjungha Express', [
    ['Kolkata Sealdah', 'SDAH', 0, 1, null, '06:50'],
    ['New Jalpaiguri', 'NJP', 567, 1, '17:55', '18:05'],
    ['Guwahati', 'GHY', 975, 2, '02:40', '02:50'],
    ['Lumding Jn', 'LMG', 1156, 2, '06:20', '06:35'],
    ['Badarpur Jn', 'BPB', 1325, 2, '12:10', '12:20'],
    ['Agartala', 'AGTL', 1546, 2, '17:25', '17:40'],
    ['Sabroom', 'SBRM', 1659, 2, '21:10', null],
  ]),
  realTrain('13174', 'Kanchanjungha Express', [
    ['Sabroom', 'SBRM', 0, 1, null, '06:10'],
    ['Agartala', 'AGTL', 113, 1, '07:50', '08:05'],
    ['Badarpur Jn', 'BPB', 334, 1, '12:50', '13:00'],
    ['Lumding Jn', 'LMG', 503, 1, '18:20', '18:35'],
    ['Guwahati', 'GHY', 684, 1, '22:25', '22:35'],
    ['New Jalpaiguri', 'NJP', 1092, 2, '07:25', '07:35'],
    ['Kolkata Sealdah', 'SDAH', 1659, 2, '19:20', null],
  ]),
];

const trains = [...routePairs.flat(), ...realTrains];

async function seed() {
  await connectDB();
  await Train.deleteMany({});
  await Train.insertMany(trains);
  console.log(`Seeded ${trains.length} trains.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});



================================================
FILE: backend/src/services/chatTools.js
================================================
const Train = require('../models/Train');
const DelayReport = require('../models/DelayReport');
const LiveStatusUpdate = require('../models/LiveStatusUpdate');
const JourneyExperience = require('../models/JourneyExperience');
const TatkalExperience = require('../models/TatkalExperience');
const CITY_ALIASES = require('../data/cityAliases');
const { todayIST } = require('../utils/dateUtils');

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function nowIST() {
  return new Date(Date.now() + IST_OFFSET_MS);
}

// Same rule TrainSearch.jsx uses client-side: Tatkal opens daily at a fixed IST clock
// hour, one day before the journey - next occurrence is today if not yet passed, else tomorrow.
function nextISTClockTime(hour) {
  const shiftedNow = nowIST();
  const shiftedNext = new Date(shiftedNow);
  shiftedNext.setUTCHours(hour, 0, 0, 0);
  if (shiftedNext <= shiftedNow) shiftedNext.setUTCDate(shiftedNext.getUTCDate() + 1);
  return new Date(shiftedNext.getTime() - IST_OFFSET_MS);
}

function formatIST(date) {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function searchTrains({ query }) {
  const q = (query || '').trim();
  if (!q) return { results: [] };
  const regex = new RegExp(q, 'i');
  const trains = await Train.find({ $or: [{ trainNumber: regex }, { trainName: regex }] })
    .select('trainNumber trainName origin destination')
    .limit(8)
    .lean();
  return { results: trains };
}

async function getTrainDetails({ trainNumber }) {
  const train = await Train.findOne({ trainNumber: (trainNumber || '').trim() }).lean();
  if (!train) return { found: false };

  const acOpening = nextISTClockTime(10);
  const slOpening = nextISTClockTime(11);

  return {
    found: true,
    trainNumber: train.trainNumber,
    trainName: train.trainName,
    origin: train.origin,
    destination: train.destination,
    totalStops: train.stops.length,
    stops: train.stops.map((s) => ({
      stationName: s.stationName,
      stationCode: s.stationCode,
      arrivalTime: s.arrivalTime,
      departureTime: s.departureTime,
      dayOfJourney: s.dayOfJourney,
    })),
    tatkal: {
      opensFromStation: train.origin.stationName,
      oneDayBeforeJourney: true,
      acAndExecutiveOpensAt: formatIST(acOpening),
      sleeperAndSecondSittingOpensAt: formatIST(slOpening),
    },
  };
}

// Shared by the search_stations tool and the free-text from/to args of search_route,
// so the model can resolve a city/station name to code(s) without a separate tool round-trip.
async function resolveStationCodes(query) {
  const q = (query || '').trim();
  if (!q) return [];

  const regex = new RegExp(q, 'i');
  const nameOrCodeMatches = await Train.aggregate([
    { $unwind: '$stops' },
    { $match: { $or: [{ 'stops.stationName': regex }, { 'stops.stationCode': regex }] } },
    { $group: { _id: '$stops.stationCode', stationName: { $first: '$stops.stationName' } } },
    { $project: { _id: 0, stationCode: '$_id', stationName: 1 } },
    { $limit: 10 },
  ]);

  const normalizedQuery = q.toLowerCase().replace(/\s+/g, '');
  const cityKey = Object.keys(CITY_ALIASES).find(
    (city) => city.startsWith(normalizedQuery) || normalizedQuery.startsWith(city)
  );
  let cityMatches = [];
  if (cityKey) {
    cityMatches = await Train.aggregate([
      { $unwind: '$stops' },
      { $match: { 'stops.stationCode': { $in: CITY_ALIASES[cityKey] } } },
      { $group: { _id: '$stops.stationCode', stationName: { $first: '$stops.stationName' } } },
      { $project: { _id: 0, stationCode: '$_id', stationName: 1 } },
    ]);
  }

  const seen = new Set();
  return [...cityMatches, ...nameOrCodeMatches].filter((s) => {
    if (seen.has(s.stationCode)) return false;
    seen.add(s.stationCode);
    return true;
  });
}

async function searchStations({ query }) {
  const results = await resolveStationCodes(query);
  return { results: results.slice(0, 10) };
}

function toAbsoluteMinutes(dayOfJourney, time) {
  const [h, m] = time.split(':').map(Number);
  return (dayOfJourney - 1) * 1440 + h * 60 + m;
}

async function findDirectTrains(from, to) {
  const trains = await Train.find({
    'stops.stationCode': from,
    $and: [{ 'stops.stationCode': to }],
  }).select('trainNumber trainName stops').lean();

  return trains
    .map((t) => {
      const fromStop = t.stops.find((s) => s.stationCode === from);
      const toStop = t.stops.find((s) => s.stationCode === to);
      if (!fromStop || !toStop || fromStop.sequence >= toStop.sequence) return null;
      return {
        trainNumber: t.trainNumber,
        trainName: t.trainName,
        departureTime: fromStop.departureTime,
        arrivalTime: toStop.arrivalTime,
        durationMinutes:
          toAbsoluteMinutes(toStop.dayOfJourney, toStop.arrivalTime) -
          toAbsoluteMinutes(fromStop.dayOfJourney, fromStop.departureTime),
      };
    })
    .filter(Boolean);
}

// Accepts free-text city/station names or codes directly (e.g. "Delhi", "Mumbai") and
// resolves them itself - one tool call instead of the model chaining a station lookup
// before the route search, which was the main source of extra latency on these queries.
async function searchRoute({ from, to }) {
  const [fromStations, toStations] = await Promise.all([resolveStationCodes(from), resolveStationCodes(to)]);
  if (!fromStations.length || !toStations.length) {
    return {
      results: [],
      note: !fromStations.length && !toStations.length
        ? `Could not resolve either "${from}" or "${to}" to a known station.`
        : !fromStations.length
          ? `Could not resolve "${from}" to a known station.`
          : `Could not resolve "${to}" to a known station.`,
    };
  }

  const pairs = [];
  for (const f of fromStations.slice(0, 5)) {
    for (const t of toStations.slice(0, 5)) {
      if (f.stationCode !== t.stationCode) pairs.push([f, t]);
    }
  }

  const batches = await Promise.all(pairs.map(([f, t]) => findDirectTrains(f.stationCode, t.stationCode)));
  const seen = new Set();
  const results = batches.flat().filter((r) => {
    if (seen.has(r.trainNumber)) return false;
    seen.add(r.trainNumber);
    return true;
  });
  results.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''));

  return {
    resolvedFrom: fromStations.slice(0, 5),
    resolvedTo: toStations.slice(0, 5),
    results: results.slice(0, 8),
  };
}

async function getDelayReports({ trainNumber }) {
  const journeyDate = todayIST();
  const reports = await DelayReport.find({ trainNumber: (trainNumber || '').trim(), journeyDate })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('reason upvotes downvotes createdAt')
    .lean();
  return { journeyDate, reports };
}

async function getLiveStatus({ trainNumber }) {
  const journeyDate = todayIST();
  const updates = await LiveStatusUpdate.find({ trainNumber: (trainNumber || '').trim(), journeyDate })
    .sort({ timestamp: -1 })
    .limit(10)
    .select('stationName platformNumber message timestamp')
    .lean();
  return { journeyDate, updates };
}

async function getJourneyExperience({ trainNumber }) {
  const RATING_FIELDS = ['cleanliness', 'food', 'staffBehaviour', 'punctuality', 'safety'];
  const groupStage = { _id: null, count: { $sum: 1 } };
  RATING_FIELDS.forEach((field) => { groupStage[field] = { $avg: `$${field}` }; });

  const [summary] = await JourneyExperience.aggregate([
    { $match: { trainNumber: (trainNumber || '').trim() } },
    { $group: groupStage },
  ]);

  if (!summary) return { hasData: false };

  const averages = { count: summary.count };
  RATING_FIELDS.forEach((field) => { averages[field] = Math.round(summary[field] * 10) / 10; });

  return { hasData: true, averages };
}

async function getTatkalExperience({ trainNumber }) {
  const rows = await TatkalExperience.aggregate([
    { $match: { trainNumber: (trainNumber || '').trim() } },
    { $group: { _id: '$seatCategory', avgMinutesToSellOut: { $avg: '$estimatedMinutesToSellOut' }, count: { $sum: 1 } } },
  ]);
  if (!rows.length) return { hasData: false };
  const insight = {};
  rows.forEach((row) => {
    insight[row._id] = { avgMinutesToSellOut: Math.round(row.avgMinutesToSellOut * 10) / 10, count: row.count };
  });
  return { hasData: true, insight };
}

const TOOL_DECLARATIONS = [
  {
    name: 'search_trains',
    description: "Search TrainMitra's database for trains by number or (partial) name.",
    parametersJsonSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Train number or name (partial match ok)' } },
      required: ['query'],
    },
  },
  {
    name: 'get_train_details',
    description: 'Get full details for one train by its exact number: origin, destination, all stops with timings, and its Tatkal booking opening times.',
    parametersJsonSchema: {
      type: 'object',
      properties: { trainNumber: { type: 'string' } },
      required: ['trainNumber'],
    },
  },
  {
    name: 'search_stations',
    description: 'Resolve a city or station name/partial name to station codes (e.g. "kolkata" -> HWH, SDAH).',
    parametersJsonSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'search_route',
    description: 'Find direct trains between two places. Pass city or station names directly (e.g. "Delhi", "Mumbai") - it resolves them itself, no need to call search_stations first.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Origin city or station name' },
        to: { type: 'string', description: 'Destination city or station name' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'get_delay_reports',
    description: "Get today's crowdsourced delay reports for a train, ranked by community votes.",
    parametersJsonSchema: {
      type: 'object',
      properties: { trainNumber: { type: 'string' } },
      required: ['trainNumber'],
    },
  },
  {
    name: 'get_live_status',
    description: "Get today's crowdsourced live location updates for a train (station, platform, passenger notes).",
    parametersJsonSchema: {
      type: 'object',
      properties: { trainNumber: { type: 'string' } },
      required: ['trainNumber'],
    },
  },
  {
    name: 'get_journey_experience',
    description: 'Get average passenger ratings for a train: cleanliness, food, staff behaviour, punctuality, safety.',
    parametersJsonSchema: {
      type: 'object',
      properties: { trainNumber: { type: 'string' } },
      required: ['trainNumber'],
    },
  },
  {
    name: 'get_tatkal_experience',
    description: 'Get crowdsourced estimates of how many minutes after Tatkal opening a train historically sells out, per seat category.',
    parametersJsonSchema: {
      type: 'object',
      properties: { trainNumber: { type: 'string' } },
      required: ['trainNumber'],
    },
  },
];

const TOOL_HANDLERS = {
  search_trains: searchTrains,
  get_train_details: getTrainDetails,
  search_stations: searchStations,
  search_route: searchRoute,
  get_delay_reports: getDelayReports,
  get_live_status: getLiveStatus,
  get_journey_experience: getJourneyExperience,
  get_tatkal_experience: getTatkalExperience,
};

async function runTool(name, args) {
  const handler = TOOL_HANDLERS[name];
  if (!handler) return { error: `Unknown tool: ${name}` };
  try {
    return await handler(args || {});
  } catch (err) {
    return { error: `Tool ${name} failed: ${err.message}` };
  }
}

module.exports = { TOOL_DECLARATIONS, runTool };



================================================
FILE: backend/src/services/geminiChat.js
================================================
const { GoogleGenAI } = require('@google/genai');
const { TOOL_DECLARATIONS, runTool } = require('./chatTools');

// flash-lite: far higher free-tier daily quota than flash, and noticeably faster per call -
// both matter here since one reply can involve several sequential model round-trips (tool calls).
const MODEL = 'gemini-3.1-flash-lite';
const MAX_TOOL_ROUNDS = 4;
const MAX_HISTORY_TURNS = 20;

let ai = null;
function client() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

const SYSTEM_INSTRUCTION = `You are the TrainMitra assistant, embedded on the TrainMitra website (a companion app for Indian Railways passengers).

TrainMitra has no official GPS feed and no real ticket-availability data from IRCTC - everything about delays, live location, and Tatkal sellout speed is crowdsourced from passengers, not fact. When you use the search_trains, get_train_details, search_stations, search_route, get_delay_reports, get_live_status, get_journey_experience or get_tatkal_experience tools, present that data as passenger reports/estimates, not as guaranteed fact. If a tool returns no data, say so plainly rather than guessing.

You can also chat about anything else the user brings up, using your own general knowledge - you are not limited to trains. Never claim to book tickets or handle payments - for actually booking, point users to IRCTC (irctc.co.in).

Be brief. This is a live chat widget, not an essay - every extra sentence is extra time the user waits and extra text they have to read. Default to 1-3 short sentences. Only use a list when the answer genuinely is a list of items (e.g. train options, delay reports), and keep each line to the essential facts - no restating the question, no closing pleasantries, no padding disclaimers beyond one brief note when it actually matters. Answer the question and stop.

Formatting: the chat UI renders plain text only, not markdown. Never use **bold**, headings, or [link](url) syntax - write links as bare URLs. For lists, use a simple "- " prefix on its own line instead of markdown bullets.

Tool use: each tool call is a slow round trip for the user. If you already know you'll need more than one (e.g. delay reports and live status for the same train), call them together in the same turn instead of one at a time.`;

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

function toGeminiHistory(history) {
  return (history || [])
    .slice(-MAX_HISTORY_TURNS)
    .filter((turn) => turn && typeof turn.text === 'string' && turn.text.trim() && (turn.role === 'user' || turn.role === 'model'))
    .map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] }));
}

async function sendChatMessage({ message, history }) {
  const chat = client().chats.create({
    model: MODEL,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      safetySettings: SAFETY_SETTINGS,
      // This is a lookup-and-answer assistant, not a reasoning task - minimal thinking
      // cuts multi-second latency per round with no real quality loss here.
      thinkingConfig: { thinkingLevel: 'LOW' },
    },
    history: toGeminiHistory(history),
  });

  let response = await chat.sendMessage({ message });

  let round = 0;
  while (response.functionCalls && response.functionCalls.length > 0 && round < MAX_TOOL_ROUNDS) {
    const calls = response.functionCalls;
    const results = await Promise.all(calls.map((call) => runTool(call.name, call.args)));
    const responseParts = calls.map((call, i) => ({ functionResponse: { name: call.name, response: results[i] } }));
    response = await chat.sendMessage({ message: responseParts });
    round += 1;
  }

  return response.text || "Sorry, I couldn't come up with a reply to that.";
}

module.exports = { sendChatMessage };



================================================
FILE: backend/src/utils/dateUtils.js
================================================
// Indian Railways app - "today" always means the current date in India (IST, UTC+5:30),
// regardless of what timezone the server itself happens to run in.
function todayIST() {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const shifted = new Date(Date.now() + IST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

module.exports = { todayIST };



================================================
FILE: backend/src/utils/email.js
================================================
const { Resend } = require('resend');

let resend;
function getResendClient() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

async function sendVerificationEmail(user, token) {
  const verifyUrl = `${process.env.CLIENT_ORIGIN}/verify-email?token=${token}`;

  await getResendClient().emails.send({
    from: process.env.EMAIL_FROM || 'TrainMitra <onboarding@resend.dev>',
    to: user.email,
    subject: 'Verify your TrainMitra account',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #ea580c;">Welcome to TrainMitra, ${user.name}!</h2>
        <p>Confirm your email address to activate your account.</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block; background:#ea580c; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            Verify email
          </a>
        </p>
        <p style="color:#64748b; font-size:13px;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };



================================================
FILE: backend/src/utils/generateTokens.js
================================================
const jwt = require('jsonwebtoken');

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
}

module.exports = { generateAccessToken, generateRefreshToken };



================================================
FILE: backend/src/utils/moderation.js
================================================
const DAILY_DELAY_REPORT_LIMIT = 10;
const DAILY_LIVE_STATUS_LIMIT = 10;
const DOWNVOTE_BLOCK_THRESHOLD = 10;

// Lazily required to avoid a require cycle (models don't need this file).
function models() {
  return {
    DelayReport: require('../models/DelayReport'),
    LiveStatusUpdate: require('../models/LiveStatusUpdate'),
  };
}

// A single post that collects too many "false"/dislike votes blocks that user from
// posting *anything* (either type) for the rest of the day - same-day only, since it's
// scoped to journeyDate which is always today; the daily wipe clears the slate tomorrow.
async function isBlockedToday(userId, journeyDate) {
  const { DelayReport, LiveStatusUpdate } = models();
  const [badReport, badUpdate] = await Promise.all([
    DelayReport.exists({ reportedBy: userId, journeyDate, downvotes: { $gt: DOWNVOTE_BLOCK_THRESHOLD } }),
    LiveStatusUpdate.exists({ reportedBy: userId, journeyDate, downvotes: { $gt: DOWNVOTE_BLOCK_THRESHOLD } }),
  ]);
  return Boolean(badReport || badUpdate);
}

async function getDelayReportUsage(userId, journeyDate) {
  const { DelayReport } = models();
  const used = await DelayReport.countDocuments({ reportedBy: userId, journeyDate });
  return { used, limit: DAILY_DELAY_REPORT_LIMIT, remaining: Math.max(0, DAILY_DELAY_REPORT_LIMIT - used) };
}

async function getLiveStatusUsage(userId, journeyDate) {
  const { LiveStatusUpdate } = models();
  const used = await LiveStatusUpdate.countDocuments({ reportedBy: userId, journeyDate });
  return { used, limit: DAILY_LIVE_STATUS_LIMIT, remaining: Math.max(0, DAILY_LIVE_STATUS_LIMIT - used) };
}

async function hasReachedDelayReportLimit(userId, journeyDate) {
  const { remaining } = await getDelayReportUsage(userId, journeyDate);
  return remaining <= 0;
}

async function hasReachedLiveStatusLimit(userId, journeyDate) {
  const { remaining } = await getLiveStatusUsage(userId, journeyDate);
  return remaining <= 0;
}

module.exports = {
  DAILY_DELAY_REPORT_LIMIT,
  DAILY_LIVE_STATUS_LIMIT,
  DOWNVOTE_BLOCK_THRESHOLD,
  isBlockedToday,
  getDelayReportUsage,
  getLiveStatusUsage,
  hasReachedDelayReportLimit,
  hasReachedLiveStatusLimit,
};



================================================
FILE: backend/src/utils/reputation.js
================================================
const User = require('../models/User');

// Net upvotes a user needs (across all their delay reports/live status updates,
// accumulated over time) before the UI marks them as a trusted contributor.
const TRUSTED_REPUTATION_THRESHOLD = 15;

// Delay reports/live status updates are wiped daily (see dailyCleanup.js), so a vote's
// effect can't be recomputed from history later - it has to be applied to the author's
// persistent User.reputationScore at the moment the vote happens. Self-votes are
// deliberately excluded: self-voting is allowed on your own posts (an earlier product
// decision), but letting that also move your own reputation would make the "track
// record" signal trivially farmable with your daily report quota.
async function applyReputationDelta(authorId, voterId, delta) {
  if (!delta || String(authorId) === String(voterId)) return;
  await User.findByIdAndUpdate(authorId, { $inc: { reputationScore: delta } });
}

module.exports = { TRUSTED_REPUTATION_THRESHOLD, applyReputationDelta };



================================================
FILE: docs/PROJECT_SPEC.md
================================================
# Project Spec: Crowdsourced Train Status & Tatkal Tracker

(Working name: "TrainMitra")

Source-of-truth spec for this build, copied from the original brief so it lives in the repo alongside the code.

## 1. The Problem This Solves

Indian train passengers have no good way to:

- Know *why* their train is delayed (official reasons are vague or unavailable)
- Get real-time crowd-reported status updates from fellow passengers
- Know the exact Tatkal booking opening time for a specific train (this depends on the train's origin station, which most passengers don't know off-hand)
- Get a sense of how fast Tatkal tickets usually sell out for a given train/category, based on community experience

This app solves all four with a MERN + Socket.io stack, entirely using free, self-owned, or crowdsourced data — no paid or restricted APIs required.

## 2. Important Honest Scope Notes (read before building)

- **Live GPS train tracking is NOT feasible.** That data comes from Indian Railways' internal NTES system with no free public API. We deliberately do NOT attempt to replicate real GPS tracking. Instead, we use crowdsourced passenger reports ("I just arrived at station X") — a legitimate, different engineering approach (Waze-style), not a workaround.
- **Real ticket-availability prediction is NOT feasible either** — IRCTC does not expose booking/availability data (current or historical) via any open API. We do NOT build a real ML prediction model. Instead, we build a "community insight" feature — crowdsourced past experiences ("Sleeper Tatkal on this train usually sells out in under a minute"), explicitly framed as opinion/experience, not a statistical prediction.
- **Tatkal opening time IS fully computable** without any live data, because it's rule-based:
  - AC classes: opens 10:00 AM, one day before the journey date (excluding the journey date itself), calculated from the train's origin station
  - Non-AC / Sleeper: opens 11:00 AM, same rule
- **Train reference data** (number, name, origin, destination, route/stops) is static public data — available via open government datasets (data.gov.in) or public Kaggle datasets of IRCTC schedules. This is a one-time seed into our own database, not a live API call.

## 3. Full Feature List

### Feature 1 — Train Lookup / Autocomplete
- User types a train number or partial name
- Debounced search (frontend) hits a backend search endpoint
- Backend uses MongoDB text index or prefix/regex search over a seeded `Trains` collection
- On selection, auto-fills: origin station, destination station, full list of stops
- This origin station value feeds directly into Feature 2 (Tatkal countdown)

### Feature 2 — Tatkal Opening Countdown
- Inputs: train number/name (via Feature 1 autocomplete) + seat category (AC / Sleeper)
- Pure logic calculation (no live data needed):
  - Determine train's origin station and journey date
  - Apply fixed rule: AC → 10:00 AM, one day before journey (from origin); Sleeper → 11:00 AM, same rule
- Live countdown timer to that exact moment
- Optionally show which classes (AC 1st/2A/3A vs Sleeper) fall under which rule

### Feature 3 — Delay Reason Reporting (Crowdsourced + Voting)
- User selects a train + date, submits a text reason for delay (e.g., "signal failure near X", "fog", "late from origin")
- Other users upvote/downvote existing reasons for that train+date
- Most-voted reason surfaces as the "community consensus" at the top
- Anti-abuse: rate-limit submissions per user per train/date, one vote per user per report
- Old reports for past dates can decay/archive via a scheduled job

### Feature 4 — Live Crowdsourced Status Updates
- Passengers currently on a train can report "arrived at station X" or "still stuck near Y" with a timestamp
- Broadcast in real time via Socket.io to everyone else viewing that train's page for that date
- This is the "why is my train late" live feed — built entirely on user reports, sidestepping the GPS data problem

### Feature 5 — Community Insight on Ticket Availability
- Users submit past experience: "Sleeper Tatkal for train X usually finishes in under 1 minute" / "AC Tatkal on this route usually has seats even after 5 minutes"
- Aggregated and displayed as community sentiment, NOT framed as a statistical prediction
- Simple aggregation (e.g., average of user-submitted "minutes until sold out" estimates) is fine — never call it "predicted probability" anywhere in the UI/copy, to stay honest about what the data actually represents

## 4. Roles & Access Control (RBAC)

| Role | Permissions |
|---|---|
| Guest | View trains, view countdowns, view reports/status (read-only) |
| Registered User | Everything Guest can do + submit delay reports, submit live status updates, vote, submit Tatkal experience data |
| Moderator | Can delete/flag spam reports, ban abusive users |
| Admin | Full access — manage train dataset, manage users/roles, view analytics dashboard |

Auth mechanism: JWT with refresh tokens. Rate-limiting tied to user ID (not just IP) to prevent spam voting/reporting.

## 5. Tech Stack

- **Frontend:** React, Tailwind CSS or Ant Design, Recharts (for any dashboard/analytics view)
- **Backend:** Node.js + Express
- **Database:** MongoDB (Atlas free tier)
- **Real-time:** Socket.io (for live status feed + live vote counts)
- **Scheduled jobs:** node-cron (simple) or BullMQ + Redis (more advanced, better resume talking point)
- **Auth:** JWT (access + refresh tokens), bcrypt for password hashing
- **Notifications (optional, later):** Nodemailer or Resend free tier for email alerts
- **Deployment:** Vercel (frontend), Render or Railway (backend), MongoDB Atlas (DB), Upstash (Redis, if using BullMQ)

## 6. Data Model (MongoDB Collections)

### Trains
```
{
  trainNumber: String (indexed, unique),
  trainName: String (text indexed),
  origin: { stationName, stationCode },
  destination: { stationName, stationCode },
  stops: [
    { stationName, stationCode, distanceKm, dayOfJourney, sequence }
  ]
}
```

### Users
```
{
  name, email (unique), passwordHash,
  role: enum [guest, user, moderator, admin],
  createdAt,
  reputationScore: Number (optional, for future anti-abuse weighting)
}
```

### DelayReports
```
{
  trainNumber, journeyDate,
  reason: String,
  reportedBy: userId,
  upvotes: Number, downvotes: Number,
  votedBy: [{ userId, voteType }],
  createdAt
}
```

### LiveStatusUpdates
```
{
  trainNumber, journeyDate,
  stationName (from that train's stops list),
  message: String,
  reportedBy: userId,
  timestamp
}
```

### TatkalExperience
```
{
  trainNumber, seatCategory: enum [AC, Sleeper],
  estimatedMinutesToSellOut: Number,
  reportedBy: userId,
  journeyDate,
  createdAt
}
```

### Votes (optional, if vote history is kept separate from the embedded array)
```
{
  userId, targetType: enum [delayReport], targetId, voteType: enum [up, down]
}
```

## 7. API Route Structure (high level)

```
GET  /api/trains/search?q=                       -> autocomplete search
GET  /api/trains/:trainNumber                     -> full train details incl. stops

GET  /api/tatkal/countdown?train=&category=&date= -> computed countdown

GET  /api/delay-reports/:train/:date              -> list, sorted by votes
POST /api/delay-reports                           -> create (auth required)
POST /api/delay-reports/:id/vote                  -> upvote/downvote (auth required)

GET  /api/live-status/:train/:date                -> recent updates
POST /api/live-status                             -> submit update (auth, broadcasts via Socket.io)

GET  /api/tatkal-experience/:train/:category       -> aggregated community estimate
POST /api/tatkal-experience                        -> submit (auth required)

POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
```

Socket.io events:
```
join_train_room      (trainNumber + date)
live_status_update    (broadcast to room)
new_delay_report / vote_updated  (broadcast to room)
```

## 8. Scheduled Jobs (Cron / BullMQ)

- Daily job: archive/decay delay reports and live status updates older than the journey date (keep DB lean, old "live" reports irrelevant)
- Daily job: recompute/cache aggregated Tatkal experience estimates per train/category (avoid recalculating on every request)

## 9. Cost Breakdown

| Component | Cost |
|---|---|
| MongoDB Atlas (free tier, 512MB) | $0 |
| Backend hosting (Render/Railway free tier) | $0 (may sleep on inactivity) |
| Frontend hosting (Vercel/Netlify) | $0 |
| Redis for BullMQ (Upstash free tier) | $0 |
| Email (Gmail SMTP / Resend free tier) | $0 |
| Domain name (optional) | ~$8–12/year |
| **Total** | **$0–12** |

## 10. Honest Resume/Interview Value Notes

This project is a strong portfolio piece: search/autocomplete with indexing, voting/ranking logic, real-time updates via Socket.io, scheduled background jobs, and RBAC. It will NOT get you hired by itself — its real value is as a strong interview talking point (why Socket.io over polling, how to prevent vote manipulation, why crowdsourced data over scraping official sources). Being able to clearly explain the scope decisions in Section 2 is itself a signal of engineering maturity.

## 11. Suggested Build Order

1. Set up MERN boilerplate + MongoDB connection + auth (JWT, roles)
2. Seed `Trains` collection with a static dataset (100–200 popular trains is enough for a demo)
3. Build train search/autocomplete (Feature 1)
4. Build Tatkal countdown logic (Feature 2) — pure logic, no dependencies on other features, good early win
5. Build delay reports + voting (Feature 3)
6. Add Socket.io + live status updates (Feature 4)
7. Add Tatkal experience aggregation (Feature 5)
8. Add admin/moderator dashboard (basic analytics, report moderation)
9. Deploy (Vercel + Render + Atlas)
10. Write a strong README with architecture diagram and the scope-limitation notes from Section 2



================================================
FILE: frontend/README.md
================================================
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh



================================================
FILE: frontend/eslint.config.js
================================================
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'dev-dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]



================================================
FILE: frontend/index.html
================================================
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TrainMitra</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>



================================================
FILE: frontend/package.json
================================================
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.19.0",
    "canvas-confetti": "^1.9.4",
    "framer-motion": "^13.1.0",
    "i18next": "^26.4.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^17.0.12",
    "react-router-dom": "^7.18.2",
    "recharts": "^3.10.1",
    "socket.io-client": "^4.8.3"
  },
  "devDependencies": {
    "@eslint/js": "^9.13.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.5.4",
    "eslint": "^9.13.0",
    "eslint-plugin-react": "^7.37.2",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.14",
    "globals": "^15.11.0",
    "postcss": "^8.5.26",
    "tailwindcss": "^3.4.19",
    "vite": "^5.4.10",
    "vite-plugin-pwa": "^1.3.0"
  }
}



================================================
FILE: frontend/postcss.config.js
================================================
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}



================================================
FILE: frontend/tailwind.config.js
================================================
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}




================================================
FILE: frontend/verify_learner_gate.mjs
================================================
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();

  // --- Case 1: logged out ---
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Learner' }).click();
  await page.waitForTimeout(300);
  const comingSoonVisible = await page.getByText('Coming soon').isVisible();
  const urlAfterClick = page.url();
  console.log('Case1 (logged out) - Coming soon visible:', comingSoonVisible, '| still on same page:', urlAfterClick === BASE + '/');

  // direct URL nav while logged out
  await page.goto(BASE + '/learner');
  await page.waitForTimeout(500);
  console.log('Case1b (logged out, direct URL) - redirected to:', page.url());

  // --- Case 2: logged in as a NON-owner ---
  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.setItem('accessToken', 'fake');
    localStorage.setItem('refreshToken', 'fake');
    localStorage.setItem('user', JSON.stringify({ email: 'someoneelse@example.com', name: 'Someone', role: 'user' }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Learner' }).click();
  await page.waitForTimeout(300);
  const comingSoon2 = await page.getByText('Coming soon').isVisible();
  console.log('Case2 (non-owner logged in) - Coming soon visible:', comingSoon2, '| url:', page.url());

  await page.goto(BASE + '/learner');
  await page.waitForTimeout(500);
  console.log('Case2b (non-owner, direct URL) - redirected to:', page.url());

  // --- Case 3: logged in as the OWNER email (simulated via localStorage) ---
  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.setItem('accessToken', 'fake');
    localStorage.setItem('refreshToken', 'fake');
    localStorage.setItem('user', JSON.stringify({ email: 'iamkaushik018@gmail.com', name: 'Kaushik', role: 'user' }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Learner' }).click();
  await page.waitForTimeout(500);
  console.log('Case3 (owner logged in) - navigated to:', page.url());

  await browser.close();
})();



================================================
FILE: frontend/vite.config.js
================================================
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Lets the service worker run against the dev server too (`npm run dev`), not
      // just a production build - otherwise offline behavior can only be tested via
      // `vite build && vite preview`.
      devOptions: { enabled: true, type: 'module' },
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'TrainMitra',
        short_name: 'TrainMitra',
        description: 'Live train delay reports, status updates, and schedules for Indian Railways passengers.',
        theme_color: '#f97316',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The main JS bundle is a single ~2.4MB chunk (pre-existing, unrelated to
        // this feature - see the "chunks larger than 500kB" build warning), which
        // exceeds Workbox's default 2MB precache limit.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Train schedule/search/route lookups are read-only GETs, so caching them
        // is safe; everything else (auth, reports, votes) is left untouched and
        // always hits the network.
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) => request.method === 'GET' && url.pathname.includes('/trains'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'train-schedules',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
  },
})



================================================
FILE: frontend/.env.example
================================================
VITE_API_BASE_URL=http://localhost:5000/api



================================================
FILE: frontend/frontend/src/socket.js
================================================
import { io } from 'socket.io-client';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const socketURL = apiBaseURL.replace(/\/api\/?$/, '');

const socket = io(socketURL, { autoConnect: true });

export default socket;



================================================
FILE: frontend/frontend/src/hooks/useTrainRoom.js
================================================
import { useEffect } from 'react';
import socket from '../socket';

export default function useTrainRoom(trainNumber, journeyDate) {
  useEffect(() => {
    if (!trainNumber || !journeyDate) return undefined;
    socket.emit('join_train_room', { trainNumber, journeyDate });
    return () => {
      socket.emit('leave_train_room', { trainNumber, journeyDate });
    };
  }, [trainNumber, journeyDate]);
}



================================================
FILE: frontend/scripts/generate_pwa_icons.py
================================================
"""One-off generator for PWA manifest icons (no logo asset exists yet).
Run: python scripts/generate_pwa_icons.py
Draws a simple white train glyph on the brand orange (#f97316) used elsewhere
in the app (see AdminDashboard.jsx's orange-500 buttons). Not meant to be
re-run as part of the build - regenerate manually if the icon design changes.
"""
from PIL import Image, ImageDraw
import os

BRAND_ORANGE = (249, 115, 22, 255)
WHITE = (255, 255, 255, 255)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)


def draw_train_glyph(draw, cx, cy, scale):
    # Simple front-on train silhouette: rounded body, two windows, two wheels.
    body_w, body_h = 60 * scale, 46 * scale
    left, top = cx - body_w / 2, cy - body_h / 2
    right, bottom = cx + body_w / 2, cy + body_h / 2

    draw.rounded_rectangle([left, top, right, bottom], radius=14 * scale, fill=WHITE)

    win_w, win_h = 16 * scale, 14 * scale
    win_y = top + 8 * scale
    draw.rounded_rectangle(
        [cx - win_w - 4 * scale, win_y, cx - 4 * scale, win_y + win_h],
        radius=3 * scale, fill=BRAND_ORANGE,
    )
    draw.rounded_rectangle(
        [cx + 4 * scale, win_y, cx + 4 * scale + win_w, win_y + win_h],
        radius=3 * scale, fill=BRAND_ORANGE,
    )

    wheel_r = 7 * scale
    wheel_y = bottom - wheel_r * 0.6
    draw.ellipse(
        [cx - body_w / 2 + 10 * scale - wheel_r, wheel_y - wheel_r, cx - body_w / 2 + 10 * scale + wheel_r, wheel_y + wheel_r],
        fill=BRAND_ORANGE,
    )
    draw.ellipse(
        [cx + body_w / 2 - 10 * scale - wheel_r, wheel_y - wheel_r, cx + body_w / 2 - 10 * scale + wheel_r, wheel_y + wheel_r],
        fill=BRAND_ORANGE,
    )


def make_icon(size, maskable=False, filename=None):
    img = Image.new("RGBA", (size, size), BRAND_ORANGE)
    draw = ImageDraw.Draw(img)

    if maskable:
        # Maskable icons get cropped to arbitrary shapes by the OS, so keep the
        # glyph inside the inner ~80% "safe zone" instead of touching the edges.
        scale = size / 100 * 0.85
    else:
        radius = size * 0.22
        draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=BRAND_ORANGE)
        scale = size / 100

    draw_train_glyph(draw, size / 2, size / 2, scale)
    img.save(os.path.join(OUT_DIR, filename))
    print(f"wrote {filename} ({size}x{size})")


make_icon(192, filename="icon-192.png")
make_icon(512, filename="icon-512.png")
make_icon(512, maskable=True, filename="icon-maskable-512.png")



================================================
FILE: frontend/src/App.jsx
================================================
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './socket';
import Navbar from './components/Navbar';
import ScrollProgress from './components/ScrollProgress';
import PageTransition from './components/PageTransition';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import TrainSearch from './pages/TrainSearch';
import About from './pages/About';
import Developer from './pages/Developer';
import Learner from './pages/Learner';
import LearnerBackend from './pages/LearnerBackend';
import LearnerFrontend from './pages/LearnerFrontend';
import WhatsNext from './pages/WhatsNext';
import AdminDashboard from './pages/AdminDashboard';
import OwnerOnlyRoute from './components/OwnerOnlyRoute';
import OfflineBanner from './components/OfflineBanner';

export default function App() {
  const location = useLocation();

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
          <Route path="/verify-email" element={<PageTransition><VerifyEmail /></PageTransition>} />
          <Route path="/trains" element={<PageTransition><TrainSearch /></PageTransition>} />
          <Route path="/about" element={<PageTransition><About /></PageTransition>} />
          <Route path="/developer" element={<PageTransition><Developer /></PageTransition>} />
          <Route path="/learner" element={<OwnerOnlyRoute><PageTransition><Learner /></PageTransition></OwnerOnlyRoute>} />
          <Route path="/learner/backend" element={<OwnerOnlyRoute><PageTransition><LearnerBackend /></PageTransition></OwnerOnlyRoute>} />
          <Route path="/learner/frontend" element={<OwnerOnlyRoute><PageTransition><LearnerFrontend /></PageTransition></OwnerOnlyRoute>} />
          <Route path="/whats-next" element={<PageTransition><WhatsNext /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      <OfflineBanner />
    </>
  );
}



================================================
FILE: frontend/src/index.css
================================================
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

@keyframes input-shimmer {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(220%);
  }
}

.animate-input-shimmer {
  animation: input-shimmer 1.6s ease-in-out infinite;
}

@keyframes ping-slow {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

.animate-ping-slow {
  animation: ping-slow 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.themed-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.5) transparent;
}

.themed-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.themed-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.themed-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.5);
  border-radius: 9999px;
}

.themed-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(148, 163, 184, 0.75);
}



================================================
FILE: frontend/src/main.jsx
================================================
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { initOfflineSync } from './offline/offlineSync.js'

initOfflineSync()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)



================================================
FILE: frontend/src/socket.js
================================================
import { io } from 'socket.io-client';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const socketURL = apiBaseURL.replace(/\/api\/?$/, '');

// `auth` as a function is re-invoked on every (re)connect attempt, so it always sends
// whatever token is currently in localStorage rather than one captured at import time.
const socket = io(socketURL, {
  autoConnect: true,
  auth: (cb) => cb({ token: localStorage.getItem('accessToken') }),
});

export default socket;



================================================
FILE: frontend/src/api/client.js
================================================
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(newAccessToken) {
  pendingQueue.forEach(({ resolve }) => resolve(newAccessToken));
  pendingQueue = [];
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push({ resolve });
        }).then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        resolveQueue(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;



================================================
FILE: frontend/src/components/AboutBadge.jsx
================================================
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { aboutSections } from '../content/aboutContent';

function InfoIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function badgeButtonClass() {
  return 'inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full pl-2.5 pr-3.5 py-1.5 shadow-lg shadow-black/20 border border-white/10 whitespace-nowrap hover:bg-slate-900/95 transition-colors';
}

function BadgeLabel() {
  return (
    <>
      <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-sky-400/20 text-sky-300">
        <InfoIcon />
      </span>
      <span className="text-xs font-semibold text-slate-200">About TrainMitra</span>
    </>
  );
}

function hasHoverSupport() {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

const PANEL_MAX_WIDTH = 368; // ~23rem
const VIEWPORT_MARGIN = 16;

export default function AboutBadge({ className = '' }) {
  const [canHover] = useState(hasHoverSupport);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!canHover) return undefined;
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [canHover]);

  useLayoutEffect(() => {
    if (!canHover || !open || !buttonRef.current) return undefined;

    function reposition() {
      const rect = buttonRef.current.getBoundingClientRect();
      const width = Math.min(PANEL_MAX_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
      const idealLeft = rect.left + rect.width / 2 - width / 2;
      const left = Math.max(VIEWPORT_MARGIN, Math.min(idealLeft, window.innerWidth - width - VIEWPORT_MARGIN));
      setPanelStyle({ position: 'fixed', top: rect.bottom + 8, left, width });
    }

    reposition();
    window.addEventListener('resize', reposition);
    return () => window.removeEventListener('resize', reposition);
  }, [canHover, open]);

  if (!canHover) {
    return (
      <button
        type="button"
        onClick={() => navigate('/about')}
        className={`${badgeButtonClass()} ${className}`}
      >
        <BadgeLabel />
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className={badgeButtonClass()}
      >
        <BadgeLabel />
      </button>

      <AnimatePresence>
        {open && panelStyle && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={panelStyle}
            className="z-30 rounded-2xl bg-white text-left shadow-2xl shadow-black/20 border border-slate-100 p-4 sm:p-5 max-h-[70vh] overflow-y-auto"
          >
            <p className="text-sm font-bold text-slate-900 mb-3">
              Train<span className="text-orange-500">Mitra</span>, in short
            </p>
            <div className="space-y-3">
              {aboutSections.map((s) => (
                <div key={s.heading}>
                  <p className="text-[11px] font-semibold text-orange-600 uppercase tracking-wide mb-0.5">{s.heading}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[11px] text-slate-400">Designed &amp; developed by Kaushik Banik</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



================================================
FILE: frontend/src/components/AdminBadge.jsx
================================================
import { useNavigate } from 'react-router-dom';

function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

export default function AdminBadge({ className = '' }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/admin')}
      className={`inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full pl-2.5 pr-3.5 py-1.5 shadow-lg shadow-black/20 border border-white/10 whitespace-nowrap hover:bg-slate-900/95 transition-colors ${className}`}
    >
      <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-rose-400/20 text-rose-300">
        <ShieldIcon />
      </span>
      <span className="text-xs font-semibold text-slate-200">Admin</span>
    </button>
  );
}



================================================
FILE: frontend/src/components/Bubbles.jsx
================================================
import { useMemo } from 'react';
import { motion } from 'framer-motion';

const BUBBLE_COUNT = 30;

export default function Bubbles({ reduceMotion }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: BUBBLE_COUNT }, () => {
        const drift = (20 + Math.random() * 50) * (Math.random() < 0.5 ? -1 : 1);
        return {
          left: `${Math.random() * 100}%`,
          size: 7 + Math.random() * 22,
          rise: 380 + Math.random() * 340,
          drift,
          duration: 5 + Math.random() * 6,
          delay: Math.random() * 6,
        };
      }),
    []
  );

  if (reduceMotion) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: b.left,
            bottom: '-3%',
            width: b.size,
            height: b.size,
            background:
              'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95), rgba(224,242,254,0.35) 55%, rgba(186,230,253,0.12) 78%)',
            border: '1.5px solid rgba(125,211,252,0.65)',
            boxShadow: '0 0 8px rgba(56,189,248,0.25), inset 0 0 4px rgba(255,255,255,0.6)',
          }}
          animate={{
            y: [0, -b.rise * 0.35, -b.rise * 0.75, -b.rise],
            x: [0, b.drift * 0.4, -b.drift * 0.4, b.drift],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.15, 0.85, 1],
          }}
        />
      ))}
    </div>
  );
}



================================================
FILE: frontend/src/components/ChatBadge.jsx
================================================
import { useState } from 'react';
import ChatPanel from './ChatPanel';

function ChatIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export default function ChatBadge({ className = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full pl-2.5 pr-3.5 py-1.5 shadow-lg shadow-black/20 border border-white/10 whitespace-nowrap hover:bg-slate-900/95 transition-colors ${className}`}
      >
        <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-400/20 text-emerald-300">
          <ChatIcon />
        </span>
        <span className="text-xs font-semibold text-slate-200">Chat</span>
      </button>

      {open && <ChatPanel onClose={() => setOpen(false)} />}
    </>
  );
}



================================================
FILE: frontend/src/components/ChatPanel.jsx
================================================
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import client from '../api/client';
import SkyBackground, { skyTheme } from './SkyBackground';
import useTimeOfDay from '../hooks/useTimeOfDay';

const WELCOME_TEXT = "Hi! I'm the TrainMitra assistant. Ask me about a train's schedule, Tatkal timings, delay reports, live status, or really anything else.";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

const STATUS_STEPS = ['Thinking...', 'Looking that up...', 'Almost there...'];

function TypingDots({ isDark }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const t1 = setTimeout(() => setStep(1), 1800);
    const t2 = setTimeout(() => setStep(2), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-slate-300' : 'bg-slate-400'}`}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{STATUS_STEPS[step]}</span>
    </div>
  );
}

function MessageBubble({ role, text, isError, isDark }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-orange-500 text-white rounded-br-sm'
            : isError
              ? 'bg-red-50 text-red-700 border border-red-100 rounded-bl-sm'
              : isDark
                ? 'bg-white/10 text-slate-100 border border-white/10 rounded-bl-sm'
                : 'bg-slate-100 text-slate-800 rounded-bl-sm'
        }`}
      >
        {text}
      </div>
    </div>
  );
}

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const period = useTimeOfDay();
  const reduceMotion = useReducedMotion();
  const isDark = skyTheme[period].isDark;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await client.post('/chat', { message: text, history });
      setMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
    } catch (err) {
      const errText = err.response?.data?.message || "Something went wrong reaching the assistant. Try again in a moment.";
      setMessages((prev) => [...prev, { role: 'model', text: errText, isError: true }]);
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4 py-6 sm:py-10"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className={`relative overflow-hidden bg-gradient-to-b transition-colors duration-700 ${skyTheme[period].gradient} rounded-2xl shadow-2xl w-full max-w-lg h-[min(640px,85vh)] flex flex-col`}
      >
        <SkyBackground period={period} reduceMotion={reduceMotion} />

        <div className={`relative z-10 flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b backdrop-blur-sm ${isDark ? 'border-white/10 bg-slate-900/30' : 'border-slate-900/10 bg-white/40'}`}>
          <div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Train<span className="text-orange-500">Mitra</span> Assistant
            </p>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Crowdsourced info, not guaranteed fact</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors ${
              isDark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-900/5 hover:text-slate-700'
            }`}
          >
            <CloseIcon />
          </button>
        </div>

        <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
          <MessageBubble role="model" text={WELCOME_TEXT} isDark={isDark} />
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} text={m.text} isError={m.isError} isDark={isDark} />
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className={`rounded-2xl rounded-bl-sm ${isDark ? 'bg-white/10 border border-white/10' : 'bg-slate-100'}`}>
                <TypingDots isDark={isDark} />
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSend}
          className={`relative z-10 flex items-center gap-2 px-4 sm:px-5 py-3.5 border-t ${isDark ? 'border-white/10' : 'border-slate-900/10 bg-white/40 backdrop-blur-sm'}`}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a train, Tatkal, delays..."
            maxLength={1000}
            className={`flex-1 min-w-0 text-sm rounded-full border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 ${
              isDark ? 'bg-white/10 border-white/20 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-slate-900'
            }`}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-orange-500 transition-colors"
          >
            <SendIcon />
          </button>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  );
}



================================================
FILE: frontend/src/components/DelayReports.jsx
================================================
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import socket from '../socket';
import useTrainRoom from '../hooks/useTrainRoom';
import { useAuth } from '../context/AuthContext';
import { enqueue } from '../offline/offlineQueue';
import TrustBadge from './TrustBadge';

function mergeReport(reports, incoming) {
  const exists = reports.some((r) => r._id === incoming._id);
  const next = exists ? reports.map((r) => (r._id === incoming._id ? incoming : r)) : [incoming, ...reports];
  return next.sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes));
}

function MegaphoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 13v-2Z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function ThumbUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h6.29a2 2 0 0 1 1.94 2.5l-2.34 9A2 2 0 0 1 18 23H7a2 2 0 0 1-2-2v-9a2 2 0 0 1 .59-1.41L11 5a2 2 0 0 1 3 1.71z" />
    </svg>
  );
}

function ThumbDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H3.71a2 2 0 0 1-1.94-2.5l2.34-9A2 2 0 0 1 6 1h11a2 2 0 0 1 2 2v9a2 2 0 0 1-.59 1.41L13 19a2 2 0 0 1-3-1.71z" />
    </svg>
  );
}

function todayDateInput() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DelayReports({ trainNumber, isDark }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const journeyDate = todayDateInput();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [queuedOffline, setQueuedOffline] = useState(false);

  const [votingId, setVotingId] = useState(null);
  const [quota, setQuota] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await client.get(`/delay-reports/${trainNumber}`);
      setReports(data);
    } catch {
      setLoadError(t('delayReports.loadError'));
    } finally {
      setLoading(false);
    }
  }, [trainNumber, t]);

  const fetchQuota = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await client.get('/delay-reports/quota');
      setQuota(data);
    } catch {
      // Quota display is a nice-to-have; a failed fetch just leaves it hidden.
    }
  }, [user]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  useTrainRoom(trainNumber, journeyDate);

  useEffect(() => {
    function onNewReport(payload) {
      if (payload.trainNumber !== trainNumber) return;
      setReports((prev) => mergeReport(prev, payload));
    }
    function onVoteUpdated(payload) {
      if (payload.trainNumber !== trainNumber) return;
      setReports((prev) => mergeReport(prev, payload));
    }
    socket.on('new_delay_report', onNewReport);
    socket.on('vote_updated', onVoteUpdated);
    return () => {
      socket.off('new_delay_report', onNewReport);
      socket.off('vote_updated', onVoteUpdated);
    };
  }, [trainNumber]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    setQueuedOffline(false);
    const payload = { trainNumber, reason: reason.trim() };
    try {
      await client.post('/delay-reports', payload);
      setReason('');
      await fetchReports();
    } catch (err) {
      if (!err.response) {
        // No response at all means the request never reached the network, not a
        // rejection from the server - queue it instead of showing an error.
        await enqueue({ endpoint: '/delay-reports', payload, label: t('delayReports.title') });
        setReason('');
        setQueuedOffline(true);
      } else {
        setSubmitError(err.response?.data?.message || t('delayReports.submitError'));
      }
    } finally {
      setSubmitting(false);
      fetchQuota();
    }
  }

  async function handleVote(reportId, voteType) {
    if (votingId) return;
    setVotingId(reportId);
    try {
      const { data } = await client.post(`/delay-reports/${reportId}/vote`, { voteType });
      setReports((prev) =>
        prev
          .map((r) => (r._id === reportId ? data : r))
          .sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes))
      );
    } catch {
      // Vote failures are non-critical (e.g. a stale double-click) - silently ignore.
    } finally {
      setVotingId(null);
    }
  }

  const isBlocked = quota?.blocked;
  const quotaExhausted = quota && quota.remaining <= 0 && !isBlocked;

  return (
    <div className={`p-5 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
              isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-100 text-rose-600'
            }`}
          >
            <MegaphoneIcon />
          </span>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('delayReports.title')}</h3>
        </div>
        {user && quota && !isBlocked && (
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full tabular-nums ${
              quota.remaining <= 2
                ? isDark
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-amber-100 text-amber-700'
                : isDark
                ? 'bg-white/10 text-slate-300'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t('delayReports.leftToday', { count: quota.remaining })}
          </span>
        )}
      </div>
      <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {t('delayReports.resetNote')}
      </p>

      {loading && <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('delayReports.loading')}</p>}
      {!loading && loadError && <p className="text-xs text-red-400">{loadError}</p>}
      {!loading && !loadError && reports.length === 0 && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('delayReports.empty')}
        </p>
      )}

      {!loading && reports.length > 0 && (
        <ul className="space-y-2 mb-4">
          <AnimatePresence initial={false}>
            {reports.map((r) => {
              const myVote = user ? r.votedBy?.find((v) => v.userId === user.id)?.voteType : null;
              const isOwn = user && r.reportedBy?._id === user.id;
              const net = r.upvotes - r.downvotes;
              return (
                <motion.li
                  key={r._id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-xl px-3.5 py-2.5 border flex items-start gap-3 ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{r.reason}</p>
                    <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>
                        {r.reportedBy?.name || t('delayReports.someone')}
                        {isOwn && t('delayReports.you')}
                      </span>
                      <TrustBadge reputationScore={r.reportedBy?.reputationScore} isDark={isDark} title={t('delayReports.trustedContributor')} />
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      disabled={!user || votingId === r._id}
                      onClick={() => handleVote(r._id, 'up')}
                      aria-label={t('delayReports.upvote')}
                      className={`w-9 h-9 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        myVote === 'up'
                          ? 'bg-emerald-500 text-white'
                          : isDark
                          ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                          : 'bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200'
                      }`}
                    >
                      <ThumbUpIcon />
                    </button>
                    <span className={`text-xs font-semibold tabular-nums w-5 text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {net}
                    </span>
                    <button
                      type="button"
                      disabled={!user || votingId === r._id}
                      onClick={() => handleVote(r._id, 'down')}
                      aria-label={t('delayReports.downvote')}
                      className={`w-9 h-9 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        myVote === 'down'
                          ? 'bg-rose-500 text-white'
                          : isDark
                          ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                          : 'bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 border border-slate-200'
                      }`}
                    >
                      <ThumbDownIcon />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {!user && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <a href="/login" className={isDark ? 'text-orange-300 underline' : 'text-orange-600 underline'}>
            {t('delayReports.loginPrompt')}
          </a>{' '}
          {t('delayReports.loginToPost')}
        </p>
      )}

      {user && isBlocked && (
        <p className="text-xs text-rose-400">
          {t('delayReports.blocked')}
        </p>
      )}

      {user && !isBlocked && quotaExhausted && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('delayReports.quotaExhausted', { limit: quota.limit })}
        </p>
      )}

      {user && !isBlocked && !quotaExhausted && (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('delayReports.reasonPlaceholder')}
            maxLength={300}
            className={`flex-1 min-w-0 rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-orange-400 ${
              isDark
                ? 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500'
                : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'
            }`}
          />
          <button
            type="submit"
            disabled={!reason.trim() || submitting}
            className="flex-shrink-0 text-sm font-semibold px-4 py-2.5 rounded-xl text-white bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t('delayReports.submitting') : t('delayReports.submit')}
          </button>
        </form>
      )}
      {submitError && <p className="text-xs text-red-400 mt-2">{submitError}</p>}
      {queuedOffline && <p className={`text-xs mt-2 ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{t('delayReports.queuedOffline')}</p>}
    </div>
  );
}



================================================
FILE: frontend/src/components/DeveloperBadge.jsx
================================================
import { useNavigate } from 'react-router-dom';

function CodeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 6-6 6 6 6M16 6l6 6-6 6" />
    </svg>
  );
}

export default function DeveloperBadge({ className = '' }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/developer')}
      className={`inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full pl-2.5 pr-3.5 py-1.5 shadow-lg shadow-black/20 border border-white/10 whitespace-nowrap hover:bg-slate-900/95 transition-colors ${className}`}
    >
      <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-violet-400/20 text-violet-300">
        <CodeIcon />
      </span>
      <span className="text-xs font-semibold text-slate-200">Developer</span>
    </button>
  );
}



================================================
FILE: frontend/src/components/DigitalClock.jsx
================================================
import { useEffect, useState } from 'react';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function DigitalClock({ className = '' }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  const blink = now.getSeconds() % 2 === 0;

  return (
    <div
      className={`inline-flex items-center gap-0.5 bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 font-mono text-sm sm:text-base tracking-widest text-amber-400 ${className}`}
      style={{ textShadow: '0 0 8px rgba(251,191,36,0.55)' }}
    >
      <span>{h}</span>
      <span style={{ opacity: blink ? 1 : 0.25 }}>:</span>
      <span>{m}</span>
      <span style={{ opacity: blink ? 1 : 0.25 }}>:</span>
      <span>{s}</span>
    </div>
  );
}



================================================
FILE: frontend/src/components/FAQ.jsx
================================================
import { useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useTimeOfDay from '../hooks/useTimeOfDay';
import { skyTheme } from './SkyBackground';

// The actual core tone from each period's Hero sky gradient (skyTheme in
// SkyBackground.jsx) - not an invented palette, so the circle is genuinely
// the same color family as the rest of the landing page at that time of day.
// Text switches light/dark per skyTheme[period].isDark, same as Hero does.
const CIRCLE_CORE = {
  morning: '#38bdf8', // sky-400, matches morning's sky-200 hero tone
  noon: '#0ea5e9', // sky-500, a touch richer than morning for midday brightness
  evening: '#fb923c', // orange-400, matches evening's orange-200 hero tone
  night: '#0f172a', // slate-900, matches night's slate-950/indigo-950 hero tone
};

// A single accent color for "questions" that reads clearly against every
// CIRCLE_CORE tone (blue, orange, navy) - orange-on-orange during evening was
// the problem case that ruled out using the brand orange here.

function ChevronIcon({ open }) {
  return (
    <motion.svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.2 }}
      className="flex-shrink-0"
    >
      <path d="m6 9 6 6 6-6" />
    </motion.svg>
  );
}

function QuestionMarkIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function FAQItem({ item, isOpen, onToggle, reduceMotion }) {
  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden transition-colors ${
        isOpen ? 'border-orange-200 shadow-sm' : 'border-slate-200'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-3 text-left px-4 sm:px-5 py-4 transition-colors ${
          isOpen ? 'text-orange-700' : 'text-slate-800 hover:text-orange-600'
        }`}
      >
        <span className="text-sm sm:text-[15px] font-semibold">{item.q}</span>
        <ChevronIcon open={isOpen} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-4 sm:px-5 pb-4 text-sm text-slate-600 leading-relaxed">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const period = useTimeOfDay();
  const isDark = skyTheme[period]?.isDark ?? false;
  const circleCore = CIRCLE_CORE[period] ?? CIRCLE_CORE.noon;
  const [sectionOpen, setSectionOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = t('faq.items', { returnObjects: true });

  // The shape hugs the actual content: generous side padding (the wide
  // subheading line needs it) but tight top/bottom padding - a true circle
  // sized to the content's diagonal wasted a lot of vertical space above the
  // heading and below the button, since the content is much wider than tall.
  const introRef = useRef(null);
  const [shapeSize, setShapeSize] = useState({ width: 480, height: 260 });

  useLayoutEffect(() => {
    const el = introRef.current;
    if (!el) return undefined;
    function measure() {
      const rect = el.getBoundingClientRect();
      setShapeSize({
        width: Math.ceil(rect.width + 90),
        height: Math.ceil(rect.height + 50),
      });
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <section id="faq" className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-amber-50/50 to-white py-16 sm:py-24">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-20 w-72 h-72 rounded-full bg-orange-200/40 blur-3xl"
        animate={reduceMotion ? {} : { scale: [1, 1.15, 1], x: [0, 15, 0], y: [0, 10, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 -right-20 w-72 h-72 rounded-full bg-amber-200/35 blur-3xl"
        animate={reduceMotion ? {} : { scale: [1, 1.2, 1], x: [0, -15, 0], y: [0, -10, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative max-w-2xl mx-auto px-4">
        {/* The wrapper reserves exactly shapeSize.height, so the accordion list
            below always clears the shape regardless of its size - no more
            guessing margins by hand. */}
        <div className="relative flex items-center justify-center mb-8" style={{ minHeight: shapeSize.height }}>
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 rounded-full transition-[background,box-shadow] duration-1000"
            style={{
              width: shapeSize.width,
              height: shapeSize.height,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(ellipse closest-side, ${circleCore} 0%, ${circleCore} 78%, transparent 100%)`,
              boxShadow: `0 0 70px 20px ${circleCore}55`,
            }}
          />

          <div ref={introRef} className="relative z-10 text-center px-8 py-4">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-2 transition-colors duration-1000 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('faq.headingPrefix')} <span className="text-white transition-colors duration-1000" style={{ textShadow: isDark ? 'none' : '0 1px 6px rgba(0,0,0,0.25)' }}>{t('faq.headingHighlight')}</span>?
            </h2>
            <p className={`text-sm sm:text-base transition-colors duration-1000 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              {t('faq.subheading')}
            </p>

            <div className="flex justify-center mt-6">
              <motion.button
                type="button"
                onClick={() => setSectionOpen((o) => !o)}
                aria-expanded={sectionOpen}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors duration-300 ${
                  sectionOpen
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : isDark
                    ? 'bg-white/5 text-slate-200 border border-white/10 hover:border-orange-400/40 hover:text-orange-300'
                    : 'bg-white/70 text-slate-700 border border-white/60 shadow-sm hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                <QuestionMarkIcon />
                {t('faq.toggleButton')}
                <ChevronIcon open={sectionOpen} />
              </motion.button>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {sectionOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 pt-4 pb-1">
                {faqs.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: reduceMotion ? 0 : i * 0.05 }}
                  >
                    <FAQItem
                      item={item}
                      isOpen={openIndex === i}
                      onToggle={() => setOpenIndex((cur) => (cur === i ? null : i))}
                      reduceMotion={reduceMotion}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}



================================================
FILE: frontend/src/components/FeatureGrid.jsx
================================================
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const ACCENTS = {
  sky: {
    icon: 'bg-sky-50 text-sky-600',
    border: 'from-sky-200 via-slate-200 to-sky-100',
    glow: 'group-hover:shadow-sky-400/20',
  },
  orange: {
    icon: 'bg-orange-50 text-orange-600',
    border: 'from-orange-200 via-slate-200 to-amber-200',
    glow: 'group-hover:shadow-orange-400/20',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600',
    border: 'from-amber-200 via-slate-200 to-orange-200',
    glow: 'group-hover:shadow-amber-400/20',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-500',
    border: 'from-rose-200 via-slate-200 to-rose-100',
    glow: 'group-hover:shadow-rose-400/20',
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-500',
    border: 'from-indigo-200 via-slate-200 to-indigo-100',
    glow: 'group-hover:shadow-indigo-400/20',
  },
  teal: {
    icon: 'bg-teal-50 text-teal-600',
    border: 'from-teal-200 via-slate-200 to-teal-100',
    glow: 'group-hover:shadow-teal-400/20',
  },
};

const features = [
  { id: 'accounts', icon: '🔐', status: 'live', accent: 'sky' },
  { id: 'trainLookup', icon: '🔎', status: 'live', link: '/trains', accent: 'orange' },
  { id: 'tatkal', icon: '⏱️', status: 'live', link: '/trains?tatkal=1', accent: 'amber' },
  { id: 'delay', icon: '📣', status: 'live', link: '/trains?delay=1', accent: 'rose' },
  { id: 'liveStatus', icon: '🛰️', status: 'live', link: '/trains?live=1', accent: 'indigo' },
  { id: 'experience', icon: '💬', status: 'live', link: '/trains?experience=1', accent: 'teal' },
];

function bubbleStyle(size) {
  return {
    width: size,
    height: size,
    background: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95), rgba(191,219,254,0.35) 45%, rgba(125,211,252,0.15) 75%)',
    border: '1px solid rgba(125,211,252,0.55)',
    boxShadow: 'inset -2px -2px 4px rgba(56,189,248,0.25), inset 2px 2px 3px rgba(255,255,255,0.8)',
  };
}

function randomEdgePoint() {
  const edge = Math.floor(Math.random() * 4);
  if (edge === 0) return { x: Math.random() * 100, y: -8 }; // top
  if (edge === 1) return { x: Math.random() * 100, y: 108 }; // bottom
  if (edge === 2) return { x: -8, y: Math.random() * 100 }; // left
  return { x: 108, y: Math.random() * 100 }; // right
}

function randomInnerPoint() {
  return { x: 5 + Math.random() * 90, y: 5 + Math.random() * 90 };
}

function makeWanderingBubble(startPoint) {
  const points = [startPoint, randomInnerPoint(), randomInnerPoint(), randomEdgePoint()];
  return {
    id: Math.random().toString(36).slice(2),
    size: 8 + Math.random() * 30,
    duration: 3 + Math.random() * 2.5,
    delay: Math.random() * 2,
    xs: points.map((p) => `${p.x}%`),
    ys: points.map((p) => `${p.y}%`),
  };
}

function makeAmbientBubble() {
  return makeWanderingBubble(randomEdgePoint());
}

function makeHornBubble() {
  return makeWanderingBubble({ x: 50 + (Math.random() - 0.5) * 12, y: 14 + (Math.random() - 0.5) * 6 });
}

function Bubbles({ bubbles, reduceMotion }) {
  if (reduceMotion) return null;

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((b) => (
        <motion.span
          key={b.id}
          className="absolute rounded-full"
          style={bubbleStyle(b.size)}
          initial={{ left: b.xs[0], top: b.ys[0], opacity: 0 }}
          animate={{ left: b.xs, top: b.ys, opacity: [0, 0.85, 1, 0.85] }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'mirror',
          }}
        />
      ))}
    </div>
  );
}

function HornIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10v4a1 1 0 0 0 1 1h2l5 4V5L6 9H4a1 1 0 0 0-1 1Z" />
      <path d="M16 8a5 5 0 0 1 0 8" />
      <path d="M19 5a9 9 0 0 1 0 14" />
    </svg>
  );
}

function playHornSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.28, now + 0.04);
    master.gain.linearRampToValueAtTime(0.22, now + 0.5);
    master.gain.linearRampToValueAtTime(0, now + 0.85);
    master.connect(ctx.destination);

    [311.1, 370, 466.2].forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.connect(master);
      osc.start(now);
      osc.stop(now + 0.9);
    });

    setTimeout(() => ctx.close(), 1000);
  } catch {
    // audio unavailable, ignore
  }
}

const MAX_HONK_STREAK = 6;
const MIC_BASE_SIZE = 18;
const MIC_GROWTH_PER_HONK = 9;
const HONK_STREAK_TIMEOUT = 1100;

function HornButton({ onHonk, t }) {
  const [streak, setStreak] = useState(0);
  const resetTimer = useRef(null);

  function handleHonk() {
    onHonk();
    playHornSound();

    setStreak((n) => Math.min(n + 1, MAX_HONK_STREAK));

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStreak(0), HONK_STREAK_TIMEOUT);
  }

  const micSize = MIC_BASE_SIZE + streak * MIC_GROWTH_PER_HONK;

  return (
    <div className="inline-flex flex-col items-center mb-2">
      <div className="relative">
        <AnimatePresence>
          {streak > 0 && (
            <motion.div
              key="mic"
              className="absolute bottom-1/2 left-full ml-2 select-none leading-none"
              initial={{ opacity: 0, scale: 0.4, x: -10, fontSize: MIC_BASE_SIZE }}
              animate={{ opacity: 1, scale: 1, x: 0, fontSize: micSize }}
              exit={{ opacity: 0, scale: 0.4, x: -10 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              📢
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={handleHonk}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9, rotate: -8 }}
          aria-label="Sound the horn"
          className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-200"
        >
          <HornIcon />
        </motion.button>
      </div>
      <span className="text-[11px] text-slate-400 mt-1">{t('featureGrid.hornHint')}</span>
    </div>
  );
}

function StatusBadge({ status, t }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full whitespace-nowrap">
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-slow" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </span>
        {t('featureGrid.status.live')}
      </span>
    );
  }
  return (
    <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full whitespace-nowrap">
      {t('featureGrid.status.comingSoon')}
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const MAX_BUBBLES = 90;

export default function FeatureGrid() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [bubbles, setBubbles] = useState(() => Array.from({ length: 42 }, makeAmbientBubble));

  function handleHonk() {
    setBubbles((current) => {
      const next = [...current, ...Array.from({ length: 14 }, makeHornBubble)];
      return next.length > MAX_BUBBLES ? next.slice(next.length - MAX_BUBBLES) : next;
    });
  }

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 py-14 sm:py-20 scroll-mt-16"
    >
      {/* classic double rule along the top and bottom edges */}
      <div className="absolute inset-x-0 top-0">
        <div className="h-[3px] bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400" />
        <div className="h-[3px]" />
        <div className="h-[1.5px] bg-gradient-to-r from-amber-200 via-orange-200 to-rose-200" />
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <div className="h-[1.5px] bg-gradient-to-r from-rose-200 via-orange-200 to-amber-200" />
        <div className="h-[3px]" />
        <div className="h-[3px] bg-gradient-to-r from-amber-400 via-rose-400 to-orange-400" />
      </div>

      <Bubbles bubbles={bubbles} reduceMotion={reduceMotion} />

      <div className="relative max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <HornButton onHonk={handleHonk} t={t} />
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {t('featureGrid.heading', { brand: 'TrainMitra' })}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">
            {t('featureGrid.subheading')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {features.map((f, i) => {
          const CardTag = f.link ? Link : 'div';
          const isLive = f.status === 'live';
          const accent = ACCENTS[f.accent];
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: reduceMotion ? 0 : i * 0.08, ease: 'easeOut' }}
              whileHover={{ y: -4 }}
              className="group h-full"
            >
              <CardTag
                {...(f.link ? { to: f.link } : {})}
                className={`relative block h-full rounded-2xl p-[1.5px] bg-gradient-to-br shadow-sm transition-shadow duration-300 ${
                  isLive ? `${accent.border} ${accent.glow} group-hover:shadow-lg` : 'from-slate-200 via-slate-100 to-slate-200'
                }`}
              >
                <div
                  className={`relative h-full rounded-[15px] p-5 bg-white transition-opacity ${
                    isLive ? '' : 'opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3.5">
                    <span
                      className={`text-2xl w-11 h-11 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
                        isLive ? accent.icon : 'bg-slate-100 text-slate-400 grayscale'
                      }`}
                    >
                      {f.icon}
                    </span>
                    <StatusBadge status={f.status} t={t} />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1.5">{t(`featureGrid.items.${f.id}.title`)}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{t(`featureGrid.items.${f.id}.description`)}</p>
                  {f.link && (
                    <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-orange-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      {t('featureGrid.tryIt')} <ArrowIcon />
                    </span>
                  )}
                </div>
              </CardTag>
            </motion.div>
          );
        })}
        </div>
      </div>
    </section>
  );
}



================================================
FILE: frontend/src/components/Footer.jsx
================================================
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-sm font-semibold text-slate-800">
          Train<span className="text-orange-500">Mitra</span>
        </p>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">{t('footer.disclaimer')}</p>
        <p className="text-xs text-slate-400 mt-3">{t('footer.credit')}</p>
        <p className="text-xs text-slate-400 mt-1">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}



================================================
FILE: frontend/src/components/Hero.jsx
================================================
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import TrainTrack from './TrainTrack';
import SkyBackground, { skyTheme } from './SkyBackground';
import LiveStatsBadges from './LiveStatsBadges';
import AboutBadge from './AboutBadge';
import ChatBadge from './ChatBadge';
import LanguageBadge from './LanguageBadge';
import DeveloperBadge from './DeveloperBadge';
import LearnerBadge from './LearnerBadge';
import WhatsNextBadge from './WhatsNextBadge';
import AdminBadge from './AdminBadge';
import useTimeOfDay from '../hooks/useTimeOfDay';
import logo from '../assets/train_station_16x9_stretched.jpg';

function DriftingClouds({ reduceMotion }) {
  if (reduceMotion) return null;
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-8 left-[10%] w-40 h-14 rounded-full bg-white/40 blur-xl hidden sm:block"
        animate={{ x: [0, 60, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-20 left-[55%] w-28 h-10 rounded-full bg-white/30 blur-lg hidden sm:block"
        animate={{ x: [0, -40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-4 left-[75%] w-24 h-8 rounded-full bg-white/30 blur-lg hidden sm:block"
        animate={{ x: [0, 30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
    </>
  );
}

function TiltCard({ children, reduceMotion }) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 15 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

  function handleMouseMove(e) {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className="relative max-w-md mx-auto lg:max-w-none"
    >
      {children}
    </motion.div>
  );
}

export default function Hero() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const period = useTimeOfDay();
  const isDark = skyTheme[period].isDark;

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.12, delayChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-b transition-colors duration-1000 ${skyTheme[period].gradient}`}
    >
      <SkyBackground period={period} reduceMotion={reduceMotion} />

      {!isDark && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-orange-200/40 blur-3xl"
            animate={reduceMotion ? {} : { scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, 10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-purple-200/30 blur-3xl"
            animate={reduceMotion ? {} : { scale: [1, 1.2, 1], x: [0, -15, 0], y: [0, -15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <DriftingClouds reduceMotion={reduceMotion} />
        </>
      )}

      <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="text-center lg:text-left order-2 lg:order-1"
          >
            <motion.div variants={item} className="mb-4 flex flex-row flex-wrap items-center justify-center lg:justify-start gap-2">
              <LiveStatsBadges direction="row" />
              <AboutBadge />
              <ChatBadge />
              <LanguageBadge />
            </motion.div>

            <motion.span
              variants={item}
              className={`inline-block text-xs font-semibold tracking-wide px-3 py-1 rounded-full mb-4 ${
                isDark ? 'text-orange-200 bg-white/10' : 'text-orange-700 bg-green-100'
              }`}
            >
              {t('hero.eyebrow')}
            </motion.span>

            <motion.h1
              variants={item}
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {t('hero.headlineStart')}{' '}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                {t('hero.headlineHighlight')}
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className={`mt-4 text-base sm:text-lg max-w-md mx-auto lg:mx-0 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {t('hero.subtitle')}
            </motion.p>

            {!user && (
              <motion.div
                variants={item}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
              >
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                  <Link
                    to="/register"
                    className="block w-full sm:w-auto text-center bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg px-6 py-3 text-sm shadow-lg shadow-orange-200/50"
                  >
                    {t('hero.createAccount')}
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                  <a
                    href="#features"
                    className={`block w-full sm:w-auto text-center font-medium rounded-lg px-6 py-3 text-sm border ${
                      isDark
                        ? 'text-white border-white/30 hover:bg-white/10'
                        : 'text-slate-700 border-slate-300 hover:bg-white'
                    }`}
                  >
                    {t('hero.seeWhatItDoes')}
                  </a>
                </motion.div>
              </motion.div>
            )}

            <motion.p variants={item} className={`mt-6 text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
              {t('hero.footnote')}
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.9, rotate: reduceMotion ? 0 : -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
            className="order-1 lg:order-2"
          >
            <TiltCard reduceMotion={reduceMotion}>
              <div className="absolute -inset-3 bg-orange-200/50 rounded-3xl -rotate-2 hidden sm:block" />
              <motion.img
                src={logo}
                alt="A chai wallah serving tea from a train at a station platform at sunset"
                className="relative w-full h-auto rounded-2xl shadow-xl"
                animate={reduceMotion ? {} : { y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </TiltCard>
          </motion.div>
        </div>

        <TrainTrack />

        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mt-8 sm:mt-10"
        >
          <DeveloperBadge />
          <LearnerBadge />
          <WhatsNextBadge />
          <AdminBadge />
        </motion.div>
      </div>
    </section>
  );
}



================================================
FILE: frontend/src/components/JourneyExperience.jsx
================================================
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

function SparkleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}

function StarIcon({ filled, half }) {
  if (half) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="starHalf">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"
          fill="url(#starHalf)"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </svg>
  );
}

function StarDisplay({ value, colorClass }) {
  const rounded = Math.round((value || 0) * 2) / 2;
  return (
    <span className={`inline-flex items-center gap-0.5 ${colorClass}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled={rounded >= n} half={rounded + 0.5 === n} />
      ))}
    </span>
  );
}

function StarInput({ value, onChange, colorClass }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span className={`inline-flex items-center gap-0.5 ${colorClass}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`Rate ${n} out of 5`}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <StarIcon filled={shown >= n} />
        </button>
      ))}
    </span>
  );
}

function timeAgo(isoString, t) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return t('journeyExperience.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('journeyExperience.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('journeyExperience.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t('journeyExperience.daysAgo', { count: days });
  const months = Math.floor(days / 30);
  return t('journeyExperience.monthsAgo', { count: months });
}

const CATEGORY_KEYS = ['cleanliness', 'food', 'staffBehaviour', 'punctuality', 'safety'];

const EMPTY_RATINGS = { cleanliness: 0, food: 0, staffBehaviour: 0, punctuality: 0, safety: 0 };

export default function JourneyExperience({ trainNumber, isDark }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const CATEGORIES = CATEGORY_KEYS.map((key) => ({ key, label: t(`journeyExperience.categories.${key}`) }));

  const [insight, setInsight] = useState({ averages: null, recentComments: [] });
  const [loading, setLoading] = useState(false);

  const [ratings, setRatings] = useState(EMPTY_RATINGS);
  const [comment, setComment] = useState('');
  const [hasExisting, setHasExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/journey-experience/${trainNumber}`);
      setInsight(data);
    } catch {
      // Insight is a nice-to-have summary; a failed fetch just leaves it empty.
    } finally {
      setLoading(false);
    }
  }, [trainNumber]);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  useEffect(() => {
    if (!user) {
      setRatings(EMPTY_RATINGS);
      setComment('');
      setHasExisting(false);
      return;
    }
    let cancelled = false;
    client.get(`/journey-experience/${trainNumber}/mine`).then(({ data }) => {
      if (cancelled) return;
      if (data) {
        setRatings({
          cleanliness: data.cleanliness,
          food: data.food,
          staffBehaviour: data.staffBehaviour,
          punctuality: data.punctuality,
          safety: data.safety,
        });
        setComment(data.comment || '');
        setHasExisting(true);
      } else {
        setRatings(EMPTY_RATINGS);
        setComment('');
        setHasExisting(false);
      }
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [trainNumber, user]);

  const allRated = CATEGORIES.every((c) => ratings[c.key] > 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!allRated || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await client.post('/journey-experience', { trainNumber, ...ratings, comment });
      setHasExisting(true);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      await fetchInsight();
    } catch (err) {
      setSubmitError(err.response?.data?.message || t('journeyExperience.submitError'));
    } finally {
      setSubmitting(false);
    }
  }

  const { averages, recentComments } = insight;

  return (
    <div className={`p-5 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
            isDark ? 'bg-teal-500/15 text-teal-300' : 'bg-teal-100 text-teal-600'
          }`}
        >
          <SparkleIcon />
        </span>
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('journeyExperience.title')}</h3>
        {averages && (
          <span className={`ml-auto flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-teal-300' : 'text-teal-600'}`}>
            <StarDisplay value={averages.overall} colorClass={isDark ? 'text-teal-300' : 'text-teal-500'} />
            {averages.overall}
          </span>
        )}
      </div>
      <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {t('journeyExperience.description')}
      </p>

      {loading && <div className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('journeyExperience.loading')}</div>}

      {!loading && !averages && (
        <div className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {t('journeyExperience.noRatings')}
        </div>
      )}

      {!loading && averages && (
        <div className="grid sm:grid-cols-2 gap-2.5 mb-3.5">
          {CATEGORIES.map((c) => (
            <div
              key={c.key}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 border ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.label}</span>
              <span className="flex items-center gap-1.5">
                <StarDisplay value={averages[c.key]} colorClass={isDark ? 'text-teal-300' : 'text-teal-500'} />
                <span className={`text-xs font-semibold tabular-nums ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {averages[c.key]}
                </span>
              </span>
            </div>
          ))}
          <div className={`text-[11px] sm:col-span-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {t('journeyExperience.basedOnRatings', { count: averages.count })}
          </div>
        </div>
      )}

      {recentComments?.length > 0 && (
        <div className="mb-3.5 space-y-2">
          {recentComments.map((c, i) => (
            <div
              key={i}
              className={`rounded-xl px-3.5 py-2.5 border text-xs ${
                isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{c.name}</span>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>{timeAgo(c.createdAt, t)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words">{c.comment}</p>
            </div>
          ))}
        </div>
      )}

      {!user && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <a href="/login" className={isDark ? 'text-orange-300 underline' : 'text-orange-600 underline'}>
            {t('journeyExperience.loginPrompt')}
          </a>{' '}
          {t('journeyExperience.loginToRate')}
        </p>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className={`grid sm:grid-cols-2 gap-2 rounded-xl p-3 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            {CATEGORIES.map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-2">
                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.label}</span>
                <StarInput
                  value={ratings[c.key]}
                  onChange={(n) => setRatings((r) => ({ ...r, [c.key]: n }))}
                  colorClass={isDark ? 'text-teal-300' : 'text-teal-500'}
                />
              </div>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 300))}
            rows={2}
            placeholder={t('journeyExperience.commentPlaceholder')}
            className={`w-full rounded-xl px-3.5 py-2.5 text-sm border resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 ${
              isDark
                ? 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500'
                : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
            }`}
          />
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{comment.length}/300</span>
            <motion.button
              type="submit"
              disabled={!allRated || submitting}
              className="flex-shrink-0 text-sm font-semibold px-4 py-2.5 rounded-xl text-white bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? t('journeyExperience.submitting')
                : submitted
                ? t('journeyExperience.submitted')
                : hasExisting
                ? t('journeyExperience.update')
                : t('journeyExperience.submit')}
            </motion.button>
          </div>
        </form>
      )}
      {submitError && <p className="text-xs text-red-400 mt-2">{submitError}</p>}
    </div>
  );
}



================================================
FILE: frontend/src/components/LanguageBadge.jsx
================================================
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { changeLanguage, SUPPORTED_LANGUAGES } from '../i18n';

function GlobeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function badgeButtonClass() {
  return 'inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full pl-2.5 pr-3.5 py-1.5 shadow-lg shadow-black/20 border border-white/10 whitespace-nowrap hover:bg-slate-900/95 transition-colors';
}

function BadgeLabel({ label }) {
  return (
    <>
      <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-cyan-400/20 text-cyan-300">
        <GlobeIcon />
      </span>
      <span className="text-xs font-semibold text-slate-200">{label}</span>
    </>
  );
}

function hasHoverSupport() {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

const PANEL_WIDTH = 220;
const VIEWPORT_MARGIN = 16;

export default function LanguageBadge({ className = '' }) {
  const { t, i18n } = useTranslation();
  const [canHover] = useState(hasHoverSupport);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return undefined;

    function reposition() {
      const rect = buttonRef.current.getBoundingClientRect();
      const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
      const idealLeft = rect.left + rect.width / 2 - width / 2;
      const left = Math.max(VIEWPORT_MARGIN, Math.min(idealLeft, window.innerWidth - width - VIEWPORT_MARGIN));
      setPanelStyle({ position: 'fixed', top: rect.bottom + 8, left, width });
    }

    reposition();
    window.addEventListener('resize', reposition);
    return () => window.removeEventListener('resize', reposition);
  }, [open]);

  function handleSelect(code) {
    changeLanguage(code);
    setOpen(false);
  }

  const containerProps = canHover
    ? { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) }
    : {};

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} {...containerProps}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={badgeButtonClass()}
      >
        <BadgeLabel label={t('language.label')} />
      </button>

      <AnimatePresence>
        {open && panelStyle && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={panelStyle}
            className="z-30 rounded-2xl bg-white text-left shadow-2xl shadow-black/20 border border-slate-100 p-2 max-h-[70vh] overflow-y-auto"
          >
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-2.5 pt-1.5 pb-2">
              {t('language.choose')}
            </p>
            <div className="space-y-0.5">
              {SUPPORTED_LANGUAGES.map((code) => {
                const active = i18n.language === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleSelect(code)}
                    className={`w-full flex items-center justify-between gap-2 text-left px-2.5 py-2 rounded-xl text-sm transition-colors ${
                      active ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t(`language.names.${code}`)}
                    {active && <CheckIcon />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



================================================
FILE: frontend/src/components/LearnerBadge.jsx
================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { isLearnerOwner } from '../constants/access';

function GraduationIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 10-10-5L2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
    </svg>
  );
}

export default function LearnerBadge({ className = '' }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showComingSoon, setShowComingSoon] = useState(false);

  function handleClick() {
    if (isLearnerOwner(user)) {
      navigate('/learner');
      return;
    }
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 1800);
  }

  return (
    <div className="relative inline-flex">
      <AnimatePresence>
        {showComingSoon && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-slate-100 text-xs font-medium px-3 py-1.5 rounded-full shadow-lg border border-white/10"
          >
            Coming soon
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full pl-2.5 pr-3.5 py-1.5 shadow-lg shadow-black/20 border border-white/10 whitespace-nowrap hover:bg-slate-900/95 transition-colors ${className}`}
      >
        <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-fuchsia-400/20 text-fuchsia-300">
          <GraduationIcon />
        </span>
        <span className="text-xs font-semibold text-slate-200">Learner</span>
      </button>
    </div>
  );
}



================================================
FILE: frontend/src/components/learnerUI.jsx
================================================
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

export function BackLink({ to = '/', children = 'Back to home', isDark = false }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors mb-6 ${
        isDark ? 'text-slate-300 hover:text-orange-300' : 'text-slate-500 hover:text-orange-600'
      }`}
    >
      <BackArrow /> {children}
    </Link>
  );
}

function CopyIcon({ copied }) {
  return copied ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CodeLine({ text }) {
  const isComment = text.trim().startsWith('//');
  return <div className={isComment ? 'text-slate-500' : 'text-slate-100'}>{text || ' '}</div>;
}

export function CodeBlock({ file, code, defaultOpen = false }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const lineCount = code.split('\n').length;

  function handleCopy(e) {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full bg-slate-800 text-slate-300 text-xs font-mono px-4 py-2 flex items-center justify-between gap-2 hover:bg-slate-700 transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <ChevronIcon open={open} />
          <span className="truncate">{file}</span>
          <span className="text-slate-500 font-sans flex-shrink-0">({lineCount} lines)</span>
        </span>
        <span
          onClick={handleCopy}
          role="button"
          tabIndex={0}
          aria-label="Copy code"
          className="flex-shrink-0 flex items-center gap-1 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <CopyIcon copied={copied} />
          <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
        </span>
      </button>
      {open && (
        <div className="bg-slate-900 px-4 py-3 overflow-x-auto max-h-[600px] overflow-y-auto">
          <pre className="font-mono text-[12.5px] leading-relaxed whitespace-pre">
            {code.split('\n').map((line, i) => (
              <CodeLine key={i} text={line} />
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}

function StarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </svg>
  );
}

function ratingStyle(rating) {
  if (rating >= 9) return 'bg-rose-50 text-rose-700';
  if (rating >= 7) return 'bg-orange-50 text-orange-700';
  if (rating >= 5) return 'bg-amber-50 text-amber-700';
  if (rating >= 3) return 'bg-sky-50 text-sky-700';
  return 'bg-slate-100 text-slate-500';
}

export function RatingBadge({ rating }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ratingStyle(rating)}`}>
      <StarIcon />
      {rating}/10
    </span>
  );
}

export function FileCard({ path, rating, explanation, code, isDark = false }) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <code className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{path}</code>
        <RatingBadge rating={rating} />
      </div>
      <div className="space-y-2.5 mb-4">
        {explanation.map((p, i) => (
          <p key={i} className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{p}</p>
        ))}
      </div>
      <CodeBlock file={path} code={code} />
    </div>
  );
}



================================================
FILE: frontend/src/components/LiveStatsBadges.jsx
================================================
import { motion, AnimatePresence } from 'framer-motion';
import useLiveStats from '../hooks/useLiveStats';

function PulseDot({ colorClass }) {
  return (
    <span className="relative flex w-2 h-2 flex-shrink-0">
      <span className={`absolute inset-0 rounded-full animate-ping-slow ${colorClass}`} />
      <span className={`relative w-2 h-2 rounded-full ${colorClass}`} />
    </span>
  );
}

function LiveBadge({ value, label, dotColorClass }) {
  return (
    <AnimatePresence>
      {value !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full pl-2.5 pr-3.5 py-1.5 shadow-lg shadow-black/20 border border-white/10 whitespace-nowrap"
        >
          <PulseDot colorClass={dotColorClass} />
          <span className="font-bold text-sm tabular-nums">{value.toLocaleString()}</span>
          <span className="text-xs text-slate-300">{label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LiveStatsBadges({ className = '', direction = 'col' }) {
  const { online, registered } = useLiveStats();

  if (online === null && registered === null) return null;

  const directionClass = direction === 'row' ? 'flex-row flex-wrap justify-center lg:justify-start' : 'flex-col items-start';

  return (
    <div className={`flex ${directionClass} gap-2 ${className}`}>
      <LiveBadge value={online} label="online now" dotColorClass="bg-emerald-400" />
      <LiveBadge value={registered} label="registered" dotColorClass="bg-sky-400" />
    </div>
  );
}



================================================
FILE: frontend/src/components/LiveStatusFeed.jsx
================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import socket from '../socket';
import useTrainRoom from '../hooks/useTrainRoom';
import { useAuth } from '../context/AuthContext';
import { enqueue } from '../offline/offlineQueue';
import TrustBadge from './TrustBadge';

function SatelliteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m13 7 4 4" />
      <path d="m5 19 3-3" />
      <path d="m14.5 4.5 1-1a2.12 2.12 0 0 1 3 3l-1 1" />
      <path d="m9.5 14.5-5 5" />
      <path d="m18.5 9.5 1-1a2.12 2.12 0 0 1 3 3l-1 1" />
      <path d="M8 12 3 17l4 4 5-5" />
      <path d="m4 21 1-1" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.2 }}
      className="flex-shrink-0"
    >
      <path d="m6 9 6 6 6-6" />
    </motion.svg>
  );
}

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
      <path d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.71 6.5 12 7 12.46a.75.75 0 0 0 1 0c.5-.46 7-6.75 7-12.46C19.5 5.36 16.14 2 12 2zm0 10.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
    </svg>
  );
}

function ThumbUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h6.29a2 2 0 0 1 1.94 2.5l-2.34 9A2 2 0 0 1 18 23H7a2 2 0 0 1-2-2v-9a2 2 0 0 1 .59-1.41L11 5a2 2 0 0 1 3 1.71z" />
    </svg>
  );
}

function ThumbDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H3.71a2 2 0 0 1-1.94-2.5l2.34-9A2 2 0 0 1 6 1h11a2 2 0 0 1 2 2v9a2 2 0 0 1-.59 1.41L13 19a2 2 0 0 1-3-1.71z" />
    </svg>
  );
}

function mergeUpdate(updates, incoming) {
  const exists = updates.some((u) => u._id === incoming._id);
  return exists ? updates.map((u) => (u._id === incoming._id ? incoming : u)) : [incoming, ...updates];
}

const PANEL_MAX_HEIGHT = 288;
const PANEL_GAP = 6;

function StationSelect({ stops, value, onChange, isDark }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  function computeCoords() {
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < PANEL_MAX_HEIGHT && spaceAbove > spaceBelow;
    setCoords({
      left: rect.left,
      width: rect.width,
      top: openUpward ? null : rect.bottom + PANEL_GAP,
      bottom: openUpward ? window.innerHeight - rect.top + PANEL_GAP : null,
      openUpward,
    });
  }

  function toggleOpen() {
    if (!open) computeCoords();
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return undefined;
    function onClickOutside(e) {
      if (btnRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onScrollOrResize(e) {
      // Scroll events from inside the panel's own scrollable list still reach here
      // (capture-phase listeners see them even though `scroll` doesn't bubble), and
      // don't need a reposition. Everything else (page scroll, window resize) repositions
      // the panel instead of closing it - closing on scroll caused a real bug: a click
      // that also nudges the page (e.g. browser scroll-into-view on focus) could fire a
      // deferred scroll event right after opening and close the panel before it was seen.
      if (panelRef.current?.contains(e.target)) return;
      computeCoords();
    }
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  return (
    <div className="relative sm:w-52 flex-shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        className={`w-full flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 ${
          isDark ? 'bg-white/5 border-white/10 text-slate-100 hover:bg-white/10' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
        }`}
      >
        <span className={isDark ? 'text-indigo-300' : 'text-indigo-500'}>
          <PinIcon />
        </span>
        <span className={`flex-1 min-w-0 text-left truncate ${!value ? (isDark ? 'text-slate-500' : 'text-slate-400') : ''}`}>
          {value || t('liveStatus.whereAreYou')}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open &&
        coords &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: coords.openUpward ? 6 : -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                left: coords.left,
                width: coords.width,
                top: coords.top ?? undefined,
                bottom: coords.bottom ?? undefined,
                maxHeight: PANEL_MAX_HEIGHT,
              }}
              className={`themed-scrollbar z-50 rounded-xl shadow-lg overflow-y-auto border ${
                isDark ? 'bg-slate-900/95 backdrop-blur border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              {stops.map((s) => (
                <button
                  key={s.stationCode}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(s.stationName);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-sm border-b last:border-0 transition-colors ${
                    s.stationName === value
                      ? isDark
                        ? 'bg-indigo-500/15 text-indigo-300'
                        : 'bg-indigo-50 text-indigo-700'
                      : isDark
                      ? 'text-slate-100 hover:bg-white/5 border-white/5'
                      : 'text-slate-800 hover:bg-indigo-50 border-slate-100'
                  }`}
                >
                  {s.stationName}{' '}
                  <span className={`font-mono text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({s.stationCode})</span>
                </button>
              ))}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

function todayDateInput() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function timeAgo(isoString, t) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return t('liveStatus.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('liveStatus.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  return t('liveStatus.hoursAgo', { count: hours });
}

export default function LiveStatusFeed({ trainNumber, stops, isDark }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const journeyDate = todayDateInput();

  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [stationName, setStationName] = useState('');
  const [platformNumber, setPlatformNumber] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [queuedOffline, setQueuedOffline] = useState(false);

  const [votingId, setVotingId] = useState(null);
  const [quota, setQuota] = useState(null);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await client.get(`/live-status/${trainNumber}`);
      setUpdates(data);
    } catch {
      setLoadError(t('liveStatus.loadError'));
    } finally {
      setLoading(false);
    }
  }, [trainNumber, t]);

  const fetchQuota = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await client.get('/live-status/quota');
      setQuota(data);
    } catch {
      // Quota display is a nice-to-have; a failed fetch just leaves it hidden.
    }
  }, [user]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  useTrainRoom(trainNumber, journeyDate);

  useEffect(() => {
    function onUpdate(payload) {
      if (payload.trainNumber !== trainNumber) return;
      setUpdates((prev) => mergeUpdate(prev, payload));
    }
    function onVoteUpdated(payload) {
      if (payload.trainNumber !== trainNumber) return;
      setUpdates((prev) => mergeUpdate(prev, payload));
    }
    socket.on('live_status_update', onUpdate);
    socket.on('live_status_vote_updated', onVoteUpdated);
    return () => {
      socket.off('live_status_update', onUpdate);
      socket.off('live_status_vote_updated', onVoteUpdated);
    };
  }, [trainNumber]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stationName || !message.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    setQueuedOffline(false);
    const payload = {
      trainNumber,
      stationName,
      platformNumber: platformNumber.trim() || undefined,
      message: message.trim(),
    };
    try {
      await client.post('/live-status', payload);
      setMessage('');
      setPlatformNumber('');
    } catch (err) {
      if (!err.response) {
        await enqueue({ endpoint: '/live-status', payload, label: t('liveStatus.title') });
        setMessage('');
        setPlatformNumber('');
        setQueuedOffline(true);
      } else {
        setSubmitError(err.response?.data?.message || t('liveStatus.submitError'));
      }
    } finally {
      setSubmitting(false);
      fetchQuota();
    }
  }

  async function handleVote(updateId, voteType) {
    if (votingId) return;
    setVotingId(updateId);
    try {
      const { data } = await client.post(`/live-status/${updateId}/vote`, { voteType });
      setUpdates((prev) => prev.map((u) => (u._id === updateId ? data : u)));
    } catch {
      // Vote failures are non-critical (e.g. a stale double-click) - silently ignore.
    } finally {
      setVotingId(null);
    }
  }

  const isBlocked = quota?.blocked;
  const quotaExhausted = quota && quota.remaining <= 0 && !isBlocked;

  return (
    <div className={`p-5 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
              isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-100 text-indigo-600'
            }`}
          >
            <SatelliteIcon />
          </span>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('liveStatus.title')}</h3>
          <span className="relative flex w-1.5 h-1.5 ml-0.5">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-slow" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
        </div>
        {user && quota && !isBlocked && (
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full tabular-nums ${
              quota.remaining <= 2
                ? isDark
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-amber-100 text-amber-700'
                : isDark
                ? 'bg-white/10 text-slate-300'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t('liveStatus.leftToday', { count: quota.remaining })}
          </span>
        )}
      </div>
      <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {t('liveStatus.description')}
      </p>

      {loading && <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('liveStatus.loading')}</p>}
      {!loading && loadError && <p className="text-xs text-red-400">{loadError}</p>}
      {!loading && !loadError && updates.length === 0 && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('liveStatus.empty')}
        </p>
      )}

      {!loading && updates.length > 0 && (
        <ul className="space-y-2 mb-4">
          <AnimatePresence initial={false}>
            {updates.map((u) => {
              const myVote = user ? u.votedBy?.find((v) => v.userId === user.id)?.voteType : null;
              const net = u.upvotes - u.downvotes;
              return (
                <motion.li
                  key={u._id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-xl px-3.5 py-2.5 border flex items-start gap-3 ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {u.stationName}
                      </span>
                      {u.platformNumber && (
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          PF {u.platformNumber}
                        </span>
                      )}
                      <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{timeAgo(u.timestamp, t)}</span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{u.message}</p>
                    <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>{u.reportedBy?.name || t('liveStatus.someone')}</span>
                      <TrustBadge reputationScore={u.reportedBy?.reputationScore} isDark={isDark} title={t('liveStatus.trustedContributor')} />
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      disabled={!user || votingId === u._id}
                      onClick={() => handleVote(u._id, 'up')}
                      aria-label={t('liveStatus.confirmAccurate')}
                      title={t('liveStatus.confirmAccurateTitle')}
                      className={`w-9 h-9 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        myVote === 'up'
                          ? 'bg-emerald-500 text-white'
                          : isDark
                          ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                          : 'bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200'
                      }`}
                    >
                      <ThumbUpIcon />
                    </button>
                    <span className={`text-xs font-semibold tabular-nums w-5 text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {net}
                    </span>
                    <button
                      type="button"
                      disabled={!user || votingId === u._id}
                      onClick={() => handleVote(u._id, 'down')}
                      aria-label={t('liveStatus.reportFalse')}
                      title={t('liveStatus.reportFalseTitle')}
                      className={`w-9 h-9 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        myVote === 'down'
                          ? 'bg-rose-500 text-white'
                          : isDark
                          ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                          : 'bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 border border-slate-200'
                      }`}
                    >
                      <ThumbDownIcon />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {!user && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <a href="/login" className={isDark ? 'text-orange-300 underline' : 'text-orange-600 underline'}>
            {t('liveStatus.loginPrompt')}
          </a>{' '}
          {t('liveStatus.loginToPost')}
        </p>
      )}

      {user && isBlocked && (
        <p className="text-xs text-rose-400">
          {t('liveStatus.blocked')}
        </p>
      )}

      {user && !isBlocked && quotaExhausted && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('liveStatus.quotaExhausted', { limit: quota.limit })}
        </p>
      )}

      {user && !isBlocked && !quotaExhausted && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <StationSelect stops={stops} value={stationName} onChange={setStationName} isDark={isDark} />
            <input
              type="text"
              value={platformNumber}
              onChange={(e) => setPlatformNumber(e.target.value)}
              placeholder={t('liveStatus.platformPlaceholder')}
              maxLength={10}
              className={`sm:w-40 flex-shrink-0 rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
              }`}
            />
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('liveStatus.messagePlaceholder')}
              maxLength={300}
              className={`flex-1 min-w-0 rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={!stationName || !message.trim() || submitting}
            className="self-start text-sm font-semibold px-4 py-2.5 rounded-xl text-white bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t('liveStatus.submitting') : t('liveStatus.submit')}
          </button>
        </form>
      )}
      {submitError && <p className="text-xs text-red-400 mt-2">{submitError}</p>}
      {queuedOffline && <p className={`text-xs mt-2 ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{t('liveStatus.queuedOffline')}</p>}
    </div>
  );
}



================================================
FILE: frontend/src/components/Navbar.jsx
================================================
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { fileToResizedDataUrl } from '../utils/resizeImage';
import StationClock from './StationClock';
import DigitalClock from './DigitalClock';
import { TrainIcon } from './TrainTrack';
import { skyTheme } from './SkyBackground';
import useTimeOfDay from '../hooks/useTimeOfDay';

const scenePalette = {
  morning: { mountains: ['#94a3b8', '#a5b3c6', '#8f9fb5'], trees: ['#4ade80', '#6ee7a8'], rail: '#78716c', sleeper: '#94a3b8', cloud: '#e2e8f0' },
  noon: { mountains: ['#7c93ad', '#93a8c0', '#7791ab'], trees: ['#22c55e', '#4ade80'], rail: '#64748b', sleeper: '#94a3b8', cloud: '#ffffff' },
  evening: { mountains: ['#a3889b', '#b89aab', '#957c8c'], trees: ['#16a34a', '#22c55e'], rail: '#78716c', sleeper: '#c2410c', cloud: '#fed7aa' },
  night: { mountains: ['#334155', '#3f4a5f', '#2b3648'], trees: ['#065f46', '#047857'], rail: '#94a3b8', sleeper: '#475569', cloud: null },
};

function Cloud({ width = 30, top = 2, duration = 20, delay = 0, opacity = 0.4, color = '#cbd5e1' }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ top }}
      initial={{ left: '-20%' }}
      animate={{ left: '120%' }}
      transition={{ duration, repeat: Infinity, delay, ease: 'linear' }}
    >
      <svg width={width} height={width * 0.55} viewBox="0 0 44 24" style={{ opacity }}>
        <ellipse cx="12" cy="16" rx="10" ry="7" fill={color} />
        <ellipse cx="22" cy="10" rx="12" ry="9" fill={color} />
        <ellipse cx="33" cy="16" rx="9" ry="7" fill={color} />
        <rect x="6" y="14" width="32" height="8" rx="4" fill={color} />
      </svg>
    </motion.div>
  );
}

function Star({ left, top, delay }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white pointer-events-none"
      style={{ left, top, width: 1.5, height: 1.5 }}
      animate={{ opacity: [0.2, 1, 0.2] }}
      transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

function Mountain({ left, width = 64, height = 30, color = '#cbd5e1', snow = false }) {
  const base = [0, height];
  const peak1 = [width * 0.38, height * 0.14];
  const dip = [width * 0.53, height * 0.53];
  const peak2 = [width * 0.69, height * 0.02];
  const end = [width, height];
  const snowTip = [
    [peak2[0], peak2[1]],
    [peak2[0] + width * 0.08, peak2[1] + height * 0.24],
    [peak2[0] - width * 0.08, peak2[1] + height * 0.24],
  ];

  return (
    <div className="absolute bottom-4 pointer-events-none" style={{ left }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <polygon
          points={`${base.join(',')} ${peak1.join(',')} ${dip.join(',')} ${peak2.join(',')} ${end.join(',')}`}
          fill={color}
        />
        {snow && <polygon points={snowTip.map((p) => p.join(',')).join(' ')} fill="#f1f5f9" />}
      </svg>
    </div>
  );
}

function Waterfall({ left, height = 14 }) {
  return (
    <div className="absolute bottom-4 pointer-events-none overflow-hidden" style={{ left, width: 5, height }}>
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 -translate-x-1/2 w-[1.5px] bg-sky-300/80 rounded-full"
          style={{ height: 5 }}
          initial={{ top: -5 }}
          animate={{ top: height }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.3, ease: 'linear' }}
        />
      ))}
      <motion.div
        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2.5 h-[3px] bg-sky-200/60 rounded-full"
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function Tree({ left, size = 16, color = '#4ade80' }) {
  return (
    <div className="absolute bottom-4 pointer-events-none" style={{ left }}>
      <svg width={size} height={size * 1.4} viewBox="0 0 16 22">
        <polygon points="8,0 13,8 3,8" fill={color} />
        <polygon points="8,5 14,13 2,13" fill={color} />
        <polygon points="8,10 15,19 1,19" fill={color} />
        <rect x="6.5" y="18" width="3" height="4" fill="#78350f" />
      </svg>
    </div>
  );
}

function StreetLight({ left, lit }) {
  return (
    <div className="absolute bottom-4 pointer-events-none flex flex-col items-center" style={{ left }}>
      <div className="relative flex items-center justify-center" style={{ width: 14, height: 14 }}>
        {lit && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 14,
              height: 14,
              background: 'radial-gradient(closest-side, rgba(253,224,71,0.85), rgba(253,224,71,0) 70%)',
            }}
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <div
          className="relative rounded-full"
          style={{
            width: 4.5,
            height: 4.5,
            backgroundColor: lit ? '#fde68a' : '#cbd5e1',
            boxShadow: lit ? '0 0 4px 1.5px rgba(253,224,71,0.9)' : 'none',
          }}
        />
      </div>
      <div style={{ width: 1.5, height: 11 }} className="bg-slate-500" />
      <div style={{ width: 6, height: 1.5 }} className="bg-slate-500 rounded-full" />
    </div>
  );
}

function SignalLight({ left }) {
  return (
    <div className="absolute bottom-4 pointer-events-none flex flex-col items-center" style={{ left }}>
      <div className="relative flex items-center justify-center rounded-sm bg-slate-800" style={{ width: 7, height: 8 }}>
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 10,
            height: 10,
            background: 'radial-gradient(closest-side, rgba(239,68,68,0.8), rgba(239,68,68,0) 70%)',
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="relative rounded-full"
          style={{ width: 3.5, height: 3.5, backgroundColor: '#ef4444', boxShadow: '0 0 4px 1.5px rgba(239,68,68,0.9)' }}
        />
      </div>
      <div style={{ width: 1.5, height: 13 }} className="bg-slate-500" />
      <div style={{ width: 6, height: 1.5 }} className="bg-slate-500 rounded-full" />
    </div>
  );
}

const nightStars = [
  { left: '10%', top: '10%', delay: 0 },
  { left: '24%', top: '30%', delay: 0.6 },
  { left: '47%', top: '5%', delay: 1.1 },
  { left: '63%', top: '25%', delay: 0.3 },
  { left: '85%', top: '12%', delay: 0.9 },
];

function NavTrainRunner() {
  const period = useTimeOfDay();
  const theme = skyTheme[period] ?? skyTheme.noon;
  const palette = scenePalette[period] ?? scenePalette.noon;
  const [m1, m2, m3] = palette.mountains;
  const [t1, t2] = palette.trees;

  return (
    <div
      className={`hidden md:block relative flex-1 h-12 mx-4 overflow-hidden rounded-lg bg-gradient-to-b ${theme.gradient}`}
    >
      {theme.isDark ? (
        nightStars.map((s, i) => <Star key={i} {...s} />)
      ) : (
        <>
          <Cloud width={24} top={0} duration={22} delay={0} opacity={0.5} color={palette.cloud} />
          <Cloud width={30} top={6} duration={28} delay={9} opacity={0.35} color={palette.cloud} />
        </>
      )}

      {/* mountains in the far background, evenly spaced with clear gaps */}
      <Mountain left="4%" width={54} height={22} color={m1} snow />
      <Mountain left="42%" width={48} height={19} color={m2} />
      <Mountain left="78%" width={52} height={21} color={m3} snow />
      <Waterfall left="9%" height={14} />

      {/* trees, placed in the gaps between mountains so nothing overlaps */}
      <Tree left="13%" size={12} color={t1} />
      <Tree left="20%" size={14} color={t2} />
      <Tree left="26%" size={13} color={t2} />
      <Tree left="32%" size={15} color={t1} />
      <Tree left="47%" size={13} color={t2} />
      <Tree left="55%" size={15} color={t1} />
      <Tree left="60%" size={13} color={t2} />
      <Tree left="66%" size={15} color={t1} />
      <Tree left="86%" size={13} color={t2} />
      <Tree left="92%" size={13} color={t2} />

      {/* trackside lamps, lit at dusk/night */}
      <StreetLight left="8%" lit={period === 'evening' || period === 'night'} />
      <StreetLight left="17%" lit={period === 'evening' || period === 'night'} />
      <StreetLight left="37%" lit={period === 'evening' || period === 'night'} />
      <StreetLight left="45%" lit={period === 'evening' || period === 'night'} />
      <StreetLight left="50%" lit={period === 'evening' || period === 'night'} />
      <StreetLight left="71%" lit={period === 'evening' || period === 'night'} />
      <StreetLight left="90%" lit={period === 'evening' || period === 'night'} />

      {/* red signal posts at the start, middle, and end */}
      <SignalLight left="1%" />
      <SignalLight left="49%" />
      <SignalLight left="97%" />

      {/* railway track: two rails + sleepers */}
      <div className="absolute inset-x-0 bottom-2 h-2">
        <div
          className="absolute inset-x-0 top-0 h-full opacity-80"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${palette.sleeper} 0px, ${palette.sleeper} 3px, transparent 3px, transparent 9px)`,
          }}
        />
        <div className="absolute inset-x-0 top-0 h-[1.5px] rounded-full" style={{ backgroundColor: palette.rail }} />
        <div className="absolute inset-x-0 bottom-0 h-[1.5px] rounded-full" style={{ backgroundColor: palette.rail }} />
      </div>

      <motion.div
        className="absolute bottom-2"
        initial={{ left: '-15%' }}
        animate={{ left: '110%' }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      >
        {/* glowing halo that travels with the train */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ width: 70, height: 40, background: 'radial-gradient(closest-side, rgba(251,146,60,0.55), rgba(251,146,60,0) 70%)' }}
          animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* motion trail streaking behind */}
        <motion.div
          className="absolute right-full top-1/2 -translate-y-1/2 h-1.5 w-14 rounded-full bg-gradient-to-l from-orange-400/90 to-transparent"
          animate={{ opacity: [0.9, 0.4, 0.9] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          animate={{ y: [0, -2, 0, -2, 0] }}
          transition={{ duration: 0.25, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transform: 'scale(0.6)', transformOrigin: 'left bottom' }}
        >
          <TrainIcon />
        </motion.div>
      </motion.div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V9" />
    </svg>
  );
}

function FindTrainsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </svg>
  );
}

function TatkalIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
      <path d="M13 5v2M13 11v2M13 17v2" />
    </svg>
  );
}

function DelayReportsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 13v-2Z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function LiveStatusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m13 7 4 4" />
      <path d="m5 19 3-3" />
      <path d="m14.5 4.5 1-1a2.12 2.12 0 0 1 3 3l-1 1" />
      <path d="m9.5 14.5-5 5" />
      <path d="m18.5 9.5 1-1a2.12 2.12 0 0 1 3 3l-1 1" />
      <path d="M8 12 3 17l4 4 5-5" />
      <path d="m4 21 1-1" />
    </svg>
  );
}

function ExperienceIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

const menuLinks = [
  { to: '/', key: 'home', Icon: HomeIcon },
  { to: '/trains', key: 'trackTrains', Icon: FindTrainsIcon },
  { to: '/trains?tatkal=1', key: 'tatkalBooking', Icon: TatkalIcon },
  { to: '/trains?delay=1', key: 'delayReports', Icon: DelayReportsIcon },
  { to: '/trains?live=1', key: 'liveStatus', Icon: LiveStatusIcon },
  { to: '/trains?experience=1', key: 'passengerExperience', Icon: ExperienceIcon },
];

function MenuButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        whileTap={{ scale: 0.92 }}
        className={`p-2 rounded-lg flex flex-col items-center justify-center gap-[4px] transition-colors ${
          open ? 'bg-orange-100' : 'hover:bg-slate-100'
        }`}
      >
        <motion.span
          animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`block w-5 h-0.5 rounded-full ${open ? 'bg-orange-500' : 'bg-slate-700'}`}
        />
        <motion.span
          animate={open ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="block w-5 h-0.5 bg-slate-700 rounded-full"
        />
        <motion.span
          animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`block w-5 h-0.5 rounded-full ${open ? 'bg-orange-500' : 'bg-slate-700'}`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-0 mt-2 w-56 rounded-2xl border border-slate-200 shadow-xl shadow-slate-500/10 z-20"
          >
            <div className="rounded-2xl bg-white overflow-hidden p-1.5">
              {menuLinks.map((link, i) => {
                const active = location.pathname + location.search === link.to;
                return (
                  <motion.div
                    key={link.key}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.15 }}
                  >
                    <Link
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        active ? 'bg-orange-50 text-orange-700' : 'text-slate-700 hover:bg-slate-50 hover:text-orange-600'
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                          active ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <link.Icon />
                      </span>
                      {t(`navbar.menu.${link.key}`)}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function StationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="M12 21s-7-5.686-7-11a7 7 0 0 1 14 0c0 5.314-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function AvatarCircle({ user, size = 28 }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="rounded-full bg-orange-100 text-orange-700 font-semibold flex items-center justify-center flex-shrink-0"
    >
      {user.name.charAt(0).toUpperCase()}
    </span>
  );
}

function AccountMenu({ onLogoutClick }) {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio || '',
    avatar: user.avatar || '',
    links: user.links?.length ? user.links : [''],
    phone: user.phone || '',
    homeStation: user.homeStation || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setEditing(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function startEditing() {
    setForm({
      name: user.name,
      bio: user.bio || '',
      avatar: user.avatar || '',
      links: user.links?.length ? user.links : [''],
      phone: user.phone || '',
      homeStation: user.homeStation || '',
    });
    setError('');
    setAvatarError('');
    setEditing(true);
  }

  function updateLinkAt(index, value) {
    setForm((f) => ({ ...f, links: f.links.map((l, i) => (i === index ? value : l)) }));
  }

  function addLinkField() {
    setForm((f) => (f.links.length >= 10 ? f : { ...f, links: [...f.links, ''] }));
  }

  function removeLinkAt(index) {
    setForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== index) }));
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setForm((f) => ({ ...f, avatar: dataUrl }));
    } catch {
      setAvatarError('Could not load that image');
    } finally {
      e.target.value = '';
    }
  }

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable, ignore
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateProfile({
        name: form.name,
        bio: form.bio,
        avatar: form.avatar,
        links: form.links.map((l) => l.trim()).filter(Boolean),
        phone: form.phone,
        homeStation: form.homeStation,
      });
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200 transition-colors"
      >
        <span className="relative flex-shrink-0">
          <AvatarCircle user={user} size={28} />
          <span
            className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"
            title="Active now"
          />
        </span>
        <span className="text-sm text-black font-medium hidden lg:inline">{user.name}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-20"
          >
            {!editing ? (
              <div>
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-200 via-amber-100 to-orange-50 border-b border-orange-200">
                  <div className="relative flex-shrink-0">
                    <div className="rounded-full ring-2 ring-orange-200">
                      <AvatarCircle user={user} size={48} />
                    </div>
                    <span
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white"
                      title={t('navbar.activeNow')}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 truncate">{user.name}</span>
                      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {user.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <button
                        onClick={handleCopyEmail}
                        aria-label={t('navbar.copyEmail')}
                        className="text-slate-400 hover:text-orange-600 flex-shrink-0"
                      >
                        {copied ? <CheckIcon /> : <CopyIcon />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 -mt-px bg-white max-h-[60vh] overflow-y-auto">
                  <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap break-words">
                    {user.bio || <span className="text-slate-400 italic">{t('navbar.noBio')}</span>}
                  </p>

                  {user.links?.length > 0 && (
                    <div className="flex flex-col gap-1 mt-2">
                      {user.links.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 hover:underline min-w-0"
                        >
                          <LinkIcon />
                          <span className="truncate">{link.replace(/^https?:\/\//, '')}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {(user.phone || user.homeStation) && (
                    <div className="flex flex-col gap-1 mt-2">
                      {user.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <PhoneIcon />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.homeStation && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <StationIcon />
                          <span className="truncate">{user.homeStation}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-orange-100/70">
                    <button
                      onClick={startEditing}
                      className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <EditIcon />
                      {t('navbar.editProfile')}
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        onLogoutClick();
                      }}
                      className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <LogoutIcon />
                      {t('navbar.logOut')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave}>
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-200 via-amber-100 to-orange-50 border-b border-orange-200">
                  <span className="relative flex-shrink-0">
                    <div className="rounded-full ring-2 ring-orange-200">
                      <AvatarCircle user={{ name: form.name || user.name, avatar: form.avatar }} size={56} />
                    </div>
                    <span
                      className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white"
                      title="Active now"
                    />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-medium px-2.5 py-1 rounded-full bg-white text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
                      >
                        {t('navbar.changePhoto')}
                      </button>
                      {form.avatar && (
                        <button
                          type="button"




                    

# TrainMitra

**🔗 Live: [train-mitra.vercel.app](https://train-mitra.vercel.app)**

**Real train status, from real passengers.**

IRCTC gives you the official timetable, but nothing about what's actually happening on a train right now — is it delayed, where is it, how fast does Tatkal really sell out. TrainMitra fills exactly that gap: real passengers report delays and live location in real time, and share honest Tatkal and journey experience ratings — no fake GPS, no fabricated ticket-availability predictions, just crowdsourced data from people actually on board.

No official IRCTC data. Not affiliated with Indian Railways. Free to use, no ads, no paid tiers.

## 📂 Project Structure

```text
└── kaushikbanik505-train-mitra/
    ├── README.md
    ├── backend/
    │   ├── package.json
    │   ├── .env.example
    │   ├── backend/
    │   │   └── src/
    │   │       ├── socket.js
    │   │       ├── controllers/
    │   │       │   └── liveStatusController.js
    │   │       ├── models/
    │   │       │   └── LiveStatusUpdate.js
    │   │       └── routes/
    │   │           └── liveStatusRoutes.js
    │   ├── scripts/
    │   │   ├── generate-backend-source.mjs
    │   │   └── promote-admin.js
    │   └── src/
    │       ├── server.js
    │       ├── socket.js
    │       ├── config/
    │       │   └── db.js
    │       ├── controllers/
    │       │   ├── adminController.js
    │       │   ├── authController.js
    │       │   ├── chatController.js
    │       │   ├── delayReportController.js
    │       │   ├── journeyExperienceController.js
    │       │   ├── liveStatusController.js
    │       │   ├── tatkalExperienceController.js
    │       │   ├── trainController.js
    │       │   └── userController.js
    │       ├── data/
    │       │   └── cityAliases.js
    │       ├── jobs/
    │       │   └── dailyCleanup.js
    │       ├── middleware/
    │       │   ├── auth.js
    │       │   └── chatRateLimit.js
    │       ├── models/
    │       │   ├── DelayReport.js
    │       │   ├── JourneyExperience.js
    │       │   ├── LiveStatusUpdate.js
    │       │   ├── TatkalExperience.js
    │       │   ├── Train.js
    │       │   ├── User.js
    │       │   └── voteSchema.js
    │       ├── routes/
    │       │   ├── adminRoutes.js
    │       │   ├── authRoutes.js
    │       │   ├── chatRoutes.js
    │       │   ├── delayReportRoutes.js
    │       │   ├── healthRoutes.js
    │       │   ├── journeyExperienceRoutes.js
    │       │   ├── liveStatusRoutes.js
    │       │   ├── tatkalExperienceRoutes.js
    │       │   ├── trainRoutes.js
    │       │   └── userRoutes.js
    │       ├── seed/
    │       │   ├── importTrains.js
    │       │   └── seedTrains.js
    │       ├── services/
    │       │   ├── chatTools.js
    │       │   └── geminiChat.js
    │       └── utils/
    │           ├── dateUtils.js
    │           ├── email.js
    │           ├── generateTokens.js
    │           ├── moderation.js
    │           └── reputation.js
    ├── docs/
    │   └── PROJECT_SPEC.md
    └── frontend/
        ├── README.md
        ├── eslint.config.js
        ├── index.html
        ├── package.json
        ├── postcss.config.js
        ├── tailwind.config.js
        ├── verify_learner_gate.mjs
        ├── vite.config.js
        ├── .env.example
        ├── frontend/
        │   └── src/
        │       ├── socket.js
        │       └── hooks/
        │           └── useTrainRoom.js
        ├── scripts/
        │   └── generate_pwa_icons.py
        └── src/
            ├── App.jsx
            ├── index.css
            ├── main.jsx
            ├── socket.js
            ├── api/
            │   └── client.js
            ├── components/
            │   ├── AboutBadge.jsx
            │   ├── AdminBadge.jsx
            │   ├── Bubbles.jsx
            │   ├── ChatBadge.jsx
            │   ├── ChatPanel.jsx
            │   ├── DelayReports.jsx
            │   ├── DeveloperBadge.jsx
            │   ├── DigitalClock.jsx
            │   ├── FAQ.jsx
            │   ├── FeatureGrid.jsx
            │   ├── Footer.jsx
            │   ├── Hero.jsx
            │   ├── JourneyExperience.jsx
            │   ├── LanguageBadge.jsx
            │   ├── LearnerBadge.jsx
            │   ├── learnerUI.jsx
            │   ├── LiveStatsBadges.jsx
            │   ├── LiveStatusFeed.jsx
            │   ├── Navbar.jsx
            │   ├── OfflineBanner.jsx
            │   ├── OwnerOnlyRoute.jsx
            │   ├── PageTransition.jsx
            │   ├── ScrollProgress.jsx
            │   ├── SkyBackground.jsx
            │   ├── StationClock.jsx
            │   ├── TatkalExperience.jsx
            │   ├── TrainTrack.jsx
            │   ├── TrustBadge.jsx
            │   └── WhatsNextBadge.jsx
            ├── constants/
            │   ├── access.js
            │   └── reputation.js
            ├── content/
            │   ├── aboutContent.js
            │   ├── developerContent.js
            │   └── learnerContent.js
            ├── context/
            │   └── AuthContext.jsx
            ├── hooks/
            │   ├── useLiveStats.js
            │   ├── useOnlineStatus.js
            │   ├── useQueueCount.js
            │   ├── useTimeOfDay.js
            │   └── useTrainRoom.js
            ├── i18n/
            │   ├── index.js
            │   └── locales/
            │       ├── bn.json
            │       ├── en.json
            │       ├── hi.json
            │       ├── kn.json
            │       ├── mr.json
            │       ├── or.json
            │       ├── pa.json
            │       ├── ta.json
            │       └── te.json
            ├── offline/
            │   ├── offlineQueue.js
            │   └── offlineSync.js
            ├── pages/
            │   ├── About.jsx
            │   ├── AdminDashboard.jsx
            │   ├── Developer.jsx
            │   ├── Home.jsx
            │   ├── Learner.jsx
            │   ├── LearnerBackend.jsx
            │   ├── LearnerFrontend.jsx
            │   ├── Login.jsx
            │   ├── Register.jsx
            │   ├── TrainSearch.jsx
            │   ├── VerifyEmail.jsx
            │   └── WhatsNext.jsx
            └── utils/
                └── resizeImage.js
```


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

## design 
<img src="https://github.com/user-attachments/assets/b80b8670-cc0e-44af-bdaa-19bb4b5192eb" alt="diagram" style="max-width: 100%; height: auto;">


- Match what's already there: no comments unless something is genuinely non-obvious, no new abstraction for a one-off case, Tailwind utility classes instead of new CSS files.
- Run both the backend and frontend locally (see [Getting started](#getting-started)) and actually click through whatever you changed before calling it done — a build passing isn't the same as a feature working.

---

Designed & developed by **Kaushik Banik**.
