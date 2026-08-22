const User = require('../models/User');

// Net upvotes a user needs (across all their delay reports/live status updates,
// accumulated over time) before the UI marks them as a trusted contributor.
const TRUSTED_REPUTATION_THRESHOLD = 15;

// Delay reports/live status updates are wiped daily (see dailyCleanup.js), so a vote's
// effect can't be recomputed from history later - it has to be applied to the author's
// persistent User.reputationScore at the moment the vote happens. Self-votes are
// deliberately excluded: self-voting is allowed on your own posts (an earlier product
// decision), but letting that also move your own reputation would make the "track
// record" signal trivially farmable with your daily report quota.
async function applyReputationDelta(authorId, voterId, delta) {
  if (!delta || String(authorId) === String(voterId)) return;
  await User.findByIdAndUpdate(authorId, { $inc: { reputationScore: delta } });
}

module.exports = { TRUSTED_REPUTATION_THRESHOLD, applyReputationDelta };
