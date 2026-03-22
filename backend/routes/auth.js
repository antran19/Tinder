/**
 * Auth Routes - Dating App
 * File này xử lý việc Đăng nhập và Xác thực người dùng
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const bcrypt = require('bcryptjs');

// Bí mật để mã hóa Token (lấy từ file .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới
 */
router.post('/register', async (req, res) => {
    try {
        const { userId, password, firstName, gender, birthday } = req.body;

        // 1. Validate Input
        if (!userId || !password || !firstName || !gender || !birthday) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin (ID, Mật khẩu, Tên, Giới tính, Ngày sinh)'
            });
        }

        // 2. Check Valid userId format (no spaces, only letters/numbers)
        if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Username chỉ được chứa chữ cái, số và dấu gạch dưới'
            });
        }

        // 3. Check duplicate user
        const existingUser = await User.findOne({ userId });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Tài khoản đã tồn tại'
            });
        }

        // 4. Hash Password (Băm mật khẩu)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Create User
        const newUser = new User({
            userId,
            password: hashedPassword,
            firstName,
            gender,
            birthday: new Date(birthday),
            preferences: {
                genderPreference: gender === 'male' ? 'female' : 'male'
            }
        });

        await newUser.save();

        // 6. Generate Token immediately (Auto login)
        const token = jwt.sign(
            { userId: newUser.userId, id: newUser._id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                token,
                user: {
                    userId: newUser.userId,
                    firstName: newUser.firstName,
                    gender: newUser.gender,
                    birthday: newUser.birthday,
                    preferences: newUser.preferences,
                    credits: newUser.credits,
                    subscription: newUser.subscription,
                    role: newUser.role || 'user'
                }
            }
        });

    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/login
 * Đăng nhập bảo mật
 */
router.post('/login', async (req, res) => {
    try {
        const { userId, password } = req.body;

        // 1. Validate Input
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập Username/ID'
            });
        }

        // 2. Tìm người dùng (bao gồm cả trường password để so sánh)
        const user = await User.findOne({ userId }).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Tài khoản không tồn tại'
            });
        }

        // 3. Check Password
        let isMatch = false;
        if (user.password) {
            // Nếu user có pass (người dùng mới), so sánh hash
            isMatch = await bcrypt.compare(password || '', user.password);
        } else {
            // BACKWARD COMPATIBILITY: Nếu user cũ chưa có pass
            // Tạm thời cho phép login không cần pass hoặc pass bất kỳ
            // TODO: Yêu cầu user cũ cập nhật mật khẩu
            isMatch = true;
        }

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Mật khẩu không đúng'
            });
        }

        // 4. Issue Token
        const token = jwt.sign(
            { userId: user.userId, id: user._id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                token,
                user: {
                    userId: user.userId,
                    firstName: user.firstName,
                    gender: user.gender,
                    images: user.images,
                    birthday: user.birthday,
                    preferences: user.preferences,
                    credits: user.credits,
                    subscription: user.subscription,
                    bio: user.bio,
                    role: user.role || 'user'
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
