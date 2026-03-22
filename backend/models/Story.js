const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  mediaUrl: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  caption: {
    type: String,
    default: '',
    maxlength: 200
  },
  viewers: [{
    userId: String,
    viewedAt: { type: Date, default: Date.now }
  }],
  likes: [{
    userId: String,
    likedAt: { type: Date, default: Date.now }
  }],
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 giờ
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-delete expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', storySchema);
