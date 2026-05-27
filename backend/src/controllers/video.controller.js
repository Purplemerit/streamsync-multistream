const Video = require('../models/Video.model');
const path = require('path');
const fs = require('fs');
const { notifyAdmins } = require('../services/notification.service');
const {
  deleteVideoFromCloudinary,
  deleteLocalVideoFile,
} = require('../utils/videoPath.util');

const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const { title } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: 'Video title is required' });
    }

    const cloudinaryUrl = req.file.path;
    const cloudinaryPublicId = req.file.filename;

    if (!cloudinaryUrl || !cloudinaryPublicId) {
      return res.status(500).json({ message: 'Cloudinary upload did not return a valid URL' });
    }

    const filesize = req.file.bytes ?? req.file.size ?? 0;

    const video = await Video.create({
      userId: req.user.id,
      title: title.trim(),
      filename: req.file.originalname,
      cloudinaryUrl,
      cloudinaryPublicId,
      filesize,
      mimetype: req.file.mimetype,
    });

    await notifyAdmins(
      'system',
      'New Video Uploaded',
      `A user uploaded a new video: "${title}" (${(filesize / (1024 * 1024)).toFixed(1)} MB).`
    );

    res.status(201).json({
      message: 'Video uploaded successfully',
      video,
      cloudinaryUrl,
    });
  } catch (err) {
    console.error('[video] Upload error:', err.message);
    res.status(500).json({ message: err.message || 'Video upload failed' });
  }
};

const getMyVideos = async (req, res) => {
  try {
    const videos = await Video.find({
      userId: req.user.id,
      status: { $in: ['active', 'missing'] },
    }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getVideo = async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: { $in: ['active', 'missing'] },
    });
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getPlayUrl = async (req, res) => {
  try {
    const video = req.video;

    if (video.status === 'missing') {
      return res.status(404).json({ message: 'Video file is missing' });
    }

    if (video.cloudinaryUrl) {
      return res.json({ url: video.cloudinaryUrl });
    }

    if (video.filepath && fs.existsSync(video.filepath)) {
      const base = process.env.SERVER_URL || 'http://localhost:5000';
      const token = req.query.token || req.authToken;
      const localStreamUrl = `${base}/api/videos/play/${video._id}/stream?token=${encodeURIComponent(token)}`;
      return res.json({ url: localStreamUrl });
    }

    return res.status(404).json({ message: 'Video file not found' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const streamLocalVideo = async (req, res) => {
  try {
    const video = req.video;

    if (video.cloudinaryUrl) {
      return res.redirect(video.cloudinaryUrl);
    }

    const filePath = video.filepath;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.mov' ? 'video/quicktime' : 'video/mp4';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!video) return res.status(404).json({ message: 'Video not found' });

    if (video.cloudinaryPublicId) {
      try {
        await deleteVideoFromCloudinary(video);
      } catch {
        return res.status(500).json({ message: 'Failed to delete video from Cloudinary' });
      }
    } else {
      deleteLocalVideoFile(video);
    }

    video.status = 'deleted';
    await video.save();

    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  uploadVideo,
  getMyVideos,
  getVideo,
  getPlayUrl,
  streamLocalVideo,
  deleteVideo,
};
