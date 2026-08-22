// Bump this by hand whenever a real change ships - deliberately not auto-"today",
// since that would silently claim freshness on days nothing actually changed.
export const lastUpdated = 'August 22, 2026';

export const techStack = [
  { name: 'React 18', group: 'Frontend' },
  { name: 'Vite', group: 'Frontend' },
  { name: 'React Router', group: 'Frontend' },
  { name: 'Tailwind CSS', group: 'Frontend' },
  { name: 'Framer Motion', group: 'Frontend' },
  { name: 'Axios', group: 'Frontend' },
  { name: 'Socket.io Client', group: 'Frontend' },
  { name: 'Recharts', group: 'Frontend' },
  { name: 'react-i18next', group: 'Frontend' },
  { name: 'vite-plugin-pwa (Workbox)', group: 'Frontend' },
  { name: 'Node.js', group: 'Backend' },
  { name: 'Express', group: 'Backend' },
  { name: 'MongoDB + Mongoose', group: 'Backend' },
  { name: 'Socket.io', group: 'Backend' },
  { name: 'JSON Web Tokens', group: 'Backend' },
  { name: 'bcrypt', group: 'Backend' },
  { name: 'node-cron', group: 'Backend' },
  { name: 'Resend (email)', group: 'Backend' },
  { name: 'Google Gemini API', group: 'AI' },
  { name: '@google/genai SDK', group: 'AI' },
];

export const prerequisites = [
  'Node.js 18+ and npm',
  'A MongoDB database - a free MongoDB Atlas cluster works fine',
  'A free Gemini API key for the AI chat assistant - from aistudio.google.com/apikey',
  'A Resend API key, only if you want outgoing email (verification etc.) to actually send - resend.com',
];

export const setupSteps = {
  backend: [
    { cmd: 'cd backend' },
    { cmd: 'npm install' },
    { cmd: 'cp .env.example .env', note: 'then fill in the values - see Environment variables below' },
    { cmd: 'npm run dev', note: 'starts the API on http://localhost:5000 with auto-reload (nodemon)' },
  ],
  frontend: [
    { cmd: 'cd frontend' },
    { cmd: 'npm install' },
    { cmd: 'cp .env.example .env', note: 'the default already points at http://localhost:5000/api' },
    { cmd: 'npm run dev', note: 'starts the site on http://localhost:5173' },
  ],
  seeding: [
    { cmd: 'cd backend' },
    { cmd: 'npm run seed:trains', note: 'populates the database with train data so search/lookup has something to return' },
  ],
};

export const envVars = {
  backend: [
    { name: 'PORT', desc: 'Port the API listens on', example: '5000' },
    { name: 'MONGO_URI', desc: 'MongoDB connection string', example: 'mongodb+srv://user:pass@cluster.mongodb.net/trainmitra' },
    { name: 'JWT_ACCESS_SECRET', desc: 'Signing secret for access tokens - any long random string', example: 'a 64+ char random string' },
    { name: 'JWT_REFRESH_SECRET', desc: 'Signing secret for refresh tokens - must differ from the access secret', example: 'a different 64+ char string' },
    { name: 'JWT_ACCESS_EXPIRES', desc: 'Access token lifetime', example: '15m' },
    { name: 'JWT_REFRESH_EXPIRES', desc: 'Refresh token lifetime', example: '7d' },
    { name: 'CLIENT_ORIGIN', desc: 'Comma-separated frontend origin(s) allowed by CORS', example: 'http://localhost:5173' },
    { name: 'RESEND_API_KEY', desc: 'Resend API key for outgoing email (optional)', example: 're_...' },
    { name: 'EMAIL_FROM', desc: 'From-address used for outgoing email', example: 'TrainMitra <onboarding@resend.dev>' },
    { name: 'GEMINI_API_KEY', desc: 'Google Gemini API key - powers the AI chat assistant', example: 'AIza...' },
  ],
  frontend: [
    { name: 'VITE_API_BASE_URL', desc: 'Base URL the frontend calls for the API', example: 'http://localhost:5000/api' },
  ],
};

export const apiEndpoints = [
  {
    group: 'Health',
    base: '/api/health',
    routes: [
      { method: 'GET', path: '/', auth: 'public', desc: 'Liveness check' },
      { method: 'GET', path: '/admin-only', auth: 'admin', desc: 'Diagnostic route to sanity-check auth + role middleware' },
    ],
  },
  {
    group: 'Auth',
    base: '/api/auth',
    routes: [
      { method: 'POST', path: '/register', auth: 'public', desc: 'Create an account' },
      { method: 'POST', path: '/login', auth: 'public', desc: 'Log in - returns an access token and a refresh token' },
      { method: 'POST', path: '/refresh', auth: 'public', desc: 'Exchange a refresh token for a new access token' },
      { method: 'POST', path: '/verify-email', auth: 'public', desc: 'Verify an email address using its token' },
      { method: 'POST', path: '/resend-verification', auth: 'public', desc: 'Resend the verification email' },
    ],
  },
  {
    group: 'Users',
    base: '/api/users',
    routes: [
      { method: 'GET', path: '/me', auth: 'token', desc: "Get the logged-in user's profile" },
      { method: 'PATCH', path: '/me', auth: 'token', desc: "Update the logged-in user's profile" },
    ],
  },
  {
    group: 'Trains',
    base: '/api/trains',
    routes: [
      { method: 'GET', path: '/search?q=', auth: 'public', desc: 'Search trains by number or name' },
      { method: 'GET', path: '/stations/search?q=', auth: 'public', desc: 'Resolve a city/station name to station codes' },
      { method: 'GET', path: '/route?from=&to=', auth: 'public', desc: 'Find direct trains between two station codes' },
      { method: 'GET', path: '/:trainNumber', auth: 'public', desc: "One train's full details and stop-by-stop timings" },
    ],
  },
  {
    group: 'Delay reports',
    base: '/api/delay-reports',
    routes: [
      { method: 'GET', path: '/quota', auth: 'token', desc: "Check the caller's remaining daily posting quota" },
      { method: 'GET', path: '/:train', auth: 'public', desc: "Today's delay reports for a train, ranked by votes" },
      { method: 'POST', path: '/', auth: 'token', desc: 'Submit a delay report' },
      { method: 'POST', path: '/:id/vote', auth: 'token', desc: 'Upvote or downvote a report' },
    ],
  },
  {
    group: 'Live status',
    base: '/api/live-status',
    routes: [
      { method: 'GET', path: '/quota', auth: 'token', desc: "Check the caller's remaining daily posting quota" },
      { method: 'GET', path: '/:train', auth: 'public', desc: "Today's live status updates for a train" },
      { method: 'POST', path: '/', auth: 'token', desc: 'Submit a live status update' },
      { method: 'POST', path: '/:id/vote', auth: 'token', desc: 'Upvote or downvote an update' },
    ],
  },
  {
    group: 'Tatkal experience',
    base: '/api/tatkal-experience',
    routes: [
      { method: 'GET', path: '/:train', auth: 'public', desc: 'Average minutes-to-sellout for a train, by seat class' },
      { method: 'POST', path: '/', auth: 'token', desc: 'Submit a Tatkal sellout-time estimate' },
    ],
  },
  {
    group: 'Journey experience',
    base: '/api/journey-experience',
    routes: [
      { method: 'GET', path: '/:train/mine', auth: 'token', desc: "The caller's own rating for a train" },
      { method: 'GET', path: '/:train', auth: 'public', desc: 'Average ratings and recent comments for a train' },
      { method: 'POST', path: '/', auth: 'token', desc: 'Submit or update a journey experience rating' },
    ],
  },
  {
    group: 'Chat',
    base: '/api/chat',
    routes: [
      { method: 'POST', path: '/', auth: 'public', desc: 'Send a message to the AI assistant (rate-limited per IP)' },
    ],
  },
  {
    group: 'Admin',
    base: '/api/admin',
    routes: [
      { method: 'GET', path: '/overview', auth: 'admin', desc: 'Platform-wide counts (users, online now, today\'s reports, experience totals)' },
      { method: 'GET', path: '/online-users', auth: 'admin', desc: 'Who is currently online, by name (from the JWT sent on socket connect); anonymous connections listed as guests' },
      { method: 'GET', path: '/delay-reports', auth: 'admin', desc: "Every delay report posted today, across all trains, worst-voted first" },
      { method: 'DELETE', path: '/delay-reports/:id', auth: 'admin', desc: 'Remove a delay report' },
      { method: 'GET', path: '/live-status', auth: 'admin', desc: "Every live status update posted today, across all trains, worst-voted first" },
      { method: 'DELETE', path: '/live-status/:id', auth: 'admin', desc: 'Remove a live status update' },
      { method: 'GET', path: '/users', auth: 'admin', desc: 'List every registered user with role and ban status' },
      { method: 'PATCH', path: '/users/:id/ban', auth: 'admin', desc: "Toggle a user's ban status (blocks login; an admin account can't be banned)" },
    ],
  },
];

export const contributing = [
  "This has been a solo, incrementally-built project without a public repo yet - if a friend hands you a copy of the code, here's how to work on it without fighting the existing patterns.",
  'Match what\'s already there: no comments unless something is genuinely non-obvious, no new abstraction for a one-off case, Tailwind utility classes instead of new CSS files, and components named/organised like their neighbors.',
  "Run both the backend and frontend locally (see above) and actually click through whatever you changed before calling it done - a build passing isn't the same as a feature working.",
  'This developer page is meant to stay accurate. If you add or change a feature, update the relevant section here in the same change.',
];

export const philosophy = [
  {
    title: 'No fake data, ever',
    body: "There's no official GPS feed and no real IRCTC seat-availability feed behind this app. Every delay reason, every live location update, every Tatkal sellout estimate comes from a passenger typing it in - never a simulation dressed up as fact. Where the app doesn't know something, it says so instead of guessing.",
  },
  {
    title: 'Server decides the date, never the client',
    body: 'For delay reports and live status updates, "today" is computed server-side in IST (UTC+5:30) at the moment of posting - never taken from the request body. That closes off backdating or forward-dating a report to dodge the daily reset or moderation limits.',
  },
  {
    title: 'One shared clock drives the whole visual language',
    body: "A single useTimeOfDay hook (morning / noon / evening / night, by real local hour) drives the sky gradient, sun/moon/stars, and accent colors across the Hero, the FAQ section, and the chat assistant panel - so the entire site's mood shifts together with the actual time of day, not just one isolated widget.",
  },
  {
    title: 'Built incrementally, one step at a time',
    body: "Nothing shipped in one giant push. Each feature was built, explained, and confirmed before the next one started - accounts first, then train lookup, then Tatkal info, then delay reports, then live status, then experience ratings, then this page. That's also why this page exists: it gets updated every time something real ships, not written once and left stale.",
  },
];

export const features = [
  {
    icon: '🔐',
    title: 'Accounts & roles',
    body: 'Register/login with JWT access + refresh tokens (bcrypt-hashed passwords). Every account has a role - guest, user, moderator, or admin - that governs what it can do.',
  },
  {
    icon: '🔎',
    title: 'Train lookup',
    body: 'Search any train by number or name, or find every direct train between two stations - including city-alias resolution, so searching "Kolkata" surfaces Howrah Jn and Sealdah even though neither name contains the word.',
  },
  {
    icon: '⏱️',
    title: 'Tatkal booking info',
    body: "A fixed, transparent rule, not a live feed: AC classes open at 10:00 AM and Sleeper/Second Sitting at 11:00 AM, one day before the journey, from the train's origin station - computed and countdown-timed for every train, plus a direct link to book on IRCTC.",
  },
  {
    icon: '📣',
    title: 'Delay reports',
    body: 'Crowdsourced delay reasons, ranked by community upvotes/downvotes. Resets automatically at midnight IST every day.',
  },
  {
    icon: '🛰️',
    title: 'Live status feed',
    body: "Real-time station/platform updates from passengers actually on board, pushed live to everyone else tracking that train via Socket.io - no GPS, no satellite, just people.",
  },
  {
    icon: '🏅',
    title: 'Contributor trust',
    body: "A persistent reputation score per user (User.reputationScore), separate from a report's own daily-reset upvote/downvote count - built from the net votes other people (never yourself - self-votes don't move it) give your delay reports and live status updates over time. Once it crosses a threshold, a small trusted-contributor badge shows next to that person's name on their posts.",
  },
  {
    icon: '💬',
    title: 'Passenger experience',
    body: 'Two things in one: Tatkal Experience (crowdsourced minutes-to-sellout per seat class) and Journey Experience (1-5 ratings for cleanliness, food, staff behaviour, punctuality, and safety, plus written comments).',
  },
  {
    icon: '📊',
    title: 'Live stats badges',
    body: 'The "online now" and "registered" counters on the homepage are driven live over the same Socket.io connection used for live status updates - not a static number.',
  },
  {
    icon: 'ℹ️',
    title: 'About',
    body: "A hover card on desktop, a dedicated page on mobile - explaining what the site is, why it's built this way, and how people use it, without needing to dig through the FAQ.",
  },
  {
    icon: '🤖',
    title: 'AI chat assistant',
    body: 'Full details below - it can answer using real TrainMitra data via tool-calling, or just chat like a general assistant.',
  },
  {
    icon: '🛡️',
    title: 'Admin dashboard',
    body: "Restricted to a single admin account (role checked server-side off the JWT, not just the frontend). Overview analytics, a live view of who's online right now by name, a moderation feed to delete spam delay reports/live updates, and user management with a ban toggle.",
  },
  {
    icon: '📴',
    title: 'Offline-friendly PWA',
    body: "Installable as an app (manifest + service worker via Workbox). Train search/route/schedule lookups are cached, so a train you've already opened stays viewable with no signal. Submitting a delay report or live status update while offline saves it locally (IndexedDB) instead of failing - it sends automatically the moment the connection comes back, with a small banner showing offline/queued state.",
  },
  {
    icon: '🌐',
    title: 'Regional language support',
    body: "A 'Language' badge next to Chat switches the site's own UI text live across 9 languages (English, Hindi, Bengali, Tamil, Marathi, Kannada, Punjabi, Odia, Telugu) via react-i18next, with the choice remembered in localStorage. Scoped to the site's own text - what a passenger actually types into a delay report or live status update is shown exactly as they wrote it, never auto-translated, since a mistranslated passenger report is worse than no translation.",
  },
];

export const moderation = [
  'Everyone gets a daily limit on how many delay reports and live status updates they can post.',
  "If one of a user's posts gets downvoted heavily enough, that user is blocked from posting again until the next day - automatically, no manual review needed.",
  'One vote per person per report/update; voting the same way twice toggles the vote off.',
  'Delay reports and live status updates both wipe at midnight IST - Tatkal Experience and Journey Experience are long-running community averages, so those are never reset.',
  'The admin account can delete individual delay reports or live status updates directly, and can ban a user (blocked from logging in at all) - both from the admin dashboard, both logged as an explicit action rather than automatic.',
];

export const chatAssistant = [
  {
    title: 'Model',
    body: 'Google Gemini (gemini-3.1-flash-lite) via the @google/genai SDK, with thinking effort set low - this is a lookup-and-answer assistant, not a reasoning task, so that trade cuts multi-second latency with no real quality loss.',
  },
  {
    title: 'Tool-calling into real data',
    body: 'Eight tools let the model query TrainMitra\'s own database live: search_trains, get_train_details, search_stations, search_route (resolves city/station names itself - no separate lookup round-trip needed), get_delay_reports, get_live_status, get_journey_experience, and get_tatkal_experience.',
  },
  {
    title: 'Scope',
    body: "Open-ended - it can chat about anything, not just trains - but it's instructed to always present crowdsourced data as passenger reports, never as guaranteed fact, and to never claim it can book tickets or handle payments (that always routes to IRCTC).",
  },
  {
    title: 'Guardrails',
    body: "Gemini's default safety filters are on, and the backend applies a per-IP rate limit to protect the free API quota from abuse. The API key lives server-side only - it's never sent to the browser.",
  },
];

export const security = [
  'Short-lived JWT access tokens plus longer-lived refresh tokens, with automatic silent refresh on the frontend.',
  'Passwords are hashed with bcrypt - never stored or logged in plain text.',
  'CORS is locked to an explicit allow-list of origins, not left open.',
  'All secrets (JWT signing keys, database URI, email API key, Gemini API key) live in a server-side .env file that is gitignored and never reaches the frontend bundle or version control.',
];
