const DAILY_DELAY_REPORT_LIMIT = 10;
const DAILY_LIVE_STATUS_LIMIT = 10;
const DOWNVOTE_BLOCK_THRESHOLD = 10;

// Lazily required to avoid a require cycle (models don't need this file).
function models() {
  return {
    DelayReport: require('../models/DelayReport'),
    LiveStatusUpdate: require('../models/LiveStatusUpdate'),
  };
}

// A single post that collects too many "false"/dislike votes blocks that user from
// posting *anything* (either type) for the rest of the day - same-day only, since it's
// scoped to journeyDate which is always today; the daily wipe clears the slate tomorrow.
async function isBlockedToday(userId, journeyDate) {
  const { DelayReport, LiveStatusUpdate } = models();
  const [badReport, badUpdate] = await Promise.all([
    DelayReport.exists({ reportedBy: userId, journeyDate, downvotes: { $gt: DOWNVOTE_BLOCK_THRESHOLD } }),
    LiveStatusUpdate.exists({ reportedBy: userId, journeyDate, downvotes: { $gt: DOWNVOTE_BLOCK_THRESHOLD } }),
  ]);
  return Boolean(badReport || badUpdate);
}

async function getDelayReportUsage(userId, journeyDate) {
  const { DelayReport } = models();
  const used = await DelayReport.countDocuments({ reportedBy: userId, journeyDate });
  return { used, limit: DAILY_DELAY_REPORT_LIMIT, remaining: Math.max(0, DAILY_DELAY_REPORT_LIMIT - used) };
}

async function getLiveStatusUsage(userId, journeyDate) {
  const { LiveStatusUpdate } = models();
  const used = await LiveStatusUpdate.countDocuments({ reportedBy: userId, journeyDate });
  return { used, limit: DAILY_LIVE_STATUS_LIMIT, remaining: Math.max(0, DAILY_LIVE_STATUS_LIMIT - used) };
}

async function hasReachedDelayReportLimit(userId, journeyDate) {
  const { remaining } = await getDelayReportUsage(userId, journeyDate);
  return remaining <= 0;
}

async function hasReachedLiveStatusLimit(userId, journeyDate) {
  const { remaining } = await getLiveStatusUsage(userId, journeyDate);
  return remaining <= 0;
}

module.exports = {
  DAILY_DELAY_REPORT_LIMIT,
  DAILY_LIVE_STATUS_LIMIT,
  DOWNVOTE_BLOCK_THRESHOLD,
  isBlockedToday,
  getDelayReportUsage,
  getLiveStatusUsage,
  hasReachedDelayReportLimit,
  hasReachedLiveStatusLimit,
};
