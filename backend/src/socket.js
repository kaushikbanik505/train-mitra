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
