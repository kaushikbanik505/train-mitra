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
