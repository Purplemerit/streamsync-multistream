const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { cloudinary } = require('../config/cloudinary.config');

const TEMP_DIR = path.join(__dirname, '../../uploads/temp');

const ensureTempDir = () => {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
};

const cleanupTempVideo = (tempPath) => {
  if (!tempPath) return;
  try {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  } catch (err) {
    console.error('[video] Failed to delete temp file:', err.message);
  }
};

const downloadCloudinaryVideo = async (url, destPath) => {
  const response = await axios({
    method: 'GET',
    url,
    responseType: 'stream',
    timeout: 0,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
    response.data.on('error', reject);
  });
};

/**
 * Resolve a local filesystem path for FFmpeg (download Cloudinary videos to temp).
 */
const resolveVideoPathForFfmpeg = async (video, sessionId) => {
  if (video.status === 'missing') {
    throw new Error('Video file is missing');
  }

  if (video.cloudinaryUrl) {
    ensureTempDir();
    const tempPath = path.join(TEMP_DIR, `${sessionId}.mp4`);
    console.log(`[stream] Downloading Cloudinary video for session ${sessionId}...`);
    await downloadCloudinaryVideo(video.cloudinaryUrl, tempPath);
    console.log(`[stream] Temp video ready: ${tempPath}`);
    return { path: tempPath, isTemp: true };
  }

  if (video.filepath && fs.existsSync(video.filepath)) {
    return { path: video.filepath, isTemp: false };
  }

  throw new Error('Video file not available');
};

const deleteVideoFromCloudinary = async (video) => {
  if (!video.cloudinaryPublicId) return;
  try {
    await cloudinary.uploader.destroy(video.cloudinaryPublicId, {
      resource_type: 'video',
    });
  } catch (err) {
    console.error('[video] Cloudinary delete failed:', err.message);
    throw err;
  }
};

const deleteLocalVideoFile = (video) => {
  if (!video.filepath || video.filepath.startsWith('http')) return;
  if (fs.existsSync(video.filepath)) {
    fs.unlinkSync(video.filepath);
  }
};

module.exports = {
  TEMP_DIR,
  ensureTempDir,
  cleanupTempVideo,
  resolveVideoPathForFfmpeg,
  deleteVideoFromCloudinary,
  deleteLocalVideoFile,
};
