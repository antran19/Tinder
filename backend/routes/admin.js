/**
 * Admin Dashboard Routes
 * Quản trị hệ thống: users, doanh thu, thanh toán, thống kê
 */

const express = require('express');
const router = express.Router();
const { User, Swipe, Match, Message } = require('../models');

// Middleware kiểm tra quyền admin
const requireAdmin = async (req, res, next) => {
  try {
    const adminId = req.headers['x-admin-id'] || req.query.adminId;
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Cần đăng nhập admin' });
    }

    const admin = await User.findOne({ userId: adminId });
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Không có quyền admin' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xác thực admin' });
  }
};

/**
 * GET /api/admin/stats
 * Thống kê tổng quan dashboard
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Tổng user
    const totalUsers = await User.countDocuments({});
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: thisMonth } });
    const newUsersLastMonth = await User.countDocuments({
      createdAt: { $gte: lastMonth, $lt: thisMonth }
    });

    // User online
    const onlineUsers = await User.countDocuments({ isOnline: true });

    // Premium users
    const premiumUsers = await User.countDocuments({
      'subscription.tier': { $in: ['premium', 'gold'] },
      'subscription.endDate': { $gt: now }
    });

    // Gender breakdown
    const maleUsers = await User.countDocuments({ gender: 'male' });
    const femaleUsers = await User.countDocuments({ gender: 'female' });

    // Matches & Swipes
    const totalMatches = await Match.countDocuments({});
    const matchesToday = await Match.countDocuments({ createdAt: { $gte: today } });
    const totalSwipes = await Swipe.countDocuments({});
    const swipesToday = await Swipe.countDocuments({ createdAt: { $gte: today } });
    const likesToday = await Swipe.countDocuments({ type: 'like', createdAt: { $gte: today } });
    const passesToday = await Swipe.countDocuments({ type: 'pass', createdAt: { $gte: today } });

    // Messages
    const totalMessages = await Message.countDocuments({});
    const messagesToday = await Message.countDocuments({ createdAt: { $gte: today } });

    // Tỉ lệ chuyển đổi Premium
    const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0;

    // Growth rate
    const userGrowthRate = newUsersLastMonth > 0
      ? (((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100).toFixed(1)
      : 100;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          newUsersToday,
          newUsersThisMonth,
          onlineUsers,
          premiumUsers,
          conversionRate: parseFloat(conversionRate),
          userGrowthRate: parseFloat(userGrowthRate)
        },
        gender: { male: maleUsers, female: femaleUsers },
        engagement: {
          totalMatches,
          matchesToday,
          totalSwipes,
          swipesToday,
          likesToday,
          passesToday,
          likeRate: swipesToday > 0 ? ((likesToday / swipesToday) * 100).toFixed(1) : 0,
          totalMessages,
          messagesToday
        }
      }
    });
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy thống kê' });
  }
});

/**
 * GET /api/admin/users
 * Danh sách users với search, filter, pagination
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      gender = '',
      tier = '',
      sort = '-createdAt',
      online = ''
    } = req.query;

    const query = {};

    // Search
    if (search) {
      query.$or = [
        { userId: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (gender) query.gender = gender;
    if (online === 'true') query.isOnline = true;
    if (tier === 'premium') query['subscription.tier'] = { $in: ['premium', 'gold'] };
    if (tier === 'free') {
      query.$or = [
        { 'subscription.tier': 'free' },
        { 'subscription.tier': { $exists: false } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('userId firstName gender birthday isOnline isVerified role subscription images createdAt location')
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('❌ Admin users error:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách users' });
  }
});

/**
 * PUT /api/admin/users/:userId/role
 * Thay đổi role của user (user -> admin, admin -> user)
 */
router.put('/users/:userId/role', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role không hợp lệ' });
    }

    const user = await User.findOneAndUpdate(
      { userId },
      { $set: { role } },
      { new: true }
    ).select('userId firstName role');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật role' });
  }
});

/**
 * PUT /api/admin/users/:userId/verify
 * Xác minh tài khoản user
 */
router.put('/users/:userId/verify', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;

    const user = await User.findOneAndUpdate(
      { userId },
      { $set: { isVerified: isVerified !== false } },
      { new: true }
    ).select('userId firstName isVerified');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xác minh user' });
  }
});

/**
 * PUT /api/admin/users/:userId/subscription
 * Admin cấp/thay đổi subscription cho user
 */
router.put('/users/:userId/subscription', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { tier, days = 30 } = req.body;

    if (!['free', 'premium', 'gold'].includes(tier)) {
      return res.status(400).json({ success: false, message: 'Tier không hợp lệ' });
    }

    const endDate = tier === 'free' ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const user = await User.findOneAndUpdate(
      { userId },
      {
        $set: {
          'subscription.tier': tier,
          'subscription.startDate': tier !== 'free' ? new Date() : null,
          'subscription.endDate': endDate
        }
      },
      { new: true }
    ).select('userId firstName subscription');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật subscription' });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Xóa user (ban)
 */
router.delete('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Không cho xóa chính mình
    if (userId === req.admin.userId) {
      return res.status(400).json({ success: false, message: 'Không thể xóa chính mình' });
    }

    await User.deleteOne({ userId });
    await Swipe.deleteMany({ $or: [{ fromUserId: userId }, { toUserId: userId }] });
    await Match.deleteMany({ $or: [{ userId1: userId }, { userId2: userId }] });
    await Message.deleteMany({ $or: [{ from: userId }, { to: userId }] });

    res.json({ success: true, message: `Đã xóa user ${userId} và toàn bộ dữ liệu liên quan` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa user' });
  }
});

/**
 * POST /api/admin/make-admin
 * Tạo admin mới (chỉ dùng 1 lần để tạo admin đầu tiên)
 */
router.post('/make-admin', async (req, res) => {
  try {
    const { userId, secretKey } = req.body;

    // Secret key đơn giản - thay đổi trong production
    if (secretKey !== 'tinder-admin-2026') {
      return res.status(403).json({ success: false, message: 'Secret key sai' });
    }

    const user = await User.findOneAndUpdate(
      { userId },
      { $set: { role: 'admin' } },
      { new: true }
    ).select('userId firstName role');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    console.log(`👑 Made ${userId} admin`);
    res.json({ success: true, message: `${userId} is now admin`, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tạo admin' });
  }
});

/**
 * GET /api/admin/revenue
 * Thống kê doanh thu từ subscription
 */
router.get('/revenue', requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Đếm active subscriptions
    const activePremium = await User.countDocuments({
      'subscription.tier': 'premium',
      'subscription.endDate': { $gt: now }
    });
    const activeGold = await User.countDocuments({
      'subscription.tier': 'gold',
      'subscription.endDate': { $gt: now }
    });

    // Ước tính doanh thu
    const premiumPrice = 149000;
    const goldPrice = 299000;
    const estimatedMonthlyRevenue = (activePremium * premiumPrice) + (activeGold * goldPrice);

    // Subscriptions mới tháng này
    const newSubsThisMonth = await User.countDocuments({
      'subscription.startDate': { $gte: thisMonth },
      'subscription.tier': { $in: ['premium', 'gold'] }
    });

    res.json({
      success: true,
      data: {
        activePremium,
        activeGold,
        totalActiveSubscriptions: activePremium + activeGold,
        estimatedMonthlyRevenue,
        newSubsThisMonth,
        revenue: {
          premium: activePremium * premiumPrice,
          gold: activeGold * goldPrice,
          total: estimatedMonthlyRevenue
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy thống kê doanh thu' });
  }
});

module.exports = router;
