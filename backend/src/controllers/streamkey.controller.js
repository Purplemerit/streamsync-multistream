const { randomUUID } = require('crypto');
const User = require('../models/User.model');

const VALID_PLATFORMS = [
  'youtube', 'twitch', 'facebook', 'kick', 'rumble',
  'telegram', 'x', 'instagram', 'tiktok', 'bigo',
];

const MAX_ACCOUNTS_PER_PLATFORM = 15;

const saveAccount = async (req, res) => {
  try {
    const { platform, streamKey, rtmpUrl, label, twitchUsername } = req.body;

    if (!VALID_PLATFORMS.includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    if (!streamKey || streamKey.trim() === '') {
      return res.status(400).json({ message: 'Stream key cannot be empty' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!Array.isArray(user.platforms[platform])) {
      user.platforms[platform] = [];
    }

    const accounts = user.platforms[platform];

    if (accounts.length >= MAX_ACCOUNTS_PER_PLATFORM) {
      return res.status(400).json({
        message: `Maximum ${MAX_ACCOUNTS_PER_PLATFORM} accounts allowed per platform`,
      });
    }

    const accountNumber = accounts.length + 1;
    const newAccount = {
      accountId: randomUUID(),
      label: label?.trim() || `Account ${accountNumber}`,
      streamKey: streamKey.trim(),
      rtmpUrl: rtmpUrl?.trim() || undefined,
      connectedAt: new Date(),
    };

    accounts.push(newAccount);
    user.markModified(`platforms.${platform}`);

    if (platform === 'twitch' && twitchUsername?.trim()) {
      user.twitchUsername = twitchUsername.toLowerCase().trim();
    }

    await user.save();

    res.status(201).json({
      message: `${platform} account saved successfully`,
      account: newAccount,
    });
  } catch (err) {
    console.error('Error saving account:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getMyAccounts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('platforms');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const result = {};
    VALID_PLATFORMS.forEach((platform) => {
      result[platform] = Array.isArray(user.platforms[platform])
        ? user.platforms[platform]
        : [];
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { platform, accountId } = req.params;

    if (!VALID_PLATFORMS.includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const accounts = user.platforms[platform];
    if (!Array.isArray(accounts)) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const index = accounts.findIndex((a) => a.accountId === accountId);
    if (index === -1) {
      return res.status(404).json({ message: 'Account not found' });
    }

    accounts.splice(index, 1);
    user.markModified(`platforms.${platform}`);
    await user.save();

    res.json({ message: `${platform} account removed` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateAccount = async (req, res) => {
  try {
    const { platform, accountId } = req.params;
    const { label, streamKey, rtmpUrl, twitchUsername } = req.body;

    if (!VALID_PLATFORMS.includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    if (label === undefined && streamKey === undefined && rtmpUrl === undefined && twitchUsername === undefined) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const accounts = user.platforms[platform];
    if (!Array.isArray(accounts)) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const account = accounts.find((a) => a.accountId === accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (label !== undefined) {
      account.label = label.trim() || account.label;
    }
    if (streamKey !== undefined) {
      if (!streamKey.trim()) {
        return res.status(400).json({ message: 'Stream key cannot be empty' });
      }
      account.streamKey = streamKey.trim();
    }
    if (rtmpUrl !== undefined) {
      account.rtmpUrl = rtmpUrl.trim() || undefined;
    }

    user.markModified(`platforms.${platform}`);

    if (platform === 'twitch' && twitchUsername?.trim()) {
      user.twitchUsername = twitchUsername.toLowerCase().trim();
    }

    await user.save();

    res.json({
      message: `${platform} account updated successfully`,
      account,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  saveAccount,
  getMyAccounts,
  deleteAccount,
  updateAccount,
  VALID_PLATFORMS,
};
