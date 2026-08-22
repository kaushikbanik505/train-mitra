const mongoose = require('mongoose');
const DelayReport = require('../models/DelayReport');
const Train = require('../models/Train');
const { emitToTrainRoom } = require('../socket');
const { todayIST } = require('../utils/dateUtils');
const {
  DAILY_DELAY_REPORT_LIMIT,
  isBlockedToday,
  hasReachedDelayReportLimit,
  getDelayReportUsage,
} = require('../utils/moderation');
const { applyReputationDelta } = require('../utils/reputation');

async function getQuota(req, res) {
  try {
    const journeyDate = todayIST();
    const [usage, blocked] = await Promise.all([
      getDelayReportUsage(req.user.userId, journeyDate),
      isBlockedToday(req.user.userId, journeyDate),
    ]);
    res.json({ ...usage, blocked });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch quota', error: err.message });
  }
}

async function listReports(req, res) {
  try {
    const { train } = req.params;
    const journeyDate = todayIST();

    const reports = await DelayReport.find({ trainNumber: train, journeyDate })
      .populate('reportedBy', 'name reputationScore')
      .sort({ createdAt: -1 })
      .lean();

    reports.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch delay reports', error: err.message });
  }
}

async function createReport(req, res) {
  try {
    const { trainNumber, reason } = req.body;
    if (!trainNumber || !reason || !reason.trim()) {
      return res.status(400).json({ message: 'trainNumber and reason are required' });
    }

    const train = await Train.findOne({ trainNumber });
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    // journeyDate is never taken from the client - always "today" in IST, computed
    // server-side, so reports can't be backdated/forward-dated to dodge the daily wipe.
    const journeyDate = todayIST();

    if (await isBlockedToday(req.user.userId, journeyDate)) {
      return res.status(403).json({
        message: 'One of your posts today got too many false/dislike votes, so posting is blocked until tomorrow.',
      });
    }
    if (await hasReachedDelayReportLimit(req.user.userId, journeyDate)) {
      return res.status(429).json({
        message: `You've reached today's limit of ${DAILY_DELAY_REPORT_LIMIT} delay reports. Try again after midnight IST.`,
      });
    }

    const report = await DelayReport.create({
      trainNumber,
      journeyDate,
      reason: reason.trim(),
      reportedBy: req.user.userId,
    });
    await report.populate('reportedBy', 'name reputationScore');

    emitToTrainRoom(trainNumber, journeyDate, 'new_delay_report', report);

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit delay report', error: err.message });
  }
}

async function voteReport(req, res) {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid report id' });
    }
    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({ message: "voteType must be 'up' or 'down'" });
    }

    const report = await DelayReport.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Delay report not found' });
    }
    const existingVote = report.votedBy.find((v) => v.userId.equals(req.user.userId));
    const netBefore = report.upvotes - report.downvotes;

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
    }

    const netAfter = report.upvotes - report.downvotes;
    await applyReputationDelta(report.reportedBy, req.user.userId, netAfter - netBefore);

    await report.save();
    await report.populate('reportedBy', 'name reputationScore');

    emitToTrainRoom(report.trainNumber, report.journeyDate, 'vote_updated', report);

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to register vote', error: err.message });
  }
}

module.exports = { getQuota, listReports, createReport, voteReport };
