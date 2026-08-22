const mongoose = require('mongoose');

const tatkalExperienceSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, trim: true },
  seatCategory: { type: String, required: true, enum: ['AC', 'Sleeper'] },
  estimatedMinutesToSellOut: { type: Number, required: true, min: 0, max: 180 },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

tatkalExperienceSchema.index({ trainNumber: 1, seatCategory: 1 });

module.exports = mongoose.model('TatkalExperience', tatkalExperienceSchema);
