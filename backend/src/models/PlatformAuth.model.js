const mongoose = require('mongoose');

const platformAuthSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platform: {
    type: String,
    enum: ['youtube', 'twitch', 'facebook', 'kick', 'rumble', 'telegram', 'x', 'instagram', 'tiktok', 'bigo'],
    required: true
  },
  accountId: {
    type: String,
    default: () => require('crypto').randomUUID(),
    required: true,
  },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiry: { type: Date },
  platformUserId: { type: String },
  platformUsername: { type: String },
  connected: { type: Boolean, default: false }
}, { timestamps: true });

platformAuthSchema.index({ user: 1, platform: 1, accountId: 1 }, { unique: true });

module.exports = mongoose.model('PlatformAuth', platformAuthSchema);
