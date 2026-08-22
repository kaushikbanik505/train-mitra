const mongoose = require('mongoose');
const voteSchema = require('./voteSchema');

const liveStatusUpdateSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, trim: true },
  journeyDate: { type: String, required: true, trim: true }, // "YYYY-MM-DD"
  stationName: { type: String, required: true, trim: true },
  platformNumber: { type: String, trim: true, maxlength: 10 },
  message: { type: String, required: true, trim: true, maxlength: 300 },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  votedBy: { type: [voteSchema], default: [] },
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

liveStatusUpdateSchema.index({ trainNumber: 1, journeyDate: 1, timestamp: -1 });

module.exports = mongoose.model('LiveStatusUpdate', liveStatusUpdateSchema);
