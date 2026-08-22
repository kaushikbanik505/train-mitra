const mongoose = require('mongoose');

const liveStatusUpdateSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, trim: true },
  journeyDate: { type: String, required: true, trim: true }, // "YYYY-MM-DD"
  stationName: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true, maxlength: 300 },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

liveStatusUpdateSchema.index({ trainNumber: 1, journeyDate: 1, timestamp: -1 });

module.exports = mongoose.model('LiveStatusUpdate', liveStatusUpdateSchema);
