const TatkalExperience = require('../models/TatkalExperience');
const Train = require('../models/Train');

const SEAT_CATEGORIES = ['AC', 'Sleeper'];

async function getInsight(req, res) {
  try {
    const { train } = req.params;

    const rows = await TatkalExperience.aggregate([
      { $match: { trainNumber: train } },
      { $group: { _id: '$seatCategory', avgMinutes: { $avg: '$estimatedMinutesToSellOut' }, count: { $sum: 1 } } },
    ]);

    const insight = { AC: null, Sleeper: null };
    rows.forEach((row) => {
      insight[row._id] = { avgMinutes: Math.round(row.avgMinutes * 10) / 10, count: row.count };
    });

    res.json(insight);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch Tatkal experience insight', error: err.message });
  }
}

async function submitExperience(req, res) {
  try {
    const { trainNumber, seatCategory, estimatedMinutesToSellOut } = req.body;
    if (!trainNumber || !seatCategory || estimatedMinutesToSellOut === undefined) {
      return res.status(400).json({ message: 'trainNumber, seatCategory and estimatedMinutesToSellOut are required' });
    }
    if (!SEAT_CATEGORIES.includes(seatCategory)) {
      return res.status(400).json({ message: "seatCategory must be 'AC' or 'Sleeper'" });
    }
    const minutes = Number(estimatedMinutesToSellOut);
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 180) {
      return res.status(400).json({ message: 'estimatedMinutesToSellOut must be a number between 0 and 180' });
    }

    const train = await Train.findOne({ trainNumber });
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    const experience = await TatkalExperience.create({
      trainNumber,
      seatCategory,
      estimatedMinutesToSellOut: minutes,
      reportedBy: req.user.userId,
    });

    res.status(201).json(experience);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit Tatkal experience', error: err.message });
  }
}

module.exports = { getInsight, submitExperience };
