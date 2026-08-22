// A short, spoken-style opener - what you'd actually say in the first 60 seconds of
// an interview if asked "tell me about a project you built."
export const projectPitch = [
  "I built TrainMitra, a full-stack web app for Indian Railways passengers. IRCTC gives you the official timetable, but nothing about what's actually happening on a train right now - is it delayed, where is it, how fast does Tatkal really sell out. TrainMitra fills exactly that gap: real passengers report delays and live location in real time, and share honest Tatkal and journey experience ratings, instead of the app pretending to have GPS or ticket-availability data it doesn't actually have.",
  "It's React/Vite on the frontend and Node/Express/MongoDB on the backend, with Socket.io for real-time updates, JWT access/refresh token auth, and a Gemini-powered AI assistant that answers using tool-calling into the app's own live data instead of just guessing.",
  "The principle behind almost every design decision: never fake data, and never trust the client for anything that enforces a rule. The date that gates the daily reset is computed server-side, not sent by the client. Posting has real anti-abuse limits - daily quotas, a downvote-triggered same-day block. The AI assistant is upfront that its data is crowdsourced, not verified fact.",
  "I built it incrementally, one feature at a time, each one explained and confirmed before the next started - which is also why this Developer and Learner section exists: it's meant to stay a live, honest account of the whole thing, not a one-time writeup that goes stale.",
];

// Honest ideation, not a promised roadmap - what could plausibly get built next on
// TrainMitra itself, kept separate from the second, broader list below.
export const futureScopeApp = [
  {
    title: 'Push notifications',
    body: "Right now you have to have TrainMitra open (or be in the right Socket.io room) to see a new delay report or live update land. A \"watch this train\" subscription with browser push notifications would let someone check their train's status without keeping a tab open.",
  },
  {
    title: 'Historical reliability scores',
    body: 'Delay reports get wiped every midnight by design - which is right for "is my train late today" but throws away signal that could answer a different, longer-term question: does this specific train run late often? Keeping an aggregated (not raw) reliability score per train, separate from the daily-reset raw reports, is a natural extension.',
  },
];

// Broader, structural gaps in Indian Railways passenger services - not about
// TrainMitra specifically, just an honest look at what's still unsolved in the space,
// some of which a tool like this could eventually help with.
export const futureScopeIndustry = [
  {
    title: 'General/unreserved coach crowding',
    body: 'A huge share of daily Indian Railways passengers travel unreserved, and there is no live signal anywhere - official or crowdsourced - about how packed a general coach currently is. Reserved-class passengers get a seat map; unreserved passengers get nothing.',
  },
  {
    title: 'Where will my coach actually stop',
    body: 'Coach position on the platform is one of the most-asked, least-reliably-answered questions in Indian rail travel - IRCTC exposes an approximate coach position feature for some trains, but formation changes and it isn\'t consistently trustworthy, so passengers still end up running the length of a platform with luggage.',
  },
  {
    title: 'Closed-loop cleanliness accountability',
    body: 'Complaint channels for cleanliness exist (helplines, the Swachh Rail initiative), but there\'s rarely a visible loop back to the passenger - did the complaint lead to anything happening. A visible before/after signal, even just crowdsourced ratings over time per train, would create real accountability pressure.',
  },
  {
    title: 'Real-time safety reporting, especially for women travelers',
    body: 'The RPF helpline (139) exists, but nothing app-integrated makes safety concerns visible the way a delay report is - and this is a genuinely sensitive area that would need careful design (verified reporting, no public exposure that could enable misuse) rather than a naive copy of the delay-report pattern.',
  },
  {
    title: 'Accessibility information',
    body: 'Which trains have working accessible coaches, which stations have functioning ramps and lifts - this data is thin and scattered, not centralized anywhere a passenger with a disability could actually plan around before travel.',
  },
  {
    title: 'Honest waitlist/RAC confirmation history',
    body: "Third-party prediction tools exist but aren't broadly transparent about their methodology. A crowdsourced \"did your waitlist number actually confirm\" history, aggregated per train instead of guessed by a black-box model, would be a more honest version of the same idea - consistent with this whole project's stance on crowdsourced-not-fabricated data.",
  },
  {
    title: 'Last-mile connectivity',
    body: "\"The train arrived\" isn't the end of a journey. At smaller stations especially, there's no integrated way to see what's actually available to get from the platform to a real destination - autos, buses, shared transport - the trip planning stops exactly where it's often most confusing.",
  },
];

// Interview-prep code walkthroughs, pulled verbatim from the real codebase - not
// simplified/pseudocode, so what you read here is exactly what's running.
export const codeWalkthroughs = [
  {
    id: 'jwt-tokens',
    title: 'Two JWTs, two lifespans',
    file: 'backend/src/utils/generateTokens.js',
    tags: ['Auth', 'JWT', 'Backend'],
    code: `function generateAccessToken(user) {
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
}`,
    explanation: [
      "Login and register both issue two tokens, not one. The access token is short-lived (15 minutes) and carries the user's role - it's what gets sent on every API request, and if it leaks, the damage window is small.",
      "The refresh token lives much longer (7 days) and does one job only: getting a new access token without forcing a re-login. It's signed with a completely different secret, so leaking one secret doesn't compromise the other token type.",
      "Notice the access token embeds role but the refresh token doesn't - the refresh token is never used to make authorized API calls directly, so it doesn't need that data.",
    ],
    interviewAngle: "Why not just use one long-lived token? Because a long-lived token that leaks is a long-lived problem. Splitting the concern means the thing you send on every request expires fast, and the thing that lives long never touches your actual API routes.",
  },
  {
    id: 'silent-refresh',
    title: 'Silent token refresh without duplicate requests',
    file: 'frontend/src/api/client.js',
    tags: ['Auth', 'Axios', 'Frontend'],
    code: `let isRefreshing = false;
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
      if (!refreshToken) return Promise.reject(error);

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push({ resolve });
        }).then((newAccessToken) => {
          originalRequest.headers.Authorization = \`Bearer \${newAccessToken}\`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(\`\${baseURL}/auth/refresh\`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        resolveQueue(data.accessToken);
        originalRequest.headers.Authorization = \`Bearer \${data.accessToken}\`;
        return client(originalRequest);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);`,
    explanation: [
      "When an access token expires mid-session, any API call returns 401. Without this, every one of those failures would either log the user out immediately or each try to refresh independently.",
      "The tricky part: if five requests all get a 401 at the same moment (common right after a token expires - a page that fires several API calls on load), you don't want five separate refresh calls hitting the server. The isRefreshing flag makes only the first one actually call /auth/refresh; the other four push a resolver into pendingQueue and just wait.",
      "Once the real refresh finishes, resolveQueue() replays every waiting request with the new token. The _retry flag stops a request that fails even after a refresh from looping forever.",
    ],
    interviewAngle: "This is a request-deduplication / thundering-herd problem. The general pattern - a boolean flag plus a queue of pending promises - shows up anywhere multiple concurrent callers need to wait on one in-flight async operation instead of each triggering their own.",
  },
  {
    id: 'rbac-middleware',
    title: 'Role-based access as a middleware factory',
    file: 'backend/src/middleware/auth.js',
    tags: ['Auth', 'Express', 'Backend'],
    code: `function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Access token required' });

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
}`,
    explanation: [
      "verifyToken is a standard Express middleware - it checks the Authorization header, verifies the JWT signature, and attaches the decoded user info to req.user for every route handler downstream to use.",
      "requireRole isn't a middleware itself - it's a function that returns one. Calling requireRole('admin') builds a middleware scoped to just that role, so the same function can gate different routes to different roles without writing a new function each time.",
      "Order matters: requireRole reads req.user, which only exists if verifyToken already ran. A route that needs role-gating always chains both: router.get('/admin-only', verifyToken, requireRole('admin'), handler).",
    ],
    interviewAngle: "This is the middleware factory pattern - a function that generates configured middleware instead of hardcoding the config inline. It's how most real RBAC systems avoid one giant if/else per role.",
  },
  {
    id: 'ui-gate-vs-server-gate',
    title: 'Two "owner-only" pages, two very different levels of real security',
    file: 'backend/src/routes/adminRoutes.js',
    tags: ['Auth', 'Security', 'Backend'],
    code: `const router = express.Router();

// Every route below requires a real 'admin' role, checked server-side off the JWT -
// not just a frontend email check, since these routes can delete data and ban users.
router.use(verifyToken, requireRole('admin'));

router.get('/overview', getOverview);
router.get('/delay-reports', listDelayReports);
router.delete('/delay-reports/:id', deleteDelayReport);
router.get('/users', listUsers);
router.patch('/users/:id/ban', toggleBan);`,
    explanation: [
      "TrainMitra actually has two different \"only I can see this\" pages, built with two deliberately different security models, and knowing when each is appropriate is the real lesson. /learner checks isLearnerOwner(user) - a plain string comparison against user.email, done entirely in React. It's a UI-only gate: fine for that page, because the worst case of someone bypassing it is reading interview-prep notes, which isn't a real harm.",
      "/admin is different: it can delete other people's data and ban accounts, so a client-side check alone isn't good enough - anyone could open devtools, flip a value in localStorage, and see a UI that lets them press real buttons. So the actual authorization for every /api/admin/* route happens here, server-side, off requireRole('admin') reading the role claim baked into the signed JWT at login time - a value the client cannot forge without the server's signing secret.",
      "The frontend still has its own isAdmin(user) check (in constants/access.js) so a non-admin sees a clean 'You are not an admin' message instead of a dashboard full of buttons that would just 403. But that frontend check is UX, not security - the comment in this file says it directly: real access control lives server-side.",
    ],
    interviewAngle: "This is the classic 'never trust the client' principle, made concrete with two real examples from the same codebase - one where a client-only gate was an acceptable, deliberate tradeoff, and one where it wasn't. Being able to explain *why* the bar is different for the two pages (blast radius: read-only content vs. destructive admin actions) is a stronger answer than just reciting 'always check on the server.'",
  },
  {
    id: 'password-hashing',
    title: 'Never storing (or comparing) a raw password',
    file: 'backend/src/controllers/authController.js',
    tags: ['Auth', 'bcrypt', 'Backend'],
    code: `// register:
const passwordHash = await bcrypt.hash(password, 10);
const user = await User.create({ name, email, passwordHash, ... });

// login:
const user = await User.findOne({ email: email.toLowerCase() });
if (!user) return res.status(401).json({ message: 'Invalid credentials' });

const match = await bcrypt.compare(password, user.passwordHash);
if (!match) return res.status(401).json({ message: 'Invalid credentials' });`,
    explanation: [
      "bcrypt.hash(password, 10) doesn't just hash - it salts automatically and runs 2^10 rounds of key-stretching, which is what makes brute-forcing a stolen hash database expensive even for short passwords.",
      "There's no decrypt step anywhere, because there's no way to decrypt a hash - login works by hashing the login attempt's password with the same salt (stored inside the hash string itself) and comparing hash output, via bcrypt.compare.",
      "Both the \"user not found\" and \"wrong password\" cases return the exact same message and status code. That's deliberate - a different message for each would let an attacker enumerate which emails have accounts.",
    ],
    interviewAngle: "Classic: 'why not just encrypt the password?' Because encryption is reversible by design (that's the whole point of a cipher) and a hash isn't - you never want a code path, even a broken one, that can recover a user's real password.",
  },
  {
    id: 'server-authoritative-date',
    title: "Never trust the client for \"today\"",
    file: 'backend/src/utils/dateUtils.js + delayReportController.js',
    tags: ['Security', 'Backend'],
    code: `// dateUtils.js
function todayIST() {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const shifted = new Date(Date.now() + IST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

// delayReportController.js - createReport
// journeyDate is never taken from the client - always "today" in IST, computed
// server-side, so reports can't be backdated/forward-dated to dodge the daily wipe.
const journeyDate = todayIST();`,
    explanation: [
      "The trick in todayIST(): Date.now() gives the true UTC instant. Adding IST's offset (+5:30) and then formatting with the UTC-based toISOString() produces a string whose digits read as IST wall-clock time, without needing a timezone library.",
      "The important design decision isn't the date math itself - it's that the client never gets a say in what \"today\" is. If the frontend sent journeyDate in the request body, a user could post a delay report dated tomorrow to dodge today's rate limit, or dated yesterday to slip past moderation on an already-quiet day.",
      "This same pattern (server computes anything that gates a rule, client only sends the content) shows up again in the AI chat's rate limiter and the Tatkal countdown logic.",
    ],
    interviewAngle: "General security principle: never trust client-supplied data for anything that enforces a rule (dates, prices, permissions, quotas) - only for the content the rule applies to.",
  },
  {
    id: 'sliding-window-rate-limit',
    title: 'A sliding-window rate limiter in about 15 lines',
    file: 'backend/src/middleware/chatRateLimit.js',
    tags: ['Rate limiting', 'Backend'],
    code: `const WINDOW_MS = 60 * 1000;
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
}`,
    explanation: [
      "This protects the AI chat endpoint's free API quota from one client hammering it. Every IP gets its own array of timestamps in a Map.",
      "On each request, it drops any timestamp older than 60 seconds ago, then checks whether what's left is already at the limit. This is a true sliding window (unlike a fixed window that resets on the clock, e.g. \"8 per minute starting :00\") - it's always looking at the last 60 seconds relative to right now, so there's no burst-at-the-boundary exploit where you fire 8 requests at :59 and 8 more at :01.",
      "The trade-off, called out directly in the code: this is in-memory, so it only works correctly on a single server instance. Scale to multiple instances and you'd need a shared store like Redis instead of a local Map.",
    ],
    interviewAngle: "Compare fixed window vs sliding window vs token bucket rate limiting if this comes up - this file is a working example of the middle one, small enough to reproduce on a whiteboard.",
  },
  {
    id: 'toggle-voting',
    title: 'The three-way branch every upvote/downvote button needs',
    file: 'backend/src/controllers/delayReportController.js',
    tags: ['State logic', 'Backend'],
    code: `const existingVote = report.votedBy.find((v) => v.userId.equals(req.user.userId));

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
}`,
    explanation: [
      "A vote button looks simple in the UI but has exactly three real states to handle: the user hasn't voted yet, the user clicked the same vote again (should toggle it off), or the user is switching from up to down or vice versa (should move the count from one bucket to the other, not just add to the new one).",
      "The easy bug here is forgetting the third case and only handling \"add a vote\" / \"remove a vote\" - that leaves stale counts when someone flips their vote, since the old vote's count never gets decremented.",
      "votedBy stores who voted and how, per report - that's what makes \"did this user already vote, and how\" a single .find() instead of a separate counting query.",
    ],
    interviewAngle: "A good one to actually code live in an interview - the failure mode (forgetting to decrement the old count on a switch) is exactly the kind of bug that passes a shallow test (\"can I upvote?\") but fails a real one (\"can I upvote then downvote?\").",
  },
  {
    id: 'dynamic-aggregation',
    title: 'Building a MongoDB aggregation pipeline from a list of fields',
    file: 'backend/src/controllers/journeyExperienceController.js',
    tags: ['MongoDB', 'Aggregation', 'Backend'],
    code: `const RATING_FIELDS = ['cleanliness', 'food', 'staffBehaviour', 'punctuality', 'safety'];

const groupStage = { _id: null, count: { $sum: 1 } };
RATING_FIELDS.forEach((field) => {
  groupStage[field] = { $avg: \`$\${field}\` };
});

const [summary] = await JourneyExperience.aggregate([
  { $match: { trainNumber: train } },
  { $group: groupStage },
]);

// then, outside the pipeline:
const overallSum = RATING_FIELDS.reduce((sum, field) => sum + summary[field], 0);
averages.overall = Math.round((overallSum / RATING_FIELDS.length) * 10) / 10;`,
    explanation: [
      "Instead of hand-writing $avg: '$cleanliness', $avg: '$food', ... five times, the $group stage object is built by looping over RATING_FIELDS. Add a sixth rating category later and this code needs zero changes - just add the field name to the array.",
      "\\`$\\${field}\\` is building a Mongo field reference string like \"$cleanliness\" - the leading $ is Mongo's syntax for \"the value of this field\", not a JS template thing.",
      "The \"overall\" score is deliberately computed in JavaScript after the aggregation, not inside the pipeline - averaging five already-averaged numbers is simple enough that adding another $group stage or $addFields for it would be more pipeline complexity than it's worth.",
    ],
    interviewAngle: "Shows two things at once: dynamic pipeline construction (useful whenever a schema field list might grow) and knowing when *not* to push more logic into the database - sometimes plain JS on a small aggregated result is the more readable choice.",
  },
  {
    id: 'socket-rooms',
    title: 'Scoping real-time broadcasts with Socket.io rooms',
    file: 'backend/src/socket.js',
    tags: ['Socket.io', 'Real-time', 'Backend'],
    code: `function roomName(trainNumber, journeyDate) {
  return \`\${trainNumber}:\${journeyDate}\`;
}

socket.on('join_train_room', ({ trainNumber, journeyDate }) => {
  if (!trainNumber || !journeyDate) return;
  socket.join(roomName(trainNumber, journeyDate));
});

function emitToTrainRoom(trainNumber, journeyDate, event, payload) {
  if (!io) return;
  io.to(roomName(trainNumber, journeyDate)).emit(event, payload);
}`,
    explanation: [
      "Without rooms, every live status update would broadcast to every connected client, and the frontend would have to filter out updates for trains it doesn't care about. Instead, a client only joins the room for the specific train + date it's currently viewing, and emitToTrainRoom only reaches clients in that exact room.",
      "The room key is trainNumber:journeyDate, not just trainNumber - because delay reports and live status both reset daily, yesterday's room for the same train is a dead room nobody needs to hear from anymore.",
      "Separately, the online-count badge doesn't use rooms at all - it broadcasts globally to everyone via io.emit(), because \"how many people are online right now\" is meant to be site-wide, not per-train.",
    ],
    interviewAngle: "Rooms vs. global broadcast is the core design decision in most real-time features - the question to ask is always \"who actually needs this event?\" If the answer is \"everyone,\" broadcast globally; if it's \"people looking at this one thing,\" scope it to a room.",
  },
  {
    id: 'agentic-tool-loop',
    title: "The AI assistant's tool-calling loop",
    file: 'backend/src/services/geminiChat.js',
    tags: ['AI', 'Agents', 'Backend'],
    code: `let response = await chat.sendMessage({ message });

let round = 0;
while (response.functionCalls && response.functionCalls.length > 0 && round < MAX_TOOL_ROUNDS) {
  const calls = response.functionCalls;
  const results = await Promise.all(calls.map((call) => runTool(call.name, call.args)));
  const responseParts = calls.map((call, i) => ({
    functionResponse: { name: call.name, response: results[i] },
  }));
  response = await chat.sendMessage({ message: responseParts });
  round += 1;
}

return response.text;`,
    explanation: [
      "This is the entire \"agent\" behind the chat assistant. The model isn't given direct database access - it's given a list of named tools (search_trains, get_delay_reports, etc.) and, on each turn, can either answer in plain text or ask to call one or more of them.",
      "When it asks for tools, the loop actually executes them (real Mongoose queries against the real database) and sends the results back as a new turn, letting the model see real data before it writes its final answer. This can repeat - a question might need one tool call, or a few in sequence.",
      "Two details matter for correctness: calls.map(...Promise.all...) runs multiple tool calls from the same turn in parallel instead of one-by-one, and round < MAX_TOOL_ROUNDS is a hard ceiling so a model that gets stuck in a call-a-tool loop can't hang the request forever.",
    ],
    interviewAngle: "This is the standard function-calling / ReAct-style agent loop used by virtually every LLM tool-use system: request → model decides to call tools or answer → if tools, execute and feed results back → repeat until the model just answers. Knowing this loop by hand is worth more than knowing any one SDK's API for it.",
  },
  {
    id: 'next-occurrence',
    title: "Computing \"the next 10 AM\" across a timezone the server isn't in",
    file: 'backend/src/services/chatTools.js',
    tags: ['Date math', 'Backend'],
    code: `const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function nowIST() {
  return new Date(Date.now() + IST_OFFSET_MS);
}

function nextISTClockTime(hour) {
  const shiftedNow = nowIST();
  const shiftedNext = new Date(shiftedNow);
  shiftedNext.setUTCHours(hour, 0, 0, 0);
  if (shiftedNext <= shiftedNow) shiftedNext.setUTCDate(shiftedNext.getUTCDate() + 1);
  return new Date(shiftedNext.getTime() - IST_OFFSET_MS);
}`,
    explanation: [
      "The server might run anywhere - UTC, US timezones, wherever the host is - but Tatkal timings are always in IST. This computes \"the next time it's 10:00 AM in India\" without a timezone library.",
      "The trick: nowIST() fakes an IST clock by shifting the real UTC instant forward by IST's offset, then reading it with UTC getters/setters (setUTCHours, getUTCDate) instead of local ones. Because the shift already baked IST into the number, the UTC methods end up reading and writing IST wall-clock digits.",
      "The one rule that makes this safe: once you start using the shifted trick, you have to keep using UTC-based methods consistently - mixing in a local getHours() here would reintroduce the server's own timezone and break the whole thing.",
      "At the very end, .getTime() - IST_OFFSET_MS converts back to a real, correct UTC instant - so the returned Date is genuinely correct no matter what timezone the server itself is in.",
    ],
    interviewAngle: "A great \"walk me through tricky code\" interview answer, because the bug potential is real: forgetting to convert back at the end, or mixing local and UTC methods, silently produces a time that's off by whatever the server's local offset happens to be - which won't show up in local testing if your dev machine happens to already be in IST.",
  },
  {
    id: 'i18n-scope-boundary',
    title: 'Translating the app without translating what passengers actually said',
    file: 'frontend/src/i18n/index.js',
    tags: ['i18n', 'react-i18next', 'Frontend'],
    code: `const stored = localStorage.getItem('language');
const initialLanguage = SUPPORTED_LANGUAGES.includes(stored) ? stored : 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi }, /* ...7 more */ },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function changeLanguage(code) {
  i18n.changeLanguage(code);
  localStorage.setItem('language', code);
}`,
    explanation: [
      "TrainMitra supports 9 languages (English, Hindi, Bengali, Tamil, Marathi, Kannada, Punjabi, Odia, Telugu) via react-i18next - one flat JSON file per language, all loaded up front as static resources rather than lazy-fetched, since the whole set is well under a megabyte combined and this avoids a loading flash when someone switches languages.",
      "The scope decision matters more than the library choice: only the site's own UI text - buttons, headings, labels, static copy - goes through t(). What a passenger actually types into a delay report or a live status update is rendered exactly as submitted, in whatever language or script they wrote it in, and is never auto-translated. Free machine translation of short, informal, often Hinglish-mixed passenger text is genuinely unreliable, and a mistranslated delay reason is worse than an untranslated one - it can misrepresent what someone actually reported. This mirrors the app's existing 'never fake data' principle from the Tatkal/Journey Experience features, just applied to language instead of predictions.",
      "changeLanguage() does two things, not one: it calls i18next's own i18n.changeLanguage() (which triggers every t()-consuming component to re-render in the new language, no page reload needed) and separately writes the choice to localStorage, read back by the initialLanguage line above on the next visit. Two responsibilities in one small wrapper function so nothing that wants to switch languages has to remember to do both.",
    ],
    interviewAngle: "A good example of scoping a feature by its failure mode, not just its happy path - the interesting engineering decision here isn't 'how do I wire up an i18n library', it's 'where exactly does automatic translation stop being safe', and being able to articulate that boundary (system-authored text vs. user-authored text) is a stronger answer than just describing the library.",
  },
];
