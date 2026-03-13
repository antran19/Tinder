/**
 * Users Routes - Dating App
 * 
 * Xử lý tất cả các API endpoints liên quan đến users
 * Bao gồm: lấy danh sách users available để swipe, thông tin user
 */

const express = require('express');
const router = express.Router();
const { User, Swipe } = require('../models');

/**
 * GET /api/users/available/:userId
 * Lấy danh sách users available để swipe
 * 
 * Logic:
 * 1. Loại trừ user hiện tại
 * 2. Loại trừ users đã được swipe (cả like và pass)
 * 3. Trả về danh sách users còn lại
 * 
 * Requirements: 1.1, 1.2
 */
router.get('/available/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🔍 Lấy users available cho user: ${userId}`);

    // 1. Tìm thông tin chính user này để lấy Preferences
    const currentUser = await User.findOne({ userId });
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'Không thấy user' });
    }

    // Lấy Gu của bạn
    const genderPref = currentUser.preferences?.genderPreference || (currentUser.gender === 'male' ? 'female' : 'male');
    const minAge = currentUser.preferences?.ageRange?.min || 18;
    const maxAge = currentUser.preferences?.ageRange?.max || 99;

    // 2. Lấy danh sách userIds đã được swipe bởi user hiện tại
    const swipedUserIds = await Swipe.find({
      fromUserId: userId
    }).distinct('toUserId');

    // 3. Xây dựng bộ lọc tìm kiếm
    const excludeUserIds = [...swipedUserIds, userId];

    const currentYear = new Date().getFullYear();
    // Tính năm sinh tương ứng (Càng nhỏ tuổi thì năm sinh càng lớn)
    const latestBirthYear = currentYear - minAge;
    const earliestBirthYear = currentYear - maxAge;

    const query = {
      userId: { $nin: excludeUserIds },
      gender: genderPref,
      // Lọc theo năm sinh cho đơn giản và chính xác hơn
      $expr: {
        $and: [
          { $lte: [{ $year: "$birthday" }, latestBirthYear] },
          { $gte: [{ $year: "$birthday" }, earliestBirthYear] }
        ]
      }
    };

    const availableUsers = await User.find(query)
      .select('userId firstName birthday gender bio images isOnline createdAt interests profileDetails isVerified');

    console.log(`✅ Tìm thấy ${availableUsers.length} users cho ${userId} (Tìm ${genderPref}, Tuổi ${minAge}-${maxAge})`);

    res.json({
      success: true,
      data: {
        users: availableUsers,
        filtersApplied: { genderPref, minAge, maxAge }
      }
    });

  } catch (error) {
    console.error('❌ Lỗi lấy available users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/users/:userId
 * Lấy thông tin chi tiết của một user
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🔍 Lấy thông tin user: ${userId}`);

    const user = await User.findOne({ userId })
      .select('userId firstName birthday gender bio images isOnline createdAt preferences interests profileDetails isVerified');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }

    console.log(`✅ Tìm thấy thông tin user: ${userId}`);

    res.json({
      success: true,
      message: 'Lấy thông tin user thành công',
      data: {
        user: user
      }
    });

  } catch (error) {
    console.error('❌ Lỗi lấy thông tin user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/users
 * Lấy danh sách tất cả users (cho admin hoặc debug)
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    console.log(`🔍 Lấy danh sách tất cả users (limit: ${limit}, skip: ${skip})`);

    const users = await User.find({})
      .select('userId firstName gender isOnline createdAt')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({});

    console.log(`✅ Tìm thấy ${users.length}/${total} users`);

    res.json({
      success: true,
      message: `Lấy danh sách users thành công`,
      data: {
        users: users,
        pagination: {
          total: total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: (parseInt(skip) + users.length) < total
        }
      }
    });

  } catch (error) {
    console.error('❌ Lỗi lấy danh sách users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/users
 * Tạo user mới (cho testing hoặc registration)
 */
router.post('/', async (req, res) => {
  try {
    const userData = req.body;

    console.log(`➕ Tạo user mới:`, userData.userId || 'unknown');

    // Validate required fields
    if (!userData.userId || !userData.firstName) {
      return res.status(400).json({
        success: false,
        message: 'userId và firstName là bắt buộc'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ userId: userData.userId });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User đã tồn tại'
      });
    }

    // Create new user
    const newUser = new User(userData);
    await newUser.save();

    console.log(`✅ Tạo user thành công: ${newUser.userId}`);

    res.status(201).json({
      success: true,
      message: 'Tạo user thành công',
      data: {
        user: newUser
      }
    });

  } catch (error) {
    console.error('❌ Lỗi tạo user:', error);

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
      message: 'Lỗi server khi tạo user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/users/:userId
 * Cập nhật thông tin hồ sơ người dùng
 * (Bước đầu: Chỉ cập nhật text, chưa xử lý ảnh)
 */
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, bio, birthday, gender, preferences, interests, profileDetails, images } = req.body;

    console.log(`📝 Cập nhật hồ sơ cho user: ${userId}`);

    // 1. Kiểm tra xem user có tồn tại không
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // 2. Validate dữ liệu đầu vào đơn giản
    if (firstName && firstName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Tên phải có ít nhất 2 ký tự'
      });
    }

    if (bio && bio.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Tiểu sử không được quá 500 ký tự'
      });
    }

    // 3. Chuẩn bị dữ liệu cập nhật
    const updateData = {
      firstName: firstName || user.firstName,
      bio: bio !== undefined ? bio : user.bio,
      birthday: birthday || user.birthday,
      gender: gender || user.gender
    };

    // Cập nhật interests nếu có
    if (interests !== undefined) {
      updateData.interests = interests;
    }

    // Cập nhật profileDetails nếu có
    if (profileDetails !== undefined) {
      updateData.profileDetails = profileDetails;
    }

    // Cập nhật images nếu có
    if (images !== undefined) {
      updateData.images = images;
    }

    // Nếu có gửi preferences lên, cập nhật từng phần để không làm mất các phần khác
    if (preferences) {
      updateData.preferences = {
        ...(user.preferences ? (typeof user.preferences.toObject === 'function' ? user.preferences.toObject() : user.preferences) : {}),
        ...preferences // Ghi đè cái mới gửi lên
      };

      // Validate tuổi tối thiểu không lớn hơn tuổi tối đa
      if (updateData.preferences.ageRange.min > updateData.preferences.ageRange.max) {
        return res.status(400).json({
          success: false,
          message: 'Tuổi tối thiểu không được lớn hơn tuổi tối đa'
        });
      }
    }

    // 4. Thực hiện cập nhật
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    ).select('userId firstName birthday gender bio images isOnline preferences interests profileDetails isVerified');

    console.log(`✅ Cập nhật hồ sơ thành công cho: ${userId}`);

    res.json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('❌ Lỗi cập nhật hồ sơ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật hồ sơ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;