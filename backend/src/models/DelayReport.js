const mongoose = require('mongoose');
const voteSchema = require('./voteSchema');

const delayReportSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, trim: true },
  journeyDate: { type: String, required: true, trim: true }, // "YYYY-MM-DD"
  reason: { type: String, required: true, trim: true, maxlength: 300 },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  votedBy: { type: [voteSchema], default: [] },
}, { timestamps: { createdAt: true, updatedAt: false } });

delayReportSchema.index({ trainNumber: 1, journeyDate: 1 });

module.exports = mongoose.model('DelayReport', delayReportSchema);
