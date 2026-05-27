const nodeCrypto = require('crypto');

// MongoDB driver uses Web Crypto API (getRandomValues) during SCRAM auth.
globalThis.crypto = nodeCrypto.webcrypto ?? {
  getRandomValues: (array) => nodeCrypto.randomFillSync(array),
};

const { randomUUID } = nodeCrypto;
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Do NOT require Mongoose models here — their schema defaults run on connect
// and previously caused "crypto is not defined" during model.init().

const PLATFORM_NAMES = [
  'youtube', 'twitch', 'facebook', 'kick', 'rumble',
  'telegram', 'x', 'instagram', 'tiktok', 'bigo',
];

const isOldPlatformFormat = (value) => {
  return value != null && typeof value === 'object' && !Array.isArray(value);
};

const hasPlatformData = (value) => {
  return !!(value?.streamKey || value?.rtmpUrl || value?.accessToken || value?.refreshToken);
};

const migrateUserPlatforms = async (usersCollection) => {
  console.log('\n--- Migrating User.platforms (object → array) ---');

  const users = await usersCollection.find({}).toArray();
  console.log(`Found ${users.length} user(s) to inspect.`);

  let usersUpdated = 0;
  let platformsConverted = 0;
  let accountsBackfilled = 0;

  for (const user of users) {
    const platforms = user.platforms || {};
    const updates = {};
    let userModified = false;

    for (const platform of PLATFORM_NAMES) {
      const value = platforms[platform];

      if (value == null) continue;

      if (Array.isArray(value)) {
        let arrayModified = false;
        const fixed = value.map((account, index) => {
          if (!account.accountId) {
            arrayModified = true;
            accountsBackfilled++;
            return {
              ...account,
              accountId: randomUUID(),
              label: account.label || `Account ${index + 1}`,
            };
          }
          return account;
        });

        if (arrayModified) {
          updates[`platforms.${platform}`] = fixed;
          userModified = true;
        }
        continue;
      }

      if (isOldPlatformFormat(value)) {
        if (hasPlatformData(value)) {
          updates[`platforms.${platform}`] = [{
            accountId: randomUUID(),
            label: 'Account 1',
            streamKey: value.streamKey || undefined,
            rtmpUrl: value.rtmpUrl || undefined,
            connectedAt: value.connectedAt || new Date(),
          }];
          console.log(`  [${user.email}] ${platform}: converted object → 1 account`);
        } else {
          updates[`platforms.${platform}`] = [];
          console.log(`  [${user.email}] ${platform}: converted empty object → []`);
        }
        platformsConverted++;
        userModified = true;
      }
    }

    if (userModified) {
      try {
        await usersCollection.updateOne({ _id: user._id }, { $set: updates });
        usersUpdated++;
      } catch (err) {
        console.error(`  ERROR updating user ${user.email} (${user._id}):`, err.message);
      }
    }
  }

  console.log(`Users updated: ${usersUpdated}`);
  console.log(`Platform fields converted (object → array): ${platformsConverted}`);
  console.log(`Array accounts backfilled with accountId: ${accountsBackfilled}`);
};

const migratePlatformAuth = async (platformAuthsCollection) => {
  console.log('\n--- Backfilling PlatformAuth.accountId ---');

  const auths = await platformAuthsCollection.find({}).toArray();
  console.log(`Found ${auths.length} PlatformAuth document(s) to inspect.`);

  let backfilled = 0;

  for (const auth of auths) {
    if (auth.accountId) continue;

    const accountId = randomUUID();
    try {
      await platformAuthsCollection.updateOne(
        { _id: auth._id },
        { $set: { accountId } }
      );
      backfilled++;
      console.log(`  Backfilled accountId for user ${auth.user} / ${auth.platform}`);
    } catch (err) {
      console.error(`  ERROR backfilling PlatformAuth ${auth._id}:`, err.message);
    }
  }

  console.log(`PlatformAuth documents backfilled: ${backfilled}`);
};

const migrateIndexes = async (platformAuthsCollection) => {
  console.log('\n--- Migrating PlatformAuth indexes ---');

  const indexes = await platformAuthsCollection.indexes();

  const oldIndex = indexes.find(
    (idx) => idx.key?.user === 1 && idx.key?.platform === 1 && !idx.key?.accountId
  );

  if (oldIndex) {
    try {
      await platformAuthsCollection.dropIndex(oldIndex.name);
      console.log(`Dropped old index: ${oldIndex.name}`);
    } catch (err) {
      console.error(`ERROR dropping index ${oldIndex.name}:`, err.message);
    }
  } else {
    console.log('Old user+platform unique index not found (already dropped or never existed).');
  }

  const newIndexExists = indexes.some(
    (idx) => idx.key?.user === 1 && idx.key?.platform === 1 && idx.key?.accountId === 1
  );

  if (!newIndexExists) {
    try {
      await platformAuthsCollection.createIndex(
        { user: 1, platform: 1, accountId: 1 },
        { unique: true, name: 'user_1_platform_1_accountId_1' }
      );
      console.log('Created index: user_1_platform_1_accountId_1 (unique).');
    } catch (err) {
      console.error('ERROR creating new PlatformAuth index:', err.message);
    }
  } else {
    console.log('New user+platform+accountId unique index already exists.');
  }
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error('ERROR: MONGO_URI is not set in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const platformAuthsCollection = db.collection('platformauths');

    await migrateUserPlatforms(usersCollection);
    await migratePlatformAuth(platformAuthsCollection);
    await migrateIndexes(platformAuthsCollection);

    const liveStatsCollection = db.collection('livestats');
    const twitterAuth = await platformAuthsCollection.updateMany(
      { platform: 'twitter' },
      { $set: { platform: 'x' } }
    );
    const twitterStats = await liveStatsCollection.updateMany(
      { platform: 'twitter' },
      { $set: { platform: 'x' } }
    );
    if (twitterAuth.modifiedCount || twitterStats.modifiedCount) {
      console.log(`\nRenamed twitter → x: ${twitterAuth.modifiedCount} auth(s), ${twitterStats.modifiedCount} stat(s).`);
    }

    console.log('\n✅ Migration completed successfully.');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

run();
