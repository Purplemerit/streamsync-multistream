/** Unique key for a stream destination (one saved account). */
const accountOutputKey = (platform) =>
  `${platform.name}:${platform.accountId || 'default'}`;

const RTMPS_PLATFORMS = new Set(['kick', 'instagram', 'facebook']);

module.exports = { accountOutputKey, RTMPS_PLATFORMS };
