const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
  },
  filepath: {
    type: String,
  },
  cloudinaryUrl: {
    type: String,
  },
  cloudinaryPublicId: {
    type: String,
  },
  filesize: {
    type: Number,
    required: true,
  },
  mimetype: {
    type: String,
  },
  duration: {
    type: String,
    default: 'Unknown',
  },
  status: {
    type: String,
    enum: ['active', 'deleted', 'missing'],
    default: 'active',
  },
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
