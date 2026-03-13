/**
 * Matches Routes - Dating App
 * 
 * Xử lý tất cả các API endpoints liên quan đến matches
 * Bao gồm: lấy danh sách matches, thông tin match chi tiết
 */

const express = require('express');
const router = express.Router();
const { User, Swipe, Match } = require('../models');

/**
 * GET /api/matches/:userId
 * Lấy danh sách matches của một user
 * 
 * Requirements: 5.2
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, skip = 0, status = 'active' } = req.query;

    console.log(`🔍 Lấy danh sách matches cho user: ${userId}`);

    // Build query - tìm matches có chứa userId
    const query = {
      participants: userId,
      status: status
    };

    // Get matches
    const matches = await Match.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    // Get user info cho mỗi match partner
    const matchesWithUserInfo = await Promise.all(
      matches.map(async (match) => {
        // Tìm user kia trong match (không phải current user)
        const otherUserId = match.participants.find(id => id !== userId);

        const otherUser = await User.findOne({ userId: otherUserId })
          .select('userId firstName birthday gender bio images isOnline');

        // Lấy thông tin swipes tạo ra match này
        const [userSwipe, otherSwipe] = await Promise.all([
          Swipe.findOne({ fromUserId: userId, toUserId: otherUserId, type: 'like' }),
          Swipe.findOne({ fromUserId: otherUserId, toUserId: userId, type: 'like' })
        ]);

        return {
          ...match.toObject(),
          otherUser: otherUser,
          swipeHistory: {
            userSwipe: userSwipe,
            otherSwipe: otherSwipe
          }
        };
      })
    );

    const total = await Match.countDocuments(query);

    console.log(`✅ Tìm thấy ${matches.length}/${total} matches`);

    res.json({
      success: true,
      message: 'Lấy danh sách matches thành công',
      data: {
        matches: matchesWithUserInfo,
        pagination: {
          total: total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: (parseInt(skip) + matches.length) < total
        },
        userId: userId
      }
    });

  } catch (error) {
    console.error('❌ Lỗi lấy danh sách matches:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách matches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/matches/detail/:matchId
 * Lấy thông tin chi tiết của một match
 */
router.get('/detail/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    console.log(`🔍 Lấy chi tiết match: ${matchId}`);

    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy match'
      });
    }

    // Get user info cho cả hai participants
    const [user1, user2] = await Promise.all([
      User.findOne({ userId: match.participants[0] })
        .select('userId firstName birthday gender bio images isOnline'),
      User.findOne({ userId: match.participants[1] })
        .select('userId firstName birthday gender bio images isOnline')
    ]);

    // Get swipe history
    const [swipe1to2, swipe2to1] = await Promise.all([
      Swipe.findOne({
        fromUserId: match.participants[0],
        toUserId: match.participants[1],
        type: 'like'
      }),
      Swipe.findOne({
        fromUserId: match.participants[1],
        toUserId: match.participants[0],
        type: 'like'
      })
    ]);

    const matchDetail = {
      ...match.toObject(),
      users: {
        user1: user1,
        user2: user2
      },
      swipeHistory: {
        user1ToUser2: swipe1to2,
        user2ToUser1: swipe2to1
      },
      timeline: {
        firstSwipe: swipe1to2?.createdAt < swipe2to1?.createdAt ? swipe1to2 : swipe2to1,
        matchCreated: match.createdAt
      }
    };

    console.log(`✅ Lấy chi tiết match thành công: ${matchId}`);

    res.json({
      success: true,
      message: 'Lấy chi tiết match thành công',
      data: {
        match: matchDetail
      }
    });

  } catch (error) {
    console.error('❌ Lỗi lấy chi tiết match:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết match',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/matches
 * Lấy tất cả matches (cho admin hoặc debug)
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 10, skip = 0, status } = req.query;

    console.log(`🔍 Lấy tất cả matches (limit: ${limit}, skip: ${skip})`);

    const query = {};
    if (status) {
      query.status = status;
    }

    const matches = await Match.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    // Get basic user info for each match
    const matchesWithUserInfo = await Promise.all(
      matches.map(async (match) => {
        const [user1, user2] = await Promise.all([
          User.findOne({ userId: match.participants[0] })
            .select('userId firstName gender'),
          User.findOne({ userId: match.participants[1] })
            .select('userId firstName gender')
        ]);

        return {
          ...match.toObject(),
          users: {
            user1: user1,
            user2: user2
          }
        };
      })
    );

    const total = await Match.countDocuments(query);

    console.log(`✅ Tìm thấy ${matches.length}/${total} matches`);

    res.json({
      success: true,
      message: 'Lấy tất cả matches thành công',
      data: {
        matches: matchesWithUserInfo,
        pagination: {
          total: total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: (parseInt(skip) + matches.length) < total
        }
      }
    });

  } catch (error) {
    console.error('❌ Lỗi lấy tất cả matches:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tất cả matches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/matches/:matchId/unmatch
 * Hủy tương hợp (Unmatch)
 */
const { emitMatchUnmatched } = require('../utils/socketUtils');

router.post('/:matchId/unmatch', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { userId, reason } = req.body;

    console.log(`💔 User ${userId} yêu cầu unmatch ${matchId}`);

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match không tồn tại' });
    }

    // Verify user participation
    if (!match.participants.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Bạn không trong cuộc hội thoại này' });
    }

    // 1. Update Match status (Soft delete)
    match.status = 'unmatched';
    match.unmatchedBy = userId;
    match.unmatchReason = reason;
    await match.save();

    // 2. Emit Socket event to both users
    emitMatchUnmatched(match.participants[0], match.participants[1], matchId);

    res.json({ success: true, message: 'Đã hủy tương hợp thành công' });

  } catch (error) {
    console.error('Lỗi unmatch:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

/**
 * PUT /api/matches/:matchId/status
 * Cập nhật status của match (active/inactive) - Admin/System usage
 */
router.put('/:matchId/status', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status, userId } = req.body;

    // ... (Giữ nguyên logic cũ nếu cần, hoặc gộp)
    // Code cũ ở dưới, nhưng endpoint ở trên cụ thể hơn cho user unmatch
    // Tôi sẽ replace endpoint cũ này bằng endpoint unmatch cụ thể ở trên cho user, 
    // còn endpoint status chung này giữ lại cho admin hoặc sử dụng limit cases

    // Existing logic...
    console.log(`🔄 Cập nhật status match: ${matchId} → ${status}`);
    // ...

    // Để đơn giản, tôi chỉ chèn thêm endpoint unmatch ở TRƯỚC endpoint update status
    // và return luôn.

    // Nhưng wait, tool replace_file_content yêu cầu thay thế một block.
    // Tôi sẽ chèn endpoint unmatch vào trước endpoint update status.

    // Logic cũ:
    if (!['active', 'inactive', 'unmatched', 'blocked'].includes(status)) { // Cập nhật enum
      return res.status(400).json({
        success: false,
        message: 'Status không hợp lệ'
      });
    }

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false });

    match.status = status;
    await match.save();

    res.json({ success: true, data: { match } });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});

/**
 * GET /api/matches/stats/global
 * Lấy thống kê matches toàn hệ thống
 */
router.get('/stats/global', async (req, res) => {
  try {
    console.log(`📊 Lấy thống kê matches toàn hệ thống`);

    const [
      totalMatches,
      activeMatches,
      inactiveMatches,
      totalUsers,
      totalSwipes,
      totalLikes
    ] = await Promise.all([
      Match.countDocuments({}),
      Match.countDocuments({ status: 'active' }),
      Match.countDocuments({ status: 'inactive' }),
      User.countDocuments({}),
      Swipe.countDocuments({}),
      Swipe.countDocuments({ type: 'like' })
    ]);

    const stats = {
      matches: {
        total: totalMatches,
        active: activeMatches,
        inactive: inactiveMatches
      },
      users: {
        total: totalUsers,
        averageMatchesPerUser: totalUsers > 0 ? (totalMatches * 2 / totalUsers).toFixed(2) : 0
      },
      swipes: {
        total: totalSwipes,
        likes: totalLikes,
        passes: totalSwipes - totalLikes,
        likeRate: totalSwipes > 0 ? ((totalLikes / totalSwipes) * 100).toFixed(1) : 0
      },
      conversion: {
        matchRate: totalLikes > 0 ? ((totalMatches / totalLikes) * 100).toFixed(1) : 0
      }
    };

    console.log(`✅ Thống kê matches:`, stats);

    res.json({
      success: true,
      message: 'Lấy thống kê matches thành công',
      data: {
        stats: stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Lỗi lấy thống kê matches:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê matches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;