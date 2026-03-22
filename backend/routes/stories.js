/**
 * Stories Routes - Khoảnh khắc 24h
 * Upload, xem, like, delete stories
 */

const express = require('express');
const router = express.Router();
const { Story, User } = require('../models');

/**
 * GET /api/stories
 * Lấy stories của tất cả users (chưa hết hạn)
 * Trả về theo nhóm user, sắp xếp mới nhất
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    // Lấy tất cả stories chưa hết hạn
    const stories = await Story.find({
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    // Group stories by userId
    const storyMap = {};
    for (const story of stories) {
      if (!storyMap[story.userId]) {
        storyMap[story.userId] = [];
      }
      storyMap[story.userId].push({
        ...story.toObject(),
        isViewed: userId ? story.viewers.some(v => v.userId === userId) : false,
        viewCount: story.viewers.length,
        likeCount: story.likes.length,
        isLiked: userId ? story.likes.some(l => l.userId === userId) : false,
      });
    }

    // Lấy thông tin user cho mỗi story group
    const userIds = Object.keys(storyMap);
    const users = await User.find({ userId: { $in: userIds } })
      .select('userId firstName images isVerified');

    const userMap = {};
    for (const u of users) {
      userMap[u.userId] = u;
    }

    // Build response: sắp xếp stories chưa xem lên trước
    const storyGroups = userIds.map(uid => ({
      user: userMap[uid] || { userId: uid, firstName: uid },
      stories: storyMap[uid],
      hasUnviewed: storyMap[uid].some(s => !s.isViewed),
      latestAt: storyMap[uid][0]?.createdAt
    })).sort((a, b) => {
      // Chưa xem trước
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      // Mới nhất trước
      return new Date(b.latestAt) - new Date(a.latestAt);
    });

    // Tách stories của user hiện tại ra đầu
    const myStories = storyGroups.find(g => g.user.userId === userId);
    const otherStories = storyGroups.filter(g => g.user.userId !== userId);

    res.json({
      success: true,
      data: {
        myStories: myStories || null,
        stories: otherStories
      }
    });
  } catch (error) {
    console.error('❌ Stories error:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy stories' });
  }
});

/**
 * POST /api/stories
 * Tạo story mới
 */
router.post('/', async (req, res) => {
  try {
    const { userId, mediaUrl, mediaType = 'image', caption = '' } = req.body;

    if (!userId || !mediaUrl) {
      return res.status(400).json({ success: false, message: 'Cần userId và mediaUrl' });
    }

    // Giới hạn 10 stories/ngày
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Story.countDocuments({
      userId,
      createdAt: { $gte: today }
    });

    if (todayCount >= 10) {
      return res.status(429).json({ success: false, message: 'Bạn đã đăng tối đa 10 stories/ngày' });
    }

    const story = new Story({
      userId,
      mediaUrl,
      mediaType,
      caption,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await story.save();

    console.log(`📸 Story created by ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Đã đăng story!',
      data: { story }
    });
  } catch (error) {
    console.error('❌ Create story error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tạo story' });
  }
});

/**
 * PUT /api/stories/:storyId/view
 * Đánh dấu đã xem story
 */
router.put('/:storyId/view', async (req, res) => {
  try {
    const { storyId } = req.params;
    const { userId } = req.body;

    await Story.updateOne(
      { _id: storyId, 'viewers.userId': { $ne: userId } },
      { $push: { viewers: { userId, viewedAt: new Date() } } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi đánh dấu xem' });
  }
});

/**
 * PUT /api/stories/:storyId/like
 * Like/Unlike story
 */
router.put('/:storyId/like', async (req, res) => {
  try {
    const { storyId } = req.params;
    const { userId } = req.body;

    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ success: false, message: 'Story không tồn tại' });

    const existingLike = story.likes.find(l => l.userId === userId);
    if (existingLike) {
      // Unlike
      story.likes = story.likes.filter(l => l.userId !== userId);
    } else {
      // Like
      story.likes.push({ userId, likedAt: new Date() });
    }

    await story.save();

    res.json({
      success: true,
      data: { isLiked: !existingLike, likeCount: story.likes.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi like story' });
  }
});

/**
 * DELETE /api/stories/:storyId
 * Xóa story (chỉ chủ sở hữu)
 */
router.delete('/:storyId', async (req, res) => {
  try {
    const { storyId } = req.params;
    const { userId } = req.query;

    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ success: false, message: 'Story không tồn tại' });

    if (story.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa story này' });
    }

    await Story.deleteOne({ _id: storyId });

    res.json({ success: true, message: 'Đã xóa story' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa story' });
  }
});

module.exports = router;
