const LiveStatusUpdate = require('../models/LiveStatusUpdate');
const Train = require('../models/Train');
const { emitToTrainRoom } = require('../socket');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const RECENT_LIMIT = 50;

async function listUpdates(req, res) {
  try {
    const { train, date } = req.params;
    if (!DATE_RE.test(date)) {
      return res.status(400).json({ message: 'date must be in YYYY-MM-DD format' });
    }

    const updates = await LiveStatusUpdate.find({ trainNumber: train, journeyDate: date })
      .populate('reportedBy', 'name')
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
    const { trainNumber, journeyDate, stationName, message } = req.body;
    if (!trainNumber || !journeyDate || !stationName || !message) {
      return res.status(400).json({ message: 'trainNumber, journeyDate, stationName and message are required' });
    }
    if (!DATE_RE.test(journeyDate)) {
      return res.status(400).json({ message: 'journeyDate must be in YYYY-MM-DD format' });
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

    const update = await LiveStatusUpdate.create({
      trainNumber,
      journeyDate,
      stationName,
      message: message.trim(),
      reportedBy: req.user.userId,
    });
    await update.populate('reportedBy', 'name');

    emitToTrainRoom(trainNumber, journeyDate, 'live_status_update', update);

    res.status(201).json(update);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit live status update', error: err.message });
  }
}

module.exports = { listUpdates, createUpdate };
