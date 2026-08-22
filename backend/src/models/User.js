const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['guest', 'user', 'moderator', 'admin'],
    default: 'user',
  },
  bio: { type: String, default: '', trim: true, maxlength: 200 },
  avatar: { type: String, default: '' },
  links: {
    type: [{ type: String, trim: true, maxlength: 200 }],
    default: [],
    validate: { validator: (v) => v.length <= 10, message: 'You can add up to 10 links' },
  },
  phone: { type: String, default: '', trim: true, maxlength: 15 },
  homeStation: { type: String, default: '', trim: true, maxlength: 100 },
  reputationScore: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false },
  refreshToken: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationTokenExpires: { type: Date, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('User', userSchema);
