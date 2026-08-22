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
