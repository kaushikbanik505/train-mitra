const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  voteType: { type: String, enum: ['up', 'down'], required: true },
}, { _id: false });

module.exports = voteSchema;
