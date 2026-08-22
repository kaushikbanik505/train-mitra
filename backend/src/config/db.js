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
