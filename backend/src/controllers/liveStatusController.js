const mongoose = require('mongoose');
const LiveStatusUpdate = require('../models/LiveStatusUpdate');
const Train = require('../models/Train');
const { emitToTrainRoom } = require('../socket');
const { todayIST } = require('../utils/dateUtils');
const {
  DAILY_LIVE_STATUS_LIMIT,
  isBlockedToday,
  hasReachedLiveStatusLimit,
  getLiveStatusUsage,
} = require('../utils/moderation');
const { applyReputationDelta } = require('../utils/reputation');

const RECENT_LIMIT = 50;

async function getQuota(req, res) {
  try {
    const journeyDate = todayIST();
    const [usage, blocked] = await Promise.all([
      getLiveStatusUsage(req.user.userId, journeyDate),
      isBlockedToday(req.user.userId, journeyDate),
    ]);
    res.json({ ...usage, blocked });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch quota', error: err.message });
  }
}

async function listUpdates(req, res) {
  try {
    const { train } = req.params;
    const journeyDate = todayIST();

    const updates = await LiveStatusUpdate.find({ trainNumber: train, journeyDate })
      .populate('reportedBy', 'name reputationScore')
      .sort({ timestamp: -1 })
      .limit(RECENT_LIMIT)
      .lean();

    res.json(updates);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch live status updates', error: err.message });
  }
}

async function createUpdate(req, res) {
  try {
    const { trainNumber, stationName, message, platformNumber } = req.body;
    if (!trainNumber || !stationName || !message || !message.trim()) {
      return res.status(400).json({ message: 'trainNumber, stationName and message are required' });
    }
    if (platformNumber && platformNumber.trim().length > 10) {
      return res.status(400).json({ message: 'platformNumber is too long' });
    }

    const train = await Train.findOne({ trainNumber });
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    const validStation = train.stops.some((s) => s.stationName === stationName)
      || train.origin.stationName === stationName
      || train.destination.stationName === stationName;
    if (!validStation) {
      return res.status(400).json({ message: 'stationName must be one of this train\'s stops' });
    }

    // journeyDate is never taken from the client - always "today" in IST, computed
    // server-side, so updates can't be backdated/forward-dated to dodge the daily wipe.
    const journeyDate = todayIST();

    if (await isBlockedToday(req.user.userId, journeyDate)) {
      return res.status(403).json({
        message: 'One of your posts today got too many false/dislike votes, so posting is blocked until tomorrow.',
      });
    }
    if (await hasReachedLiveStatusLimit(req.user.userId, journeyDate)) {
      return res.status(429).json({
        message: `You've reached today's limit of ${DAILY_LIVE_STATUS_LIMIT} live status updates. Try again after midnight IST.`,
      });
    }

    const update = await LiveStatusUpdate.create({
      trainNumber,
      journeyDate,
      stationName,
      platformNumber: platformNumber?.trim() || undefined,
      message: message.trim(),
      reportedBy: req.user.userId,
    });
    await update.populate('reportedBy', 'name reputationScore');

    emitToTrainRoom(trainNumber, journeyDate, 'live_status_update', update);

    res.status(201).json(update);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit live status update', error: err.message });
  }
}

async function voteUpdate(req, res) {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid update id' });
    }
    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({ message: "voteType must be 'up' or 'down'" });
    }

    const update = await LiveStatusUpdate.findById(id);
    if (!update) {
      return res.status(404).json({ message: 'Live status update not found' });
    }
    const existingVote = update.votedBy.find((v) => v.userId.equals(req.user.userId));
    const netBefore = update.upvotes - update.downvotes;

    if (!existingVote) {
      update.votedBy.push({ userId: req.user.userId, voteType });
      if (voteType === 'up') update.upvotes += 1;
      else update.downvotes += 1;
    } else if (existingVote.voteType === voteType) {
      update.votedBy = update.votedBy.filter((v) => !v.userId.equals(req.user.userId));
      if (voteType === 'up') update.upvotes -= 1;
      else update.downvotes -= 1;
    } else {
      existingVote.voteType = voteType;
      if (voteType === 'up') {
        update.upvotes += 1;
        update.downvotes -= 1;
      } else {
        update.downvotes += 1;
        update.upvotes -= 1;
      }
    }

    const netAfter = update.upvotes - update.downvotes;
    await applyReputationDelta(update.reportedBy, req.user.userId, netAfter - netBefore);

    await update.save();
    await update.populate('reportedBy', 'name reputationScore');

    emitToTrainRoom(update.trainNumber, update.journeyDate, 'live_status_vote_updated', update);

    res.json(update);
  } catch (err) {
    res.status(500).json({ message: 'Failed to register vote', error: err.message });
  }
}

module.exports = { getQuota, listUpdates, createUpdate, voteUpdate };
