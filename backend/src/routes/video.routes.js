const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Video = require('../models/Video.model');
const {
  uploadVideo,
  getMyVideos,
  getVideo,
  getPlayUrl,
  streamLocalVideo,
  deleteVideo,
} = require('../controllers/video.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

const authorizeVideoAccess = async (req, res, next) => {
  try {
    let token = req.query.token;
    if (!token && req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    const video = await Video.findOne({
      _id: req.params.id,
      status: { $in: ['active', 'missing'] },
    });
    if (!video) return res.status(404).json({ message: 'Video not found' });

    if (user.role !== 'admin' && video.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    req.video = video;
    req.authToken = token;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Not authorized', error: err.message });
  }
};

router.get('/play/:id', authorizeVideoAccess, getPlayUrl);
router.get('/play/:id/stream', authorizeVideoAccess, streamLocalVideo);

router.use(protect);

router.post('/upload', (req, res, next) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      const message = err.message || 'Video upload failed';
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ message });
    }
    next();
  });
}, uploadVideo);

router.get('/my', getMyVideos);
router.delete('/:id', deleteVideo);
router.get('/:id', getVideo);

module.exports = router;
