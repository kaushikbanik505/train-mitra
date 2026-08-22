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
