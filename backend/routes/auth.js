/**
 * Auth Routes - Dating App
 * File này xử lý việc Đăng nhập và Xác thực người dùng
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Bí mật để mã hóa Token (lấy từ file .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

/**
 * POST /api/auth/login
 * API xử lý đăng nhập
 */
router.post('/login', async (req, res) => {
    try {
        const { userId } = req.body;

        // 1. Kiểm tra xem người dùng có nhập userId không
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập Username/ID'
            });
        }

        // 2. Tìm người dùng trong Database
        const user = await User.findOne({ userId });

        // 3. Nếu không thấy, trả về lỗi
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // 4. Tạo "Tấm vé" (Token) có thời hạn 7 ngày
        // Token này sẽ chứa ID của người dùng
        const token = jwt.sign(
            { userId: user.userId, id: user._id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 5. Trả về thông tin người dùng và Token cho Frontend
        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                token,
                user: {
                    userId: user.userId,
                    firstName: user.firstName,
                    gender: user.gender,
                    images: user.images
                }
            }
        });

    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập'
        });
    }
});

module.exports = router;
