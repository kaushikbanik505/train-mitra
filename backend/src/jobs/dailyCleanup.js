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
