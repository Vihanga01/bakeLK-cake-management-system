const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: String,
  role: { type: String, default: 'user' },
  points: { type: Number, default: 0 },
  level: { type: String, enum: ['Silver', 'Gold', 'Platinum'], default: 'Silver' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
