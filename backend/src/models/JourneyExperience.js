const mongoose = require('mongoose');

const journeyExperienceSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, trim: true },
  cleanliness: { type: Number, required: true, min: 1, max: 5 },
  food: { type: Number, required: true, min: 1, max: 5 },
  staffBehaviour: { type: Number, required: true, min: 1, max: 5 },
  punctuality: { type: Number, required: true, min: 1, max: 5 },
  safety: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 300, default: '' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// One rating per user per train - resubmitting updates the existing rating (upsert)
// instead of creating a duplicate, so this doubles as its own anti-spam limit.
journeyExperienceSchema.index({ trainNumber: 1, reportedBy: 1 }, { unique: true });

module.exports = mongoose.model('JourneyExperience', journeyExperienceSchema);
