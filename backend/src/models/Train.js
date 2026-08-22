const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  stationName: { type: String, required: true, trim: true },
  stationCode: { type: String, required: true, trim: true, uppercase: true },
}, { _id: false });

const stopSchema = new mongoose.Schema({
  stationName: { type: String, required: true, trim: true },
  stationCode: { type: String, required: true, trim: true, uppercase: true },
  distanceKm: { type: Number, required: true },
  dayOfJourney: { type: Number, required: true, default: 1 },
  sequence: { type: Number, required: true },
  // "HH:MM" 24h, estimated from distance/avg-speed — null at origin (no arrival) / terminus (no departure)
  arrivalTime: { type: String, default: null },
  departureTime: { type: String, default: null },
}, { _id: false });

const trainSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, unique: true, trim: true },
  trainName: { type: String, required: true, trim: true },
  origin: { type: stationSchema, required: true },
  destination: { type: stationSchema, required: true },
  stops: { type: [stopSchema], default: [] },
}, { timestamps: { createdAt: true, updatedAt: false } });

trainSchema.index({ trainName: 'text' });

module.exports = mongoose.model('Train', trainSchema);
