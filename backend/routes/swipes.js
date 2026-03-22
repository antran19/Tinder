/**
 * Swipes Routes - Dating App
 * 
 * Xử lý tất cả các API endpoints liên quan đến swipe actions
 * Bao gồm: tạo swipe mới, lấy lịch sử swipes, xử lý match logic
 */

const express = require('express');
const router = express.Router();
const { User, Swipe, Match, Notification } = require('../models');
const { emitMatchNotification } = require('../utils/socketUtils');

/**
 * POST /api/swipes
 * Tạo swipe action mới (like hoặc pass)
 * 
 * Logic:
 * 1. Lưu swipe action vào database
 * 2. Nếu là "like", check xem có mutual like không
 * 3. Nếu có mutual like, tạo match
 * 4. Trả về kết quả (có match hay không)
 * 
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.3
 */
router.post('/', async (req, res) => {
  try {
    const { fromUserId, toUserId, type } = req.body;

    console.log(`💫 Swipe action: ${fromUserId} → ${toUserId} (${type})`);

    // Validate input
    if (!fromUserId || !toUserId || !type) {
      return res.status(400).json({
        success: false,
        message: 'fromUserId, toUserId và type là bắt buộc'
      });
    }

    if (!['like', 'pass', 'super_like'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'type phải là "like", "pass" hoặc "super_like"'
      });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({
        success: false,
        message: 'Không thể swipe chính mình'
      });
    }

    // SUPER LIKE: Kiểm tra credits TRƯỚC KHI kiểm tra existing swipe
    if (type === 'super_like') {
      const fromUser = await User.findOne({ userId: fromUserId });

      if (!fromUser) {
        return res.status(404).json({ success: false, message: 'User không tồn tại' });
      }

      const isPremium = fromUser.subscription?.tier === 'premium' || fromUser.subscription?.tier === 'gold';

      if (!isPremium && fromUser.credits.superLikes <= 0) {
        return res.status(403).json({
          success: false,
          message: 'Bạn đã hết Super Like. Nâng cấp lên Premium để không giới hạn!',
          needUpgrade: true
        });
      }

      // Trừ credit nếu là Free user
      if (!isPremium) {
        fromUser.credits.superLikes -= 1;
        await fromUser.save();
        console.log(`💫 User ${fromUserId} used Super Like. Remaining: ${fromUser.credits.superLikes}`);
      }
    }

    // Check if swipe already exists
    const existingSwipe = await Swipe.findOne({
      fromUserId: fromUserId,
      toUserId: toUserId
    });

    if (existingSwipe) {
      return res.status(409).json({
        success: false,
        message: 'Đã swipe user này rồi',
        data: {
          existingSwipe: existingSwipe
        }
      });
    }

    // Verify both users exist
    const [fromUser, toUser] = await Promise.all([
      User.findOne({ userId: fromUserId }),
      User.findOne({ userId: toUserId })
    ]);

    if (!fromUser || !toUser) {
      return res.status(404).json({
        success: false,
        message: 'Một hoặc cả hai user không tồn tại'
      });
    }

    // 1. Lưu swipe action
    const swipe = new Swipe({
      fromUserId,
      toUserId,
      type,
      createdAt: new Date()
    });

    await swipe.save();
    console.log(`✅ Lưu swipe thành công: ${swipe._id}`);

    let matchResult = { match: false };

    // 2. Nếu là "like", check mutual like và tạo match
    if (type === 'like' || type === 'super_like') {
      // Gửi notification "Ai đó đã thích bạn" realtime
      if (global.io) {
        global.io.to(toUserId.toLowerCase()).emit('new-like', {
          fromUserId,
          fromUserName: fromUser.firstName,
          fromUserImage: fromUser.images?.[0] || '',
          type,
          message: type === 'super_like' 
            ? `⭐ ${fromUser.firstName} đã Super Like bạn!` 
            : `💕 ${fromUser.firstName} đã thích bạn!`,
          createdAt: new Date()
        });
        console.log(`💕 Sent new-like notification to ${toUserId}`);
      }

      console.log(`💕 Checking mutual like: ${toUserId} → ${fromUserId}`);

      const mutualLike = await Swipe.findOne({
        fromUserId: toUserId,
        toUserId: fromUserId,
        type: { $in: ['like', 'super_like'] }
      });

      if (mutualLike) {
        console.log(`🎉 Mutual like detected! Creating match...`);

        // Check if match already exists (safety check)
        const existingMatch = await Match.findOne({
          participants: { $all: [fromUserId, toUserId] }
        });

        if (!existingMatch) {
          // 3. Tạo match mới
          const match = new Match({
            participants: [fromUserId, toUserId],
            status: 'active',
            createdAt: new Date()
          });

          await match.save();
          console.log(`✅ Match created: ${match._id}`);

          matchResult = {
            match: true,
            matchData: match,
            mutualSwipe: mutualLike
          };

          // 4. Tạo Notifications cho cả 2 users
          const notificationForFromUser = new Notification({
            recipientId: fromUserId,
            senderId: toUserId,
            type: 'new_match',
            title: 'Tương hợp mới! 🎉',
            content: `Bạn vừa tương hợp với ${toUserId}`, // Có thể thay bằng tên thật
            entityId: match._id
          });

          const notificationForToUser = new Notification({
            recipientId: toUserId,
            senderId: fromUserId,
            type: 'new_match',
            title: 'Tương hợp mới! 🎉',
            content: `Bạn vừa tương hợp với ${fromUserId}`,
            entityId: match._id
          });

          await Promise.all([
            notificationForFromUser.save(),
            notificationForToUser.save()
          ]);

          // Emit real-time match notification cho cả hai users
          console.log(`📢 Emitting match notification to both users...`);
          emitMatchNotification(match);

        } else {
          console.log(`⚠️  Match already exists: ${existingMatch._id}`);
          matchResult = {
            match: true,
            matchData: existingMatch,
            mutualSwipe: mutualLike,
            note: 'Match đã tồn tại'
          };
        }
      } else {
        console.log(`💔 No mutual like yet`);
      }
    }

    // Trả về kết quả
    res.status(201).json({
      success: true,
      message: `Swipe ${type} thành công${matchResult.match ? ' - It\'s a Match!' : ''}`,
      data: {
        swipe: swipe,
        ...matchResult
      }
    });

  } catch (error) {
    console.error('❌ Lỗi tạo swipe:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo swipe',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/swipes/:userId
 * Lấy lịch sử swipes của một user
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, limit = 20, skip = 0 } = req.query;

    console.log(`🔍 Lấy lịch sử swipes cho user: ${userId}`);

    // Build query
    const query = { fromUserId: userId };
    if (type && ['like', 'pass'].includes(type)) {
      query.type = type;
    }

    // Get swipes with user info
    const swipes = await Swipe.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    // Get user info for each swiped user
    const swipesWithUserInfo = await Promise.all(
      swipes.map(async (swipe) => {
        const toUser = await User.findOne({ userId: swipe.toUserId })
          .select('userId firstName gender images');

        return {
          ...swipe.toObject(),
          toUserInfo: toUser
        };
      })
    );

    const total = await Swipe.countDocuments(query);

    console.log(`✅ Tìm thấy ${swipes.length}/${total} swipes`);

    res.json({
      success: true,
      message: 'Lấy lịch sử swipes thành công',
      data: {
        swipes: swipesWithUserInfo,
        pagination: {
          total: total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: (parseInt(skip) + swipes.length) < total
        },
        stats: {
          likes: await Swipe.countDocuments({ fromUserId: userId, type: 'like' }),
          passes: await Swipe.countDocuments({ fromUserId: userId, type: 'pass' })
        }
      }
    });

  } catch (error) {
    console.error('❌ Lỗi lấy lịch sử swipes:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch sử swipes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/swipes/stats/:userId
 * Lấy thống kê swipes của user
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`📊 Lấy thống kê swipes cho user: ${userId}`);

    const [
      totalSwipes,
      totalLikes,
      totalPasses,
      receivedLikes,
      mutualLikes
    ] = await Promise.all([
      Swipe.countDocuments({ fromUserId: userId }),
      Swipe.countDocuments({ fromUserId: userId, type: 'like' }),
      Swipe.countDocuments({ fromUserId: userId, type: 'pass' }),
      Swipe.countDocuments({ toUserId: userId, type: 'like' }),
      Match.countDocuments({ participants: userId })
    ]);

    const stats = {
      sent: {
        total: totalSwipes,
        likes: totalLikes,
        passes: totalPasses,
        likeRate: totalSwipes > 0 ? ((totalLikes / totalSwipes) * 100).toFixed(1) : 0
      },
      received: {
        likes: receivedLikes
      },
      matches: {
        total: mutualLikes,
        matchRate: totalLikes > 0 ? ((mutualLikes / totalLikes) * 100).toFixed(1) : 0
      }
    };

    console.log(`✅ Thống kê swipes:`, stats);

    res.json({
      success: true,
      message: 'Lấy thống kê swipes thành công',
      data: {
        userId: userId,
        stats: stats
      }
    });

  } catch (error) {
    console.error('❌ Lỗi lấy thống kê swipes:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê swipes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;