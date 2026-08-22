const User = require('../models/User');
const DelayReport = require('../models/DelayReport');
const LiveStatusUpdate = require('../models/LiveStatusUpdate');
const TatkalExperience = require('../models/TatkalExperience');
const JourneyExperience = require('../models/JourneyExperience');
const { todayIST } = require('../utils/dateUtils');
const { getOnlineCount, getOnlineUsers } = require('../socket');

async function getOverview(req, res) {
  try {
    const journeyDate = todayIST();
    const [users, delayReportsToday, liveStatusToday, tatkalExperienceTotal, journeyExperienceTotal] = await Promise.all([
      User.countDocuments(),
      DelayReport.countDocuments({ journeyDate }),
      LiveStatusUpdate.countDocuments({ journeyDate }),
      TatkalExperience.countDocuments(),
      JourneyExperience.countDocuments(),
    ]);

    res.json({
      users,
      onlineNow: getOnlineCount(),
      delayReportsToday,
      liveStatusToday,
      tatkalExperienceTotal,
      journeyExperienceTotal,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch overview', error: err.message });
  }
}

// Flat across all trains (not per-train like the public endpoint) so a spam wave
// on any train surfaces here, sorted worst-first by downvotes.
async function listDelayReports(req, res) {
  try {
    const journeyDate = todayIST();
    const reports = await DelayReport.find({ journeyDate })
      .populate('reportedBy', 'name email reputationScore')
      .sort({ downvotes: -1, createdAt: -1 })
      .lean();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch delay reports', error: err.message });
  }
}

async function deleteDelayReport(req, res) {
  try {
    const report = await DelayReport.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Delay report not found' });
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete delay report', error: err.message });
  }
}

async function listLiveStatus(req, res) {
  try {
    const journeyDate = todayIST();
    const updates = await LiveStatusUpdate.find({ journeyDate })
      .populate('reportedBy', 'name email reputationScore')
      .sort({ downvotes: -1, timestamp: -1 })
      .lean();
    res.json(updates);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch live status updates', error: err.message });
  }
}

async function deleteLiveStatus(req, res) {
  try {
    const update = await LiveStatusUpdate.findByIdAndDelete(req.params.id);
    if (!update) {
      return res.status(404).json({ message: 'Live status update not found' });
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete live status update', error: err.message });
  }
}

function listOnlineUsers(req, res) {
  res.json(getOnlineUsers());
}

async function listUsers(req, res) {
  try {
    const users = await User.find()
      .select('name email role isBanned reputationScore createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
}

async function toggleBan(req, res) {
  try {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (target.role === 'admin') {
      return res.status(400).json({ message: "Can't ban an admin account" });
    }
    target.isBanned = !target.isBanned;
    await target.save();
    res.json({ id: target._id, isBanned: target.isBanned });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update ban status', error: err.message });
  }
}

module.exports = {
  getOverview,
  listDelayReports,
  deleteDelayReport,
  listLiveStatus,
  deleteLiveStatus,
  listOnlineUsers,
  listUsers,
  toggleBan,
};
