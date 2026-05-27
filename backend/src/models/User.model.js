const mongoose = require('mongoose');

const MAX_ACCOUNTS_PER_PLATFORM = 15;

const platformAccountSchema = new mongoose.Schema({
  accountId: {
    type: String,
    default: () => require('crypto').randomUUID(),
    required: true,
  },
  label: {
    type: String,
    default: 'Account 1',
  },
  streamKey: String,
  rtmpUrl: String,
  connectedAt: Date,
}, { _id: false });

const PLATFORM_NAMES = [
  'youtube', 'twitch', 'facebook', 'kick', 'rumble',
  'telegram', 'x', 'instagram', 'tiktok', 'bigo',
];

const platformAccountsArraySchema = {
  type: [platformAccountSchema],
  default: () => [],
  set: (value) => (value == null ? [] : value),
  validate: {
    validator: (accounts) => {
      const list = accounts == null ? [] : accounts;
      return list.length <= MAX_ACCOUNTS_PER_PLATFORM;
    },
    message: `Maximum ${MAX_ACCOUNTS_PER_PLATFORM} accounts allowed per platform`,
  },
};

const normalizeUserPlatforms = (platforms) => {
  if (!platforms || typeof platforms !== 'object') return;
  for (const platform of PLATFORM_NAMES) {
    if (platforms[platform] == null) {
      platforms[platform] = [];
    }
  }
};

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  avatar: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  twitchUsername: { type: String, default: null },
  platforms: {
    youtube:   platformAccountsArraySchema,
    twitch:    platformAccountsArraySchema,
    facebook:  platformAccountsArraySchema,
    kick:      platformAccountsArraySchema,
    rumble:    platformAccountsArraySchema,
    telegram:  platformAccountsArraySchema,
    x:         platformAccountsArraySchema,
    instagram: platformAccountsArraySchema,
    tiktok:    platformAccountsArraySchema,
    bigo:      platformAccountsArraySchema,
  },
}, { timestamps: true });

userSchema.pre('validate', function () {
  normalizeUserPlatforms(this.platforms);
});

userSchema.post('init', function () {
  normalizeUserPlatforms(this.platforms);
});

module.exports = mongoose.model('User', userSchema);
module.exports.PLATFORM_NAMES = PLATFORM_NAMES;
