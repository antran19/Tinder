const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(__dirname, '..', 'uploads');
const chatImagesDir = path.join(uploadDir, 'chat');
const profileImagesDir = path.join(uploadDir, 'profiles');

[uploadDir, chatImagesDir, profileImagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Cấu hình Multer cho Chat Images
const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, chatImagesDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `chat-${uniqueSuffix}${ext}`);
  }
});

// Cấu hình Multer cho Profile Images
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profileImagesDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

// Bộ lọc file - chỉ chấp nhận ảnh
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
};

const uploadChat = multer({
  storage: chatStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 
  fileFilter: imageFilter
});

/**
 * POST /api/upload/chat-image
 * Upload ảnh trong chat
 */
router.post('/chat-image', uploadChat.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh' });
    }

    const imageUrl = `/uploads/chat/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Lỗi upload chat image:', error);
    res.status(500).json({ success: false, message: 'Lỗi upload ảnh' });
  }
});

/**
 * POST /api/upload/profile-image
 * Upload ảnh profile (nhiều ảnh, tối đa 6)
 */
router.post('/profile-image', uploadProfile.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh' });
    }

    const { User } = require('../models');
    const { userId } = req.body;

    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    // Thêm ảnh vào mảng images của user
    if (userId) {
      const user = await User.findOne({ userId: { $regex: new RegExp(`^${userId}$`, 'i') } });
      if (user) {
        if (user.images.length >= 6) {
          return res.status(400).json({ success: false, message: 'Tối đa 6 ảnh profile' });
        }
        user.images.push(imageUrl);
        await user.save();
      }
    }

    res.json({
      success: true,
      data: {
        imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Lỗi upload profile image:', error);
    res.status(500).json({ success: false, message: 'Lỗi upload ảnh profile' });
  }
});

/**
 * DELETE /api/upload/profile-image
 * Xóa ảnh profile
 */
router.delete('/profile-image', async (req, res) => {
  try {
    const { userId, imageUrl } = req.body;
    const { User } = require('../models');

    const user = await User.findOne({ userId: { $regex: new RegExp(`^${userId}$`, 'i') } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.images = user.images.filter(img => img !== imageUrl);
    await user.save();

    // Xóa file vật lý
    const filePath = path.join(__dirname, '..', imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Đã xóa ảnh' });
  } catch (error) {
    console.error('Lỗi xóa ảnh:', error);
    res.status(500).json({ success: false, message: 'Lỗi xóa ảnh' });
  }
});

// Error handling middleware cho Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File quá lớn (tối đa 5MB cho chat, 10MB cho profile)' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  next();
});

module.exports = router;
