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
