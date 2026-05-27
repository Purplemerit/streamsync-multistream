const nodeCrypto = require('crypto');

globalThis.crypto = nodeCrypto.webcrypto ?? {
  getRandomValues: (array) => nodeCrypto.randomFillSync(array),
};

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { cloudinary } = require('../config/cloudinary.config');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Video = require('../models/Video.model');

const uploadLocalToCloudinary = (filePath) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder: 'streamsync/videos',
        resource_type: 'video',
        transformation: [{ quality: 'auto' }],
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });

const run = async () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('Missing CLOUDINARY_* env vars. Set them in backend/.env first.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.\n');

  const videos = await Video.find({
    $or: [
      { cloudinaryUrl: { $exists: false } },
      { cloudinaryUrl: null },
      { cloudinaryUrl: '' },
    ],
    status: { $ne: 'deleted' },
  });

  console.log(`Found ${videos.length} video(s) without Cloudinary URL.\n`);

  let uploaded = 0;
  let missing = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const label = `"${video.title}" (${video._id})`;
    console.log(`[${i + 1}/${videos.length}] ${label}`);

    if (video.cloudinaryUrl) {
      console.log('  → Already on Cloudinary, skip.');
      skipped++;
      continue;
    }

    const localPath = video.filepath;
    if (!localPath || !fs.existsSync(localPath)) {
      console.log('  → Local file not found, marking as missing.');
      video.status = 'missing';
      await video.save();
      missing++;
      continue;
    }

    try {
      console.log(`  → Uploading ${localPath}...`);
      const result = await uploadLocalToCloudinary(localPath);
      video.cloudinaryUrl = result.secure_url;
      video.cloudinaryPublicId = result.public_id;
      video.status = 'active';
      await video.save();
      console.log(`  → Done: ${result.secure_url}`);
      uploaded++;
    } catch (err) {
      console.error(`  → Upload failed: ${err.message}`);
      failed++;
    }
  }

  console.log('\n--- Migration complete ---');
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Missing:  ${missing}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Failed:   ${failed}`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
