// Every source file in the project, in real folder order, backend first. Each entry
// is a genuine read of the file (not guessed) with an importance rating out of 10 -
// how central that file is to the app actually working, not how long it is - plus a
// real explanation: what it does, how a request/render actually flows through it, and
// why it's built the way it is. Paired at render time with the file's real code by
// LearnerBackend.jsx / LearnerFrontend.jsx.
export const fileMap = [
  {
    section: 'Backend',
    groups: [
      {
        dir: 'backend/src/',
        files: [
          {
            name: 'server.js',
            rating: 10,
            explanation: [
              "The entrypoint - the only file you run directly (npm run dev → nodemon src/server.js). It loads .env first, registers a process-level handler for unhandled promise rejections and uncaught exceptions (so a bug crashes cleanly into a restart instead of hanging in a broken state), then builds the Express app: CORS with an explicit allow-list, JSON body parsing, and every route module mounted under its /api/* prefix.",
              "Startup order matters here: it creates the HTTP server and hands it to initSocket() before ever calling connectDB(). Only once Mongo actually connects does it seed the live 'registered' count from the User collection, schedule the midnight cleanup cron job, and finally start listening. If Mongo can't connect at all, the process exits rather than serving traffic against a database it can't reach.",
            ],
          },
          {
            name: 'socket.js',
            rating: 9,
            explanation: [
              "Owns the single Socket.io Server instance for the whole backend. On every new connection it broadcasts the updated online count to everyone and sends the current registered count to just that new client - then, because those two pushes can race ahead of the frontend's listeners being ready, it also answers an explicit stats:request event on demand.",
              "join_train_room / leave_train_room let a client scope itself to one train+date's room (see the roomName() convention explained in the Learner deep-dive above), and emitToTrainRoom() is what delayReportController.js and liveStatusController.js call after every create/vote to push the update to just that room instead of every connected client site-wide.",
              "getOnlineCount() is a one-line accessor onto the same io.engine.clientsCount used internally for the live 'online now' badge - added so the admin dashboard's overview tab can read the current connection count without duplicating the Socket.io instance.",
              "identifySocket() runs on every new connection: verifies the JWT the frontend sends as socket.handshake.auth.token (if any), looks up that user's {name, role}, and stores it in an in-memory onlineUsers Map keyed by socket.id - a token-less or invalid-token connection is kept as an anonymous guest entry rather than rejected. getOnlineUsers() reads that Map back out, collapsing multiple tabs/devices from the same signed-in user into one row (earliest connection wins) while listing guests individually, since they have no identity to dedupe on - this is what powers the admin dashboard's 'who's online, by name' view.",
            ],
          },
        ],
      },
      {
        dir: 'backend/src/config/',
        files: [
          {
            name: 'db.js',
            rating: 7,
            explanation: [
              "Connects Mongoose to MongoDB Atlas, with two real production concerns baked in. First, it points Node's DNS resolver straight at Google DNS (8.8.8.8/8.8.4.4) because Windows' own resolver intermittently refuses the SRV lookup mongodb+srv:// URIs need - unrelated to Atlas IP allow-lists, just a local DNS quirk.",
              "Second, connectDB() retries up to 10 times with a delay between attempts instead of failing on the first error, because on wake-from-sleep the network adapter can take a few seconds to reassociate - without the retry, restarting the dev server right after unlocking the laptop would crash it. It also wires 'error'/'disconnected'/'reconnected' listeners onto the connection so a mid-session drop gets logged instead of crashing the whole process via Node's default unhandled-error behavior.",
            ],
          },
        ],
      },
      {
        dir: 'backend/src/controllers/',
        files: [
          {
            name: 'authController.js',
            rating: 9,
            explanation: [
              "Five handlers: register, login, refresh, verifyEmail, resendVerification. register hashes the password with bcrypt, creates the user, fires off a verification email in the background (best-effort - a failed send doesn't block registration since verification isn't currently required to use the account), issues both JWTs, and stores the refresh token on the user document.",
              "login re-derives the hash comparison via bcrypt.compare and deliberately returns the identical error message whether the email doesn't exist or the password is wrong, so the endpoint can't be used to enumerate registered emails. Right after a successful password check it also rejects with 403 if user.isBanned is true - so a banned account can't log back in even with the correct password. refresh verifies the incoming refresh token's signature, then double-checks it against the one stored on the user record - if someone's stored token doesn't match (e.g. it was already rotated by a previous refresh, or the account was logged out elsewhere), the refresh is rejected even though the JWT itself is still validly signed.",
            ],
          },
          {
            name: 'trainController.js',
            rating: 9,
            explanation: [
              "The most-used read path in the app. searchTrains does a case-insensitive regex match on trainNumber/trainName. searchStations is heavier: it matches station name/code directly, then separately checks whether the query matches a known city alias (see cityAliases.js) and merges those station codes in too, deduping by station code with city matches taking priority.",
              "searchByRoute is the most involved: it looks for trains that stop at both the from and to codes with the from-stop's sequence before the to-stop's (so it doesn't return a train that passes through both stations in the wrong order). If nothing matches exactly, it falls back to checking every other station code in the same city cluster as either endpoint, so searching Howrah→X still finds a train that actually departs from Sealdah.",
            ],
          },
          {
            name: 'delayReportController.js',
            rating: 8,
            explanation: [
              "createReport is gated by two moderation checks before it ever touches the database: isBlockedToday (has this user's content been downvoted into a same-day block?) and hasReachedDelayReportLimit (daily quota). journeyDate is always todayIST(), never anything the client sends. On success it emits new_delay_report to that train's Socket.io room so everyone already viewing it sees it appear live.",
              "voteReport is the toggle-vote state machine covered in the Learner deep-dive above - no vote yet / same vote again (toggle off) / switching direction - and also re-broadcasts via vote_updated so vote counts update live for everyone in the room, not just the voter. It also captures net = upvotes − downvotes both before and after the mutation and hands the difference to applyReputationDelta() (reputation.js) - reusing the exact same net-score math that already drives the report's own displayed score, rather than duplicating the toggle/switch branching a second time just to compute a reputation delta.",
            ],
          },
          {
            name: 'liveStatusController.js',
            rating: 8,
            explanation: [
              "Structurally a near-mirror of delayReportController.js - same quota/block moderation gates, same server-authoritative journeyDate, same room-scoped broadcast pattern, same net-before/net-after applyReputationDelta() call inside voteUpdate - but for live location updates instead of delay reasons.",
              "The one extra piece of validation: createUpdate checks that the submitted stationName is actually one of that train's real stops (or its origin/destination) before accepting the update, so a report can't claim a train is somewhere it doesn't even go.",
            ],
          },
          {
            name: 'adminController.js',
            rating: 7,
            explanation: [
              "Eight handlers, every one reached only through requireRole('admin') in adminRoutes.js: getOverview (five counts run in parallel via Promise.all - total users, today's delay reports, today's live status updates, all-time Tatkal/Journey experience totals - plus the live online count from socket.js), listOnlineUsers (a thin wrapper around socket.js's getOnlineUsers() - who's actually connected, by name, not just a count), listDelayReports/listLiveStatus (today's items across every train, not scoped to one, sorted worst-downvoted-first so a spam wave surfaces at the top instead of needing to be found), their matching delete handlers, and listUsers/toggleBan (listUsers now also selects reputationScore so the admin Users table can show it).",
              "toggleBan refuses to touch a role: 'admin' account - protecting the single admin seat from being locked out by mistake - and flips isBanned rather than deleting anything, so a banned user's history stays intact and reversible; only their ability to log in is cut off, enforced separately in authController.js.",
            ],
          },
          {
            name: 'journeyExperienceController.js',
            rating: 7,
            explanation: [
              "getInsight is the dynamic-aggregation-pipeline example covered in the Learner deep-dive above - it builds the $group stage's $avg fields from the RATING_FIELDS array in a loop, then computes the overall average in plain JS after the aggregation returns, plus fetches the 10 most recent written comments separately.",
              "submitExperience uses findOneAndUpdate with upsert: true against the unique (trainNumber, reportedBy) index, so submitting again from the same user updates their existing rating in place instead of creating a duplicate - the schema's uniqueness constraint doubles as the anti-spam rule here, no separate quota check needed.",
            ],
          },
          {
            name: 'tatkalExperienceController.js',
            rating: 6,
            explanation: [
              "The simplest of the write-and-aggregate controllers. getInsight groups by seatCategory (AC/Sleeper) and averages estimatedMinutesToSellOut per group, rounded to one decimal. submitExperience validates the category is one of the two allowed values and the minutes are between 0-180 before creating a new report - unlike Journey Experience, repeat submissions here just add another data point rather than upserting one per user, since \"how fast did it sell out this time\" is naturally a per-attempt value.",
            ],
          },
          {
            name: 'chatController.js',
            rating: 6,
            explanation: [
              "The thinnest controller in the codebase - validates that message is a non-empty string under 1000 characters, then hands off to geminiChat.js's sendChatMessage() and returns whatever text comes back. All the real complexity (tool-calling, history, safety settings) intentionally lives in the service layer, not here, so this controller's only job is HTTP-shape validation.",
            ],
          },
          {
            name: 'userController.js',
            rating: 5,
            explanation: [
              "getMe returns a whitelisted profile shape (never the password hash or refresh token). updateMe is field-by-field opt-in - only fields actually present in the request body get validated and applied, so a partial PATCH from the profile-edit form never accidentally wipes out fields it didn't touch.",
              "Each field has its own real validation: avatar must be a data:image/ URL under 500KB, links get normalized to include https:// and validated with the URL constructor (rejecting anything that isn't parseable), phone is checked against a permissive digits/+/-/space regex.",
            ],
          },
        ],
      },
      {
        dir: 'backend/src/data/',
        files: [
          {
            name: 'cityAliases.js',
            rating: 6,
            explanation: [
              "A hand-maintained map of city name → every station code that actually serves it (Kolkata → HWH, SDAH, SHM, KOAA; Mumbai → MMCT, CSMT, BDTS, LTT, BCT, DR, CSTM, DDR). Without this, searching \"Kolkata\" would return nothing, since no station in the database is literally named \"Kolkata\" - the real station names are Howrah Jn, Sealdah, etc.",
              "Used in two places: trainController's searchStations (and the AI chat's search_route tool, which reimplements the same resolution logic server-side) both check whether a query matches a city key before falling back to plain name/code matching.",
            ],
          },
        ],
      },
      {
        dir: 'backend/src/jobs/',
        files: [
          {
            name: 'dailyCleanup.js',
            rating: 7,
            explanation: [
              "A node-cron job scheduled for 00:00 Asia/Kolkata daily. runCleanup() deletes every DelayReport and LiveStatusUpdate whose journeyDate isn't today's IST date - which, since journeyDate is always set server-side to todayIST() at creation time, means everything left over is by definition from a previous day.",
              "This is the actual enforcement mechanism behind the \"resets daily at midnight IST\" promise made throughout the delay-reports and live-status UI - without this job, that promise would just be marketing copy with no code behind it.",
            ],
          },
        ],
      },
      {
        dir: 'backend/src/middleware/',
        files: [
          {
            name: 'auth.js',
            rating: 9,
            explanation: [
              "verifyToken pulls the Bearer token off the Authorization header, verifies its JWT signature against JWT_ACCESS_SECRET, and attaches { userId, role } to req.user for every downstream handler - or responds 401 immediately if the token is missing or invalid.",
              "requireRole(...allowedRoles) is a middleware factory, not a middleware itself - calling requireRole('admin') returns a middleware scoped to that specific role check, reading the req.user that verifyToken already attached. This is the security backbone: every write endpoint in the app (POST/PATCH routes across delay reports, live status, experiences, users) runs through verifyToken first.",
            ],
          },
          {
            name: 'chatRateLimit.js',
            rating: 6,
            explanation: [
              "A true sliding-window rate limiter (not fixed-window) covered in the Learner deep-dive above - per-IP timestamp arrays in an in-memory Map, filtered to the last 60 seconds on every request, capped at 8. Protects the AI chat's free Gemini quota from being drained by one client hammering the endpoint.",
              "Explicitly single-instance only (the comment in the file says so) - it would need a shared store like Redis to work correctly if the backend ever ran as more than one process.",
            ],
          },
        ],
      },
      {
        dir: 'backend/src/models/',
        files: [
          {
            name: 'Train.js',
            rating: 9,
            explanation: [
              "The central data model everything else hangs off of. A train has an origin, a destination, and an ordered array of stops - each stop carries its own station name/code, distance, day-of-journey (multi-day trains exist), sequence number, and arrival/departure times (null at the true origin/terminus, since there's no arrival at the start or departure at the end).",
              "Every other model that references a train does so by trainNumber (a plain string), not a Mongo ObjectId reference - delay reports, live status, and both experience types all key off it that way, which keeps those collections decoupled from Train's own document structure.",
            ],
          },
          {
            name: 'User.js',
            rating: 8,
            explanation: [
              "Identity plus profile plus auth state, all on one document: role (guest/user/moderator/admin, defaulting to 'user'), the bcrypt passwordHash (never the raw password), profile fields (bio, avatar, links, phone, homeStation) each with their own length/count limits enforced at the schema level, isBanned (defaults to false, flipped by the admin dashboard's ban toggle and checked at login), and the auth-adjacent fields - refreshToken, isVerified, verificationToken, verificationTokenExpires.",
              "reputationScore is a persistent, cross-day trust signal - separate from a single report's own daily-reset upvote/downvote count. It's updated in place (via $inc, see utils/reputation.js) every time someone votes on that user's delay report or live status update, and deliberately never reset by the daily cleanup job, since the whole point is to reflect a track record over time rather than any one day.",
            ],
          },
          {
            name: 'DelayReport.js',
            rating: 7,
            explanation: [
              "trainNumber + journeyDate (a \"YYYY-MM-DD\" string, not a Date) + reason + the upvotes/downvotes counters + the votedBy array of {userId, voteType} subdocuments. Indexed on (trainNumber, journeyDate) together, since that's the exact compound filter every read query uses - listing today's reports for one train.",
            ],
          },
          {
            name: 'LiveStatusUpdate.js',
            rating: 7,
            explanation: [
              "Same shape as DelayReport plus stationName and an optional platformNumber. One schema-level detail worth knowing: timestamps: { createdAt: 'timestamp' } renames the usual createdAt field to timestamp - so listUpdates can sort by .timestamp and the frontend can display \"3m ago\" off a field name that reads naturally, instead of the generic Mongoose default.",
            ],
          },
          {
            name: 'JourneyExperience.js',
            rating: 6,
            explanation: [
              "Five required 1-5 integer ratings (cleanliness, food, staffBehaviour, punctuality, safety) plus an optional 300-character comment. The unique compound index on (trainNumber, reportedBy) is doing double duty - it's both a data-integrity constraint and, combined with the controller's upsert, the entire anti-spam mechanism for this feature. No separate rate-limit code was needed because the schema itself makes a second rating from the same person impossible to create as a new document.",
            ],
          },
          {
            name: 'TatkalExperience.js',
            rating: 5,
            explanation: [
              "The smallest of the five models: trainNumber, seatCategory (enum-limited to 'AC' or 'Sleeper'), and estimatedMinutesToSellOut (0-180). Indexed on (trainNumber, seatCategory) since that's exactly what tatkalExperienceController's getInsight groups by.",
            ],
          },
          {
            name: 'voteSchema.js',
            rating: 4,
            explanation: [
              "A tiny reusable subdocument schema - just {userId, voteType} - embedded directly into both DelayReport.votedBy and LiveStatusUpdate.votedBy arrays. { _id: false } keeps Mongoose from generating a wasted ObjectId for every single vote entry, since nothing ever needs to reference a vote by its own id.",
            ],
          },
        ],
      },
      {
        dir: 'backend/src/routes/',
        files: [
          {
            name: 'authRoutes.js',
            rating: 5,
            explanation: ["Declares the 5 auth endpoints, all public and all POST - there's no way to require a token to obtain a token, so none of these run through verifyToken."],
          },
          {
            name: 'trainRoutes.js',
            rating: 5,
            explanation: ["Declares /search, /stations/search, /route, and /:trainNumber - all public, all read-only GETs, since browsing train data doesn't need an account."],
          },
          {
            name: 'delayReportRoutes.js',
            rating: 4,
            explanation: ["Wires quota (verifyToken) / list-by-train (public) / create (verifyToken) / vote (verifyToken). The comment in the file explains why /quota is registered before /:train: Express matches routes in declaration order, so without that ordering a request to /quota would get swallowed by /:train with 'quota' treated as a literal train number."],
          },
          {
            name: 'liveStatusRoutes.js',
            rating: 4,
            explanation: ["Same shape and the same /quota-before-/:train ordering trick as delayReportRoutes.js."],
          },
          {
            name: 'journeyExperienceRoutes.js',
            rating: 4,
            explanation: ["/:train/mine (verifyToken) is registered before /:train (public) for the identical specific-route-before-generic-route reason - otherwise /:train would greedily match \"mine\" as if it were a train number."],
          },
          {
            name: 'tatkalExperienceRoutes.js',
            rating: 3,
            explanation: ["Two routes: GET the insight (public), POST an estimate (verifyToken). The simplest route file in the project."],
          },
          {
            name: 'userRoutes.js',
            rating: 4,
            explanation: ["GET and PATCH on /me, both behind verifyToken - there's no route to fetch or edit anyone else's profile by id, by design."],
          },
          {
            name: 'chatRoutes.js',
            rating: 4,
            explanation: ["One route: POST / runs through chatRateLimit before reaching the controller - notably not behind verifyToken, since the chat assistant is meant to be usable by guests too."],
          },
          {
            name: 'healthRoutes.js',
            rating: 3,
            explanation: ["GET / is a plain liveness check ({status: 'ok'}). GET /admin-only is a leftover diagnostic route - the code comment says it was built to sanity-check the auth + role middleware while that system was first being developed - that now doubles as a real, working example of requireRole('admin') in use."],
          },
          {
            name: 'adminRoutes.js',
            rating: 5,
            explanation: ["router.use(verifyToken, requireRole('admin')) is applied once at the top of the file rather than repeated per-route, so every endpoint declared under it is admin-gated by construction - a new admin route added here later can't accidentally ship unprotected. All eight routes (overview, online-users, delay-reports list/delete, live-status list/delete, users list, ban toggle) sit behind that one line."],
          },
        ],
      },
      {
        dir: 'backend/src/seed/',
        files: [
          {
            name: 'seedTrains.js',
            rating: 6,
            explanation: [
              "Hand-built data for roughly 65 real, recognizable Indian trains (Rajdhanis, Shatabdis, Durontos, Vande Bharats, plus a spread of well-known Mail/Express/Superfast services), defined as one-directional route arrays that pair() auto-reverses into the return working too.",
              "Since no reliable full timetable dataset was available, stop-level arrival/departure times are estimated: classify() assigns a speed (km/h) and per-stop halt time by train category (Vande Bharat fastest, generic Mail/Express slowest), and train() walks the stop list computing elapsed time from distance ÷ speed plus accumulated halts. originDepartureMinutes() derives a deterministic (not random) departure time from the train number itself, so re-running the seed produces identical data every time - important for a seed script, where random data would make bugs hard to reproduce.",
            ],
          },
          {
            name: 'importTrains.js',
            rating: 4,
            explanation: [
              "Imports a public, CC0-licensed 2016 snapshot of real Indian Railways train numbers/names/routes (the datameet/railways dataset) as origin-and-destination-only entries - no intermediate stops, since the per-station timetable data in that source was spot-checked and found unreliable.",
              "Skips any trainNumber that already exists (whether from a previous import run or from seedTrains.js's hand-curated entries), so the two seed sources never overwrite each other - the hand-curated trains keep their full multi-stop timelines permanently.",
            ],
          },
        ],
      },
      {
        dir: 'backend/src/services/',
        files: [
          {
            name: 'geminiChat.js',
            rating: 9,
            explanation: [
              "The AI orchestration engine - builds a Gemini chat session with a system prompt (crowdsourced-not-fact honesty, brevity, plain-text formatting, IRCTC-for-booking), the 8 tool declarations from chatTools.js, safety settings, and a low thinking level for latency. Converts the frontend's plain {role, text} history array into the shape the Gemini SDK expects.",
              "Then runs the tool-calling loop covered in full in the Learner deep-dive above: send the message, and while the model keeps requesting function calls (up to MAX_TOOL_ROUNDS), execute them in parallel via Promise.all and feed the results back as a new turn, until it returns plain text instead of more tool calls.",
            ],
          },
          {
            name: 'chatTools.js',
            rating: 8,
            explanation: [
              "The 8 real tool implementations the model can call: search_trains, get_train_details (including the timezone-safe next-Tatkal-opening calculation - see the Learner deep-dive above), search_stations, search_route (resolves free-text city/station names itself via the shared resolveStationCodes() helper, rather than requiring the model to call search_stations first), get_delay_reports, get_live_status, get_journey_experience, get_tatkal_experience.",
              "Every tool function does a real Mongoose query against the same collections the REST API uses - there's no separate 'AI data layer', the model is just given a narrow, named set of read operations into the exact same database.",
            ],
          },
        ],
      },
      {
        dir: 'backend/src/utils/',
        files: [
          {
            name: 'moderation.js',
            rating: 8,
            explanation: [
              "Two anti-abuse mechanisms shared by delay reports and live status: a daily posting quota per user (getDelayReportUsage / getLiveStatusUsage count today's documents by that user), and a same-day block that triggers if any single post from that user crosses a downvote threshold (isBlockedToday checks both collections with a cheap .exists() query rather than a full find).",
              "Both are scoped to journeyDate = today, so the block and the quota both dissolve automatically at the midnight reset - there's no separate 'unblock' logic needed, the daily cleanup job handles it implicitly by deleting the offending documents.",
            ],
          },
          {
            name: 'reputation.js',
            rating: 6,
            explanation: [
              "One function, applyReputationDelta(authorId, voterId, delta), called from both delayReportController.js's voteReport and liveStatusController.js's voteUpdate. It's deliberately a plain $inc onto User.reputationScore rather than a recompute-from-history query, since the underlying reports get deleted daily by dailyCleanup.js - by the time you'd want to recompute it, the source data is already gone.",
              "Explicitly no-ops if authorId === voterId. Self-voting is allowed on your own posts (an earlier product decision), but letting that also move your own reputation would make the whole 'track record' signal trivially farmable using nothing but your own daily report quota - so this is the one place that self-vote exception is actually enforced. TRUSTED_REPUTATION_THRESHOLD (15) also lives here, mirrored (not imported - the frontend can't import backend code) as a constant in frontend/src/constants/reputation.js for the badge display cutoff.",
            ],
          },
          {
            name: 'generateTokens.js',
            rating: 8,
            explanation: [
              "Two functions, covered in full in the Learner deep-dive above: generateAccessToken embeds {userId, role} and expires in 15 minutes by default; generateRefreshToken embeds only {userId} and expires in 7 days, signed with a completely separate secret. Small file, but the entire two-token auth model rests on it.",
            ],
          },
          {
            name: 'dateUtils.js',
            rating: 7,
            explanation: [
              "One function, todayIST() - covered in the Learner deep-dive above - that computes today's date as a \"YYYY-MM-DD\" string in IST regardless of what timezone the server process itself is running in. Everything that enforces \"server decides the date, never the client\" (delay reports, live status, the daily cleanup job) is built on top of this one function.",
            ],
          },
          {
            name: 'email.js',
            rating: 3,
            explanation: [
              "Sends the account-verification email via Resend, with an inline HTML template (welcome message, a styled verify button linking to CLIENT_ORIGIN/verify-email?token=...). Currently low-impact in practice: register/login don't actually gate on isVerified right now, so this file sends an email that isn't required to use the account - built ahead of a feature that hasn't been fully wired up yet.",
            ],
          },
        ],
      },
    ],
  },
  {
    section: 'Frontend',
    groups: [
      {
        dir: 'frontend/src/',
        files: [
          {
            name: 'App.jsx',
            rating: 8,
            explanation: [
              "The route table. Every page is declared here - Home, Login, Register, VerifyEmail, TrainSearch, About, Developer, Learner (plus its two sub-pages), WhatsNext, and Admin - each wrapped in PageTransition, with the whole <Routes> wrapped in AnimatePresence mode=\"wait\" so route changes animate out before the next page animates in.",
              "The three Learner routes are additionally wrapped in OwnerOnlyRoute, which silently redirects anyone but the owner account back to / before the page ever renders. /admin is deliberately not wrapped the same way - it's a public route whose own content decides what to show, so a non-admin gets an explicit 'not an admin' message instead of an unexplained bounce.",
              "Navbar and ScrollProgress are rendered outside the animated route area, since they're persistent chrome that shouldn't re-mount or transition on every navigation.",
            ],
          },
          {
            name: 'main.jsx',
            rating: 6,
            explanation: ["The real entrypoint (App.jsx is just a component). Mounts the whole tree into #root inside StrictMode, wrapped in BrowserRouter for routing and AuthProvider so useAuth() works anywhere in the tree. Also imports i18n/index.js for its side effect (registering all 9 languages with react-i18next) before anything renders, so every component's first render already has the right language loaded."],
          },
          {
            name: 'socket.js',
            rating: 7,
            explanation: ["Creates one Socket.io client instance, connecting to the API's origin (derived from VITE_API_BASE_URL by stripping the trailing /api) with autoConnect: true. Every hook/component that needs live data (useLiveStats, useTrainRoom, DelayReports, LiveStatusFeed) imports this same instance rather than opening its own connection.", "auth is a function - (cb) => cb({ token: localStorage.getItem('accessToken') }) - not a plain object, because Socket.io re-invokes a function form on every (re)connect attempt. A plain object would only ever send whatever token happened to be in localStorage at module-import time (usually none, since the socket connects before login); the function form means a login/logout-triggered reconnect (see AuthContext.jsx) always sends the current token, letting the backend identify who's actually online."],
          },
        ],
      },
      {
        dir: 'frontend/src/api/',
        files: [
          {
            name: 'client.js',
            rating: 9,
            explanation: [
              "The Axios instance every single API call in the app goes through. A request interceptor attaches the stored access token as a Bearer header on every outgoing request automatically, so no component has to think about auth headers.",
              "The response interceptor is the silent-token-refresh-with-request-queueing pattern covered in full in the Learner deep-dive above - on a 401, it refreshes once and queues any other requests that 401 in the same window rather than each triggering its own refresh call, then replays them all with the new token.",
            ],
          },
        ],
      },
      {
        dir: 'frontend/src/context/',
        files: [
          {
            name: 'AuthContext.jsx',
            rating: 9,
            explanation: [
              "The global auth state, built on plain React Context - no external state library. Holds the current user (initialized from localStorage so a refresh doesn't log you out), and exposes register/login/logout/updateProfile/verifyEmail/resendVerification, all funneled through client.js.",
              "persistSession() is the one place tokens and the user object get written to localStorage and into state together, called by both register and login so the two flows can't drift out of sync with each other.",
              "login and logout both force a socket.disconnect() + socket.connect() afterward. The socket (socket.js) connects once at page load, before any login could have happened - without this forced reconnect, the server would never learn a newly logged-in user's identity (or, on logout, would keep treating that connection as still belonging to them) until the next full page refresh.",
            ],
          },
        ],
      },
      {
        dir: 'frontend/src/hooks/',
        files: [
          {
            name: 'useTimeOfDay.js',
            rating: 8,
            explanation: [
              "getPeriod(hour) buckets the current hour into morning/noon/evening/night. The hook reads the real hour once on mount and re-checks it every 60 seconds via setInterval, so a session left open across a period boundary (e.g. sitting on the site as it turns 7pm) actually transitions live instead of needing a page refresh.",
              "This one hook is what every time-of-day-reactive surface (Hero, FAQ, ChatPanel, Login, Register, VerifyEmail, Navbar, TrainSearch) reads to decide its gradient, decorations, and light/dark text colors - a single source of truth for what time it \"is\" across the whole UI.",
            ],
          },
          {
            name: 'useLiveStats.js',
            rating: 6,
            explanation: [
              "Subscribes to the stats:online and stats:registered Socket.io events and stores whatever comes in as state. Also handles a real race condition, explained in the file's own comment: the server pushes these values immediately on connect, but if this hook's listener isn't attached yet at that exact moment (e.g. this component mounts after the socket already connected), Socket.io doesn't replay missed events - so it explicitly emits stats:request on mount and on every reconnect to force a fresh push.",
            ],
          },
          {
            name: 'useTrainRoom.js',
            rating: 6,
            explanation: ["A small effect wrapper: emits join_train_room on mount (or whenever trainNumber/journeyDate changes) and leave_train_room on cleanup. Used by DelayReports and LiveStatusFeed so a component viewing one train only receives Socket.io events scoped to that train's room."],
          },
          {
            name: 'useOnlineStatus.js',
            rating: 4,
            explanation: ["A thin wrapper around navigator.onLine plus the browser's online/offline window events - returns a live boolean, re-rendering whichever component reads it the instant connectivity flips. Backs OfflineBanner's offline/queued messaging."],
          },
          {
            name: 'useQueueCount.js',
            rating: 4,
            explanation: ["Reads the current length of the offline submission queue (offlineQueue.js) on mount, then subscribes to its onQueueChange pub/sub so the count stays live as items are added (a submission made while offline) or removed (successfully flushed, or dropped after a real server rejection) - without this, OfflineBanner's queued-count text would only update on the next full remount."],
          },
        ],
      },
      {
        dir: 'frontend/src/offline/',
        files: [
          {
            name: 'offlineQueue.js',
            rating: 6,
            explanation: [
              "A plain IndexedDB wrapper (no library) with a tiny pub/sub layer on top - enqueue()/getQueue()/removeFromQueue() plus onQueueChange() for subscribers like useQueueCount.js. Deliberately app-level IndexedDB instead of Workbox's BackgroundSyncPlugin: the real Background Sync API is Chrome-only, so a plain 'online' event listener (see offlineSync.js) works identically across every browser and is far easier to actually test - toggle DevTools' offline switch, or just disable WiFi.",
              "Each queued entry stores endpoint, payload, and label so offlineSync.js can replay it later with a single generic client.post(item.endpoint, item.payload) - the queue itself doesn't need to know it's specifically a delay report or a live status update.",
            ],
          },
          {
            name: 'offlineSync.js',
            rating: 6,
            explanation: [
              "flushQueue() replays queued submissions in the order they were made. The key branch: a network-level failure (no err.response at all) means still offline, so it stops and waits for the next 'online' event rather than retrying in a tight loop; a real server response (a validation error, quota exceeded, etc.) can't be fixed by retrying, so that item is dropped instead of being retried forever.",
              "initOfflineSync() (called once from main.jsx) wires window.addEventListener('online', flushQueue) and also flushes immediately if already online at startup, covering the case where items were queued in a previous session and the tab is simply reopened already connected.",
            ],
          },
        ],
      },
      {
        dir: 'frontend/src/utils/',
        files: [
          {
            name: 'resizeImage.js',
            rating: 4,
            explanation: ["fileToResizedDataUrl() takes an uploaded File, draws it onto an off-DOM <canvas> scaled down to a max dimension (160px by default), and resolves a JPEG data URL - keeping avatar uploads small enough to fit the backend's 500KB limit without ever touching a server-side image-processing library."],
          },
        ],
      },
      {
        dir: 'frontend/src/constants/',
        files: [
          {
            name: 'access.js',
            rating: 5,
            explanation: [
              "Two small, deliberately different access checks living side by side. isLearnerOwner(user) is a plain client-side string comparison against one hardcoded email - an acceptable tradeoff for /learner, since the worst case of someone bypassing it is reading interview-prep content, not a real harm.",
              "isAdmin(user) checks user.role === 'admin' instead of an email, matching what the backend actually enforces - but the file's own comment says directly that this check is UX only. The real gate for every /api/admin/* call is requireRole('admin') running server-side off the signed JWT, not anything in this file - a client-only check here would be trivial to spoof via localStorage.",
            ],
          },
          {
            name: 'reputation.js',
            rating: 2,
            explanation: ["A single constant, TRUSTED_REPUTATION_THRESHOLD (15), mirroring the same number in backend/src/utils/reputation.js - it's a pure display cutoff (the backend never needs to know it, only the frontend decides whether to render the badge), kept as one named constant so the two copies don't quietly drift apart if the threshold is ever tuned."],
          },
        ],
      },
      {
        dir: 'frontend/src/content/',
        files: [
          {
            name: 'aboutContent.js',
            rating: 3,
            explanation: ["The 4 sections shown by the About feature (what this is, why it's built this way, how people use it, who it's for), imported by both AboutBadge's popover and the /about page so the two surfaces can never say something different about the same topic."],
          },
          {
            name: 'developerContent.js',
            rating: 4,
            explanation: ["Every piece of structured data behind the Developer page - tech stack, prerequisites, terminal setup steps, env var tables, design philosophy, the features list, the full API reference (grouped by resource with method/path/auth/description), the AI assistant breakdown, moderation, security, and contributing guidance."],
          },
          {
            name: 'learnerContent.js',
            rating: 4,
            explanation: ["The 60-second interview pitch, the 13 curated deep-dive code walkthroughs (each pairing a real code excerpt with an explanation and an interview-angle callout), and the two Future Scope card lists (futureScopeApp, futureScopeIndustry) rendered on the public WhatsNext page - an entry is deleted from those lists the moment the thing it describes actually ships."],
          },
          {
            name: 'fileMapContent.js',
            rating: 4,
            explanation: ["This file - the structural skeleton (folder grouping, file names, importance ratings, and now full explanations) that both the Learner overview and the dedicated Backend/Frontend code pages read from, paired at render time with each file's real source code."],
          },
        ],
      },
      {
        dir: 'frontend/src/i18n/',
        files: [
          {
            name: 'index.js',
            rating: 7,
            explanation: [
              "Wires up react-i18next: imports all 9 locale JSON files (en, hi, bn, ta, mr, kn, pa, or, te) as static resources, reads a previously-saved language from localStorage on startup (falling back to 'en' if none is saved or the saved value isn't one of the 9 supported codes), and calls i18n.init() once, at module load time - imported for its side effect from main.jsx, before the React tree ever renders.",
              "SUPPORTED_LANGUAGES (the array LanguageBadge iterates to build its picker) and changeLanguage() (a thin wrapper that both calls i18n.changeLanguage() and persists the choice to localStorage, so a page reload remembers it) are the two things the rest of the app actually imports from here - everything else about the react-i18next setup is self-contained in this one file.",
            ],
          },
          {
            name: 'locales/en.json',
            rating: 6,
            explanation: [
              "The English source of truth every other language file is translated from - one flat JSON object, namespaced by feature area (navbar, footer, hero, featureGrid, faq, auth, trainSearch, delayReports, liveStatus, tatkalExperience, journeyExperience, language), loaded as react-i18next's default 'translation' namespace so every component just calls the bare t('section.key') without specifying a namespace.",
              "Interpolated values use i18next's {{variable}} syntax (e.g. {{count}}, {{station}}, {{year}}); a couple of keys use the _plural suffix convention (estimateFromReports / estimateFromReports_plural) for count-based singular/plural switching. The language.names block is a special case - it's copied byte-for-byte identical into all 8 locale files rather than translated, since it's meant to always show each language's own native name in the picker regardless of which language is currently active.",
            ],
          },
        ],
      },
      {
        dir: 'frontend/src/components/',
        files: [
          {
            name: 'Navbar.jsx',
            rating: 8,
            explanation: [
              "The largest single component in the project. It's time-of-day-themed like the Hero (same skyTheme import), renders a mobile hamburger menu, the logo/clock, and - when logged in - a profile dropdown that expands into a full view/edit mode: name, bio, links, phone, home station, and an avatar upload that runs through resizeImage.js before being sent to the backend.",
              "Also owns the logout confirmation modal (a small portal-rendered dialog, the same pattern ChatPanel uses for its own modal) so logging out always requires an explicit confirm rather than a single misclick.",
              "Every visible string - menu labels, the account dropdown's field labels and buttons, the logout confirm dialog - goes through useTranslation()'s t() instead of being hardcoded, so the whole navbar re-renders in whichever language the LanguageBadge picker sets.",
            ],
          },
          {
            name: 'Hero.jsx',
            rating: 8,
            explanation: [
              "The landing page's above-the-fold section. Renders the badges row (LiveStatsBadges, AboutBadge, ChatBadge, LanguageBadge), the headline and CTA buttons, a tilting parallax image card (TiltCard, tracking mouse position to rotate in 3D), the animated TrainTrack strip, and - directly requested to sit in the dark space beneath the tracks - a second badge row: DeveloperBadge, LearnerBadge, WhatsNextBadge, and AdminBadge.",
              "Like most of the site's marketing surface, its whole color scheme swaps based on useTimeOfDay() plus the isDark flag from skyTheme, down to which decorative blur-glow shapes render (only shown in daytime periods). The headline, subtitle, and CTA text are all t()-translated too.",
            ],
          },
          {
            name: 'ChatPanel.jsx',
            rating: 8,
            explanation: [
              "The actual chat UI - a portal-rendered modal with message bubbles, a progressive status indicator that cycles through \"Thinking...\" → \"Looking that up...\" → \"Almost there...\" based on elapsed time (so a multi-second tool-calling round doesn't feel frozen), and the same time-of-day sky background as the rest of the site rather than a plain white dialog.",
              "Keeps the whole conversation in local component state and resends it (as a plain {role, text} array) with every new message, since the backend is intentionally stateless per request - no server-side session for the chat.",
            ],
          },
          {
            name: 'DelayReports.jsx',
            rating: 8,
            explanation: [
              "Fetches today's reports for a train, joins that train's Socket.io room via useTrainRoom, and listens for new_delay_report / vote_updated events - mergeReport() either replaces an existing report in place (by _id) or prepends a new one, then the whole list is re-sorted by net score (upvotes − downvotes) so live updates never require a manual refetch.",
              "The submit form and vote buttons are conditionally rendered based on auth state and the fetched quota - logged out sees a login prompt, blocked/quota-exhausted sees an explanatory message instead of a broken form. All labels/placeholders/messages are t()-translated - only the actual reason text a passenger types is left exactly as submitted, never translated.",
              "handleSubmit distinguishes a real server rejection from a genuine network failure by checking err.response: if it's missing entirely, the request never reached the network, so the report is enqueue()'d into offlineQueue.js instead of showing an error, with a 'Saved - will send once you're back online' message. Each report row also renders a TrustBadge next to the author's name, driven by the reputationScore the backend now includes on the populated reportedBy field.",
            ],
          },
          {
            name: 'LiveStatusFeed.jsx',
            rating: 8,
            explanation: [
              "Structurally the closest sibling to DelayReports.jsx (same live-merge pattern, same room-join, same quota/block UI states) but for live location updates, with an extra platformNumber field.",
              "Its most complex piece is StationSelect - a custom dropdown that computes its own fixed-position coordinates (flipping to open upward if there isn't room below), renders through a portal so it isn't clipped by any parent's overflow-hidden, and closes on outside clicks or window scroll/resize while explicitly ignoring scroll events that originate from inside its own scrollable list - a real bug fix documented directly in the code's comments.",
              "The module-level timeAgo() helper takes t as a second argument (rather than calling useTranslation() itself, which only works inside a component) so '3m ago'-style relative timestamps translate correctly too.",
              "Same offline-queue-on-network-failure branch and TrustBadge-next-to-author-name treatment as DelayReports.jsx - the two components deliberately stayed in sync when both features were added, rather than one getting the behavior and the other being forgotten.",
            ],
          },
          {
            name: 'SkyBackground.jsx',
            rating: 7,
            explanation: [
              "Exports both the skyTheme object (the gradient class and isDark flag for each of the four periods - the single source of truth every time-of-day-aware component imports) and the SkyBackground component itself, which renders the actual decorations: a glowing sun (day), a crescent moon built from two overlapping SVG circles and an SVG mask (night), a 160-star field with independently randomized twinkle timing, a meteor shower, and - evening only - two flocks of birds animated across the sky.",
              "Reused directly, not reimplemented, inside the ChatPanel modal, proving the same visual system scales down cleanly from a full hero section to a ~500px chat window.",
            ],
          },
          {
            name: 'JourneyExperience.jsx',
            rating: 7,
            explanation: [
              "A 5-category star-rating form (cleanliness, food, staff behaviour, punctuality, safety) plus an optional comment. On mount it separately fetches the user's own existing rating for this train (if any) to pre-fill the form as an edit rather than a blank submission - matching the backend's upsert-by-user behavior.",
              "StarDisplay renders averages with half-star support (a linear-gradient SVG fill split at 50%); StarInput is the interactive hover-preview version used while rating. The 5 category labels are built from CATEGORY_KEYS mapped through t('journeyExperience.categories.KEY') rather than a hardcoded label string, so they translate with everything else; the free-text comment itself is never translated.",
            ],
          },
          {
            name: 'TatkalExperience.jsx',
            rating: 6,
            explanation: ["An AC/Sleeper toggle plus a minutes-to-sellout number input, showing the averaged community estimate per class alongside how many reports it's based on. The simplest of the four experience/report components - no live Socket.io updates, no voting, just fetch-on-mount and refetch-after-submit. Uses i18next's _plural key convention (estimateFromReports / estimateFromReports_plural) so \"1 report\" vs \"3 reports\" reads correctly in every language."],
          },
          {
            name: 'FeatureGrid.jsx',
            rating: 6,
            explanation: [
              "Renders the \"What TrainMitra does\" card grid from a features array that now only holds non-text metadata (id, icon, live/coming-soon status, optional link, accent color) - the title and description text was pulled out into i18n/locales/*.json, keyed by each card's id (e.g. featureGrid.items.trainLookup.title), and looked up with t() at render time. Each card animates in on scroll via whileInView, staggered by index.",
              "Also hosts a genuinely unnecessary but deliberate bit of delight: a train-horn button that synthesizes an actual honk sound in the browser via the raw Web Audio API (three detuned sawtooth oscillators, no audio file) and spawns a burst of the same floating-bubble particles used as ambient background decoration. Its \"Toot the horn\" caption is translated too - t is threaded down as a prop since HornButton is a separate function outside the component that renders it.",
            ],
          },
          {
            name: 'FAQ.jsx',
            rating: 6,
            explanation: [
              "An accordion FAQ list sitting inside/behind an organic blob shape whose fill color is pulled directly from CIRCLE_CORE - hand-picked tones matching each period's Hero gradient (sky blue for morning, richer blue for noon, orange for evening, navy for night) - so the shape genuinely shares the Hero's palette at the current time of day rather than using an unrelated color.",
              "The blob's size isn't hardcoded - a ResizeObserver measures the actual heading/subheading/button content and the shape is sized to fit it with asymmetric padding (generous on the sides for the wide subheading line, tight top/bottom), recalculating on window resize.",
              "The 8 Q&A pairs used to be a hardcoded FAQS array - now they come from t('faq.items', { returnObjects: true }), which returns the whole translated array of {q, a} objects in one call rather than translating each question/answer individually.",
            ],
          },
          {
            name: 'AboutBadge.jsx',
            rating: 5,
            explanation: [
              "Branches its entire interaction model on a matchMedia('(hover: hover) and (pointer: fine)') check done once at mount. Hover-capable devices get a popover that measures the trigger button's position and clamps itself within the viewport (fixed positioning, recalculated on resize) so it can never overflow off-screen on a narrow window.",
              "Touch devices skip the popover entirely and just navigate to /about on tap - a deliberate fix for the real bug where touch's synthetic hover-then-click sequence was opening and then immediately re-closing a toggle-based popover.",
            ],
          },
          {
            name: 'TrainTrack.jsx',
            rating: 5,
            explanation: ["The animated SVG strip beneath the Hero - hand-placed trees, glowing lamp posts, pulsing red signal lights, two mini station buildings, and a train that loops end-to-end with rotating wheels (a continuous CSS-timed rotate animation) and three staggered smoke puffs rising from its chimney. TrainIcon is exported separately and reused as a decorative element on the auth pages."],
          },
          {
            name: 'LiveStatsBadges.jsx',
            rating: 5,
            explanation: ["Reads {online, registered} from useLiveStats and renders each as a pill with a pulsing colored dot, using AnimatePresence so a badge only animates in once its real value has actually arrived from the socket (both start as null, so nothing renders a misleading \"0\" during the brief connection window)."],
          },
          {
            name: 'ChatBadge.jsx',
            rating: 4,
            explanation: ["Just the pill trigger - holds one piece of open/closed state and conditionally renders ChatPanel. All the actual chat logic and UI lives in the panel itself, keeping this component intentionally trivial."],
          },
          {
            name: 'DigitalClock.jsx',
            rating: 3,
            explanation: ["A live HH:MM:SS readout styled like a station departure board (monospace, amber-on-dark, a soft text-shadow glow), with the colon blinking on/off every second driven by the seconds value's parity rather than a separate animation timer."],
          },
          {
            name: 'StationClock.jsx',
            rating: 3,
            explanation: ["An analog clock face rendered as raw SVG with no image assets - hour/minute/second hand endpoints are computed directly from the current Date via trigonometry (toXY() converts an angle and hand length into x/y coordinates), recalculated every second."],
          },
          {
            name: 'PageTransition.jsx',
            rating: 3,
            explanation: ["A one-shot fade/slide wrapper (opacity + a small vertical shift) applied around every route's content in App.jsx, so navigating between pages always animates rather than hard-cutting."],
          },
          {
            name: 'Footer.jsx',
            rating: 3,
            explanation: ["The site tagline, the \"no live GPS / crowdsourced by design\" disclaimer, the \"Designed & developed by Kaushik Banik\" credit, and the copyright line with a year computed from new Date() rather than hardcoded and passed into t('footer.copyright', { year }) as an interpolated value. Rendered on Home and About."],
          },
          {
            name: 'DeveloperBadge.jsx',
            rating: 3,
            explanation: ["A pill trigger that navigates straight to /developer on click - deliberately simple, no popover, since the Developer page's content is far too long to fit in one."],
          },
          {
            name: 'LearnerBadge.jsx',
            rating: 3,
            explanation: ["The same simple navigate-on-click pattern as DeveloperBadge, pointing at /learner instead - the two badges are visually and structurally identical siblings."],
          },
          {
            name: 'WhatsNextBadge.jsx',
            rating: 3,
            explanation: ["The simplest badge in the row - no auth check, no popover, just a navigate to /whats-next. Amber-accented to stay visually distinct from the violet Learner badge and the rose Admin badge next to it."],
          },
          {
            name: 'LanguageBadge.jsx',
            rating: 6,
            explanation: [
              "Same hover-popover-vs-touch-click branching as AboutBadge (matchMedia('(hover: hover) and (pointer: fine)'), reused verbatim), but the popover content is a picker listing all 9 SUPPORTED_LANGUAGES from i18n/index.js instead of static sections - each row shows that language's own native name from language.names.CODE (always shown in the language itself, e.g. 'हिन्दी (Hindi)', regardless of the site's currently active language) with a checkmark on whichever one is active.",
              "Selecting a language calls changeLanguage(code) - i18next's own i18n.changeLanguage() plus writing the choice to localStorage - which re-renders every t()-consuming component across the whole app instantly, no page reload. Placed next to ChatBadge in Hero.jsx per an explicit request to put it 'along with chat'.",
            ],
          },
          {
            name: 'AdminBadge.jsx',
            rating: 3,
            explanation: ["Same navigate-on-click pattern as the other badges, pointing at /admin. Unlike LearnerBadge it doesn't branch on ownership before navigating - it always goes to /admin and lets that page itself decide whether to render the dashboard or a 'You are not an admin' message, so clicking it as a non-admin still gets a clear response instead of the badge silently doing nothing or popping a toast."],
          },
          {
            name: 'OwnerOnlyRoute.jsx',
            rating: 4,
            explanation: ["A route-wrapper guard: renders its children only if isLearnerOwner(user) is true, otherwise <Navigate to=\"/\" replace />. A silent redirect rather than an explanatory message, by design - the three routes it protects (/learner and its two sub-pages) are meant to look like they don't exist to anyone but the owner, which is a different intent from /admin's deliberately visible 'not an admin' message."],
          },
          {
            name: 'ScrollProgress.jsx',
            rating: 2,
            explanation: ["A thin fixed bar pinned to the top of the viewport, its horizontal scaleX driven by a spring tied to Framer Motion's useScroll() progress value - purely a page-length indicator, no other behavior."],
          },
          {
            name: 'Bubbles.jsx',
            rating: 2,
            explanation: ["Purely decorative rising-bubble particles (randomized size/drift/speed/delay per bubble, memoized once per mount) reused as ambient background texture in a couple of sections - no interactivity, disabled entirely under reduced-motion."],
          },
          {
            name: 'TrustBadge.jsx',
            rating: 3,
            explanation: ["A single small green checkmark pill, rendered by both DelayReports.jsx and LiveStatusFeed.jsx next to a contributor's name. Returns null (renders nothing) below TRUSTED_REPUTATION_THRESHOLD - the component itself owns the display cutoff, so neither parent component needs to duplicate that comparison."],
          },
          {
            name: 'OfflineBanner.jsx',
            rating: 4,
            explanation: ["A small fixed pill at the bottom-center of the viewport, mounted once globally in App.jsx. Reads useOnlineStatus() and useQueueCount() and picks one of three messages: offline with nothing queued, offline with N queued, or online-and-flushing-N - hidden entirely (returns null) once back online with an empty queue, so it never lingers as dead chrome."],
          },
        ],
      },
      {
        dir: 'frontend/src/pages/',
        files: [
          {
            name: 'TrainSearch.jsx',
            rating: 9,
            explanation: [
              "The single most feature-dense page in the app. Handles both search modes (by train, and by from/to route), computes and live-counts-down the next Tatkal opening times (nextTatkalOpening()) for the selected train, and conditionally mounts DelayReports, LiveStatusFeed, TatkalExperience, and JourneyExperience beneath whichever train is currently selected.",
              "Reads query params (?tatkal=1, ?delay=1, ?live=1, ?experience=1) to control which entry banner and empty-state copy is shown, so a link from FeatureGrid or the badges row lands the user on this same page already framed around the specific feature they clicked.",
              "The headline/entryBanner/emptyStateHint objects that used to be hand-written JS ternaries are now resolved from an entryVariant string ('plain'/'tatkal'/'delay'/'live'/'experience') via t(`trainSearch.headline.${entryVariant}`, { returnObjects: true }) and similar - the branching logic stayed the same, only where the actual text lives changed. Nearly every other string on the page (search placeholders, tab labels, the Tatkal booking card, stop-list Arr/Dep/Day labels) is t()-translated too; the one thing intentionally left untouched is the free-text a passenger actually typed into a delay report or live update, rendered inside the child DelayReports/LiveStatusFeed components exactly as submitted.",
            ],
          },
          {
            name: 'Home.jsx',
            rating: 6,
            explanation: ["Pure composition, no logic of its own: Hero, FeatureGrid, FAQ inside the scrollable content area, Footer pinned below via a flex-col min-h-screen layout."],
          },
          {
            name: 'Login.jsx',
            rating: 6,
            explanation: ["An email/password form calling AuthContext's login(), with the same time-of-day sky background, decorative Bubbles, and TrainIcon as the rest of the auth flow. On success it navigates to / immediately since persistSession() inside login() has already updated global auth state. Labels, placeholders, and button text are t()-translated; a failed-login error still falls back to the raw backend message if the server sends one, since that message is generated server-side in English and isn't part of the translation files."],
          },
          {
            name: 'Register.jsx',
            rating: 6,
            explanation: ["Structurally identical to Login.jsx with an added name field, calling register() instead - the same success/error/loading state shape, the same visual treatment, the same t()-translation approach for its own copy."],
          },
          {
            name: 'Developer.jsx',
            rating: 5,
            explanation: ["Renders developerContent.js into the Developer page: stack pills, copy-able terminal setup blocks, env var tables (with the confidentiality warning callout), design philosophy, the features grid, the full grouped API reference, the AI assistant breakdown, moderation, security, and contributing sections."],
          },
          {
            name: 'Learner.jsx',
            rating: 5,
            explanation: ["The Learner landing page: a brief interview-ready project pitch, the curated deep-dive code walkthroughs, and the two buttons into the complete Backend and Frontend code pages."],
          },
          {
            name: 'LearnerBackend.jsx',
            rating: 6,
            explanation: ["Flattens fileMapContent.js's Backend section into a single list, pairs each entry with its real source from backendSource.generated.js by matching path, and renders one FileCard per file. The 'Folder order' / 'Most important first' toggle either walks the grouped structure as-is or shows a flattened, rating-sorted list computed once via useMemo."],
          },
          {
            name: 'LearnerFrontend.jsx',
            rating: 6,
            explanation: ["Structurally identical to LearnerBackend.jsx, but its source comes from Vite's import.meta.glob('/src/**/*.{js,jsx}', { query: '?raw', import: 'default', eager: true }) instead of a generated file - always the real, current frontend code with no separate build step, since Vite reads it straight off disk."],
          },
          {
            name: 'WhatsNext.jsx',
            rating: 4,
            explanation: ["The Future Scope content that used to live inside /learner, split into its own public, un-gated page once /learner got locked down to the owner account - Future Scope was never meant to be private, so leaving it gated alongside the interview-prep content would have hidden something meant to stay visible. Renders futureScopeApp and futureScopeIndustry from learnerContent.js as two card grids, with the same time-of-day theming as every other themed page."],
          },
          {
            name: 'AdminDashboard.jsx',
            rating: 7,
            explanation: [
              "Gates its own content on isAdmin(user) instead of a route wrapper: a non-admin (including logged out) sees a themed 'You are not an admin' card in place of the dashboard, rather than a silent redirect - unlike /learner, this page's existence isn't meant to be hidden, only its content is. Four tabs (Overview, Online, Moderation, Users), each fetching its own data from /api/admin/* on mount.",
              "Overview shows stat cards plus a Recharts bar chart comparing today's delay-report/live-status counts against the all-time Tatkal/Journey experience totals - deliberately not a multi-day trend line, since delay reports and live status wipe every midnight and have no history to plot. Online lists everyone currently connected by name (guests shown as 'Guest'), polling /api/admin/online-users every 8 seconds while the tab is open rather than a one-off fetch, since presence changes continuously. Moderation lists today's reports worst-downvoted-first with a two-step (click-to-confirm) delete button, the same click-again-to-confirm pattern used elsewhere in the app instead of a browser confirm() dialog. Users lists every account with its Reputation score and a Ban/Unban toggle, disabled for the admin's own row.",
            ],
          },
          {
            name: 'VerifyEmail.jsx',
            rating: 4,
            explanation: ["Reads ?token= from the URL on mount and calls verifyEmail(), showing a loading/success/error state accordingly. Currently a mostly-dormant flow in practice, since nothing in login/register actually blocks on isVerified yet."],
          },
          {
            name: 'About.jsx',
            rating: 4,
            explanation: ["The full-page version of the same content AboutBadge shows as a popover on desktop - this is specifically what touch-device users land on after tapping the About badge, per AboutBadge's hover-capability branch."],
          },
        ],
      },
    ],
  },
];
