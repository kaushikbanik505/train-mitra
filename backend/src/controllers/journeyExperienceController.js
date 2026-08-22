const JourneyExperience = require('../models/JourneyExperience');
const Train = require('../models/Train');

const RATING_FIELDS = ['cleanliness', 'food', 'staffBehaviour', 'punctuality', 'safety'];
const RECENT_COMMENTS_LIMIT = 10;

async function getInsight(req, res) {
  try {
    const { train } = req.params;

    const groupStage = { _id: null, count: { $sum: 1 } };
    RATING_FIELDS.forEach((field) => {
      groupStage[field] = { $avg: `$${field}` };
    });

    const [summary] = await JourneyExperience.aggregate([
      { $match: { trainNumber: train } },
      { $group: groupStage },
    ]);

    let averages = null;
    if (summary) {
      averages = { count: summary.count };
      RATING_FIELDS.forEach((field) => {
        averages[field] = Math.round(summary[field] * 10) / 10;
      });
      const overallSum = RATING_FIELDS.reduce((sum, field) => sum + summary[field], 0);
      averages.overall = Math.round((overallSum / RATING_FIELDS.length) * 10) / 10;
    }

    const recentComments = await JourneyExperience.find({ trainNumber: train, comment: { $ne: '' } })
      .sort({ createdAt: -1 })
      .limit(RECENT_COMMENTS_LIMIT)
      .populate('reportedBy', 'name')
      .select('comment createdAt reportedBy');

    res.json({
      averages,
      recentComments: recentComments.map((c) => ({
        comment: c.comment,
        createdAt: c.createdAt,
        name: c.reportedBy?.name || 'A passenger',
      })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch journey experience insight', error: err.message });
  }
}

async function getMine(req, res) {
  try {
    const { train } = req.params;
    const existing = await JourneyExperience.findOne({ trainNumber: train, reportedBy: req.user.userId });
    res.json(existing || null);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your journey experience', error: err.message });
  }
}

async function submitExperience(req, res) {
  try {
    const { trainNumber, comment } = req.body;
    if (!trainNumber) {
      return res.status(400).json({ message: 'trainNumber is required' });
    }

    const ratings = {};
    for (const field of RATING_FIELDS) {
      const value = Number(req.body[field]);
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        return res.status(400).json({ message: `${field} must be a whole number between 1 and 5` });
      }
      ratings[field] = value;
    }

    if (comment !== undefined && typeof comment === 'string' && comment.length > 300) {
      return res.status(400).json({ message: 'comment must be 300 characters or fewer' });
    }

    const train = await Train.findOne({ trainNumber });
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    const experience = await JourneyExperience.findOneAndUpdate(
      { trainNumber, reportedBy: req.user.userId },
      { ...ratings, comment: comment?.trim() || '', trainNumber, reportedBy: req.user.userId },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(experience);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit journey experience', error: err.message });
  }
}

module.exports = { getInsight, getMine, submitExperience };
