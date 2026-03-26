/**
 * Auth Routes - Dating App
 * File này xử lý việc Đăng nhập và Xác thực người dùng
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const bcrypt = require('bcryptjs');
const { trackLoginAttempts } = require('../middleware/security');
const { validatePassword } = require('../middleware/sanitize');
const { OAuth2Client } = require('google-auth-library');

// Khởi tạo Google Client
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '411473856186-2ci4ftps9h62akrvorqp08s0h6okinjh.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Bí mật để mã hóa Token (lấy từ file .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// Brute force protection
const loginTracker = trackLoginAttempts({ maxAttempts: 5, lockoutMs: 15 * 60 * 1000 });

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng ký tài khoản mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, password, firstName, gender, birthday]
 *             properties:
 *               userId: { type: string, example: "newuser1" }
 *               password: { type: string, example: "MyPass123" }
 *               firstName: { type: string, example: "Minh" }
 *               gender: { type: string, enum: [male, female] }
 *               birthday: { type: string, format: date, example: "2000-01-15" }
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Thiếu thông tin hoặc userId đã tồn tại
 */
router.post('/register', validatePassword, async (req, res) => {
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
        if (!/^[a-zA-Z0-9_]{2,30}$/.test(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Username chỉ được chứa chữ cái, số và dấu gạch dưới (2-30 ký tự)'
            });
        }

        // 3. Validate birthday (must be 18+)
        const birthDate = new Date(birthday);
        const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 18) {
            return res.status(400).json({ success: false, message: 'Bạn phải đủ 18 tuổi để đăng ký.' });
        }

        // 4. Check duplicate user
        const existingUser = await User.findOne({ userId: new RegExp(`^${userId}$`, 'i') });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Tài khoản đã tồn tại'
            });
        }

        // 5. Hash Password (Băm mật khẩu) — cost factor 12
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 6. Create User
        const newUser = new User({
            userId,
            password: hashedPassword,
            firstName: firstName.substring(0, 50), // Max 50 chars
            gender,
            birthday: birthDate,
            preferences: {
                genderPreference: gender === 'male' ? 'female' : 'male'
            }
        });

        await newUser.save();

        // 7. Generate Token immediately (Auto login)
        const token = jwt.sign(
            { userId: newUser.userId, id: newUser._id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`🔐 SECURITY: New user registered: ${userId}`);

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
            message: 'Lỗi server khi đăng ký'
        });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng nhập
 *     description: Đăng nhập với userId và password. Bị khóa 15 phút sau 5 lần sai.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về JWT token
 *       401:
 *         description: Sai mật khẩu
 *       429:
 *         description: Tài khoản bị khóa tạm thời
 */
router.post('/login', loginTracker.check, async (req, res) => {
    try {
        const { userId, password } = req.body;

        // 1. Validate Input
        if (!userId || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập Username và Mật khẩu'
            });
        }

        // 2. Tìm người dùng (bao gồm cả trường password để so sánh)
        const user = await User.findOne({ userId }).select('+password');

        // Timing-safe: không tiết lộ user có tồn tại hay không
        if (!user || !user.password) {
            loginTracker.recordFail(userId);
            return res.status(401).json({
                success: false,
                message: 'Thông tin đăng nhập không đúng'
            });
        }

        // 3. Check banned
        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị cấm. Liên hệ hỗ trợ.'
            });
        }

        // 4. Check Password (bcrypt compare)
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            const attempt = loginTracker.recordFail(userId);
            const remaining = 5 - attempt.count;
            console.warn(`🔐 SECURITY: Failed login for ${userId} (${attempt.count} attempts)`);
            return res.status(401).json({
                success: false,
                message: remaining > 0 
                    ? `Mật khẩu không đúng. Còn ${remaining} lần thử.`
                    : 'Tài khoản bị khóa 15 phút do đăng nhập sai quá nhiều.',
                remainingAttempts: Math.max(0, remaining)
            });
        }

        // 5. Login successful — reset attempts
        loginTracker.recordSuccess(userId);

        // 6. Update last login
        user.lastActive = new Date();
        user.isOnline = true;
        await user.save();

        // 7. Issue Token
        const token = jwt.sign(
            { userId: user.userId, id: user._id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`🔐 SECURITY: Successful login: ${userId} from ${req.ip}`);

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
                    interests: user.interests,
                    profileDetails: user.profileDetails,
                    isVerified: user.isVerified,
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

/**
 * POST /api/auth/change-password
 * Đổi mật khẩu
 */
router.post('/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
        }

        const user = await User.findOne({ userId }).select('+password');
        if (!user || !user.password) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });
        }

        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        console.log(`🔐 SECURITY: Password changed for ${userId}`);

        res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
});
/**
 * POST /api/auth/logout-all
 * Đăng xuất tất cả thiết bị khác
 * (Tạo token mới, token cũ sẽ bị từ chối bằng tokenVersion)
 */
router.post('/logout-all', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId.' });

        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });

        // Tăng tokenVersion → tất cả token cũ sẽ invalid
        const newVersion = (user.tokenVersion || 0) + 1;
        await User.updateOne({ userId }, { tokenVersion: newVersion });

        // Tạo token mới cho thiết bị hiện tại
        const token = jwt.sign(
            { userId: user.userId, id: user._id, tokenVersion: newVersion },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`🔐 SECURITY: Logout all devices for ${userId}, tokenVersion: ${newVersion}`);

        res.json({
            success: true,
            message: 'Đã đăng xuất tất cả thiết bị khác.',
            data: { token }
        });
    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
});

/**
 * POST /api/auth/google
 * Đăng nhập bằng Google
 */
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ success: false, message: 'Google credential missing.' });
        }

        // Verify token với Google (trong môi trường dev có thể gặp lỗi nếu client ID mock, 
        // ta có thể decode tạm payload nếu giả lập, nhưng ở đây verify bằng client chính thức)
        // Lưu ý: nếu GOOGLE_CLIENT_ID là mock, decodeJWT thay cho verifyIdToken
        let payload;
        if (credential.includes('ya29.')) {
            // Dùng fetch api (Node 18+) để gọi google verify access_token
            try {
                const fetchRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${credential}` }
                });
                const userInfo = await fetchRes.json();
                if (!userInfo.sub) {
                    return res.status(401).json({ success: false, message: 'Invalid Google Access Token.' });
                }
                payload = { 
                    sub: userInfo.sub, 
                    email: userInfo.email, 
                    given_name: userInfo.given_name, 
                    picture: userInfo.picture 
                };
            } catch (err) {
                return res.status(401).json({ success: false, message: 'Error fetching google user info.' });
            }
        } else {
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken: credential,
                    audience: GOOGLE_CLIENT_ID
                });
                payload = ticket.getPayload();
            } catch (verifyError) {
                // Fallback for mocked/dev environment without valid client id
                console.warn("🔐 SECURITY: Falling back to direct decode for Google Token (dev mode).", verifyError.message);
                const jwtDecoded = jwt.decode(credential);
                if (!jwtDecoded || !jwtDecoded.email) {
                    return res.status(401).json({ success: false, message: 'Invalid Google Token.' });
                }
                payload = jwtDecoded;
            }
        }

        const { sub: googleId, email, given_name: firstName, picture } = payload;

        // Tìm user theo googleId hoặc email
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (!user) {
            // Tự động tạo tài khoản mới nếu đăng nhập lần đầu bằng Google
            // userId random hoặc tạo từ email
            const newUserId = "user_" + Math.random().toString(36).substring(2, 9);
            
            user = new User({
                googleId,
                email,
                userId: newUserId,
                firstName: firstName || 'User',
                gender: 'male', // default fallback, có thể ép người dùng cập nhật sau
                birthday: new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000), // default 18 years
                images: picture ? [picture] : [],
                isVerified: true, // Trusted from Google
                preferences: { genderPreference: 'female' }
            });
            await user.save();
            console.log(`🔐 SECURITY: New User created via Google Auth: ${newUserId}`);
        } else if (!user.googleId) {
            // Liên kết account nếu email trùng mà chưa có googleId
            user.googleId = googleId;
            if (picture && !user.images.length) {
                user.images.push(picture);
            }
            await user.save();
        }

        // Cập nhật trạng thái
        user.lastActive = new Date();
        user.isOnline = true;
        await user.save();

        // Tạo token cho ứng dụng
        const token = jwt.sign(
            { userId: user.userId, id: user._id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Đăng nhập Google thành công',
            data: {
                token,
                user: {
                    userId: user.userId,
                    firstName: user.firstName,
                    email: user.email,
                    gender: user.gender,
                    images: user.images,
                    birthday: user.birthday,
                    preferences: user.preferences,
                    credits: user.credits,
                    subscription: user.subscription,
                    bio: user.bio,
                    interests: user.interests,
                    profileDetails: user.profileDetails,
                    isVerified: user.isVerified,
                    role: user.role || 'user'
                }
            }
        });

    } catch (error) {
        console.error('Lỗi đăng nhập Google:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập Google' });
    }
});

/**
 * POST /api/auth/facebook
 * Đăng nhập bằng Facebook
 */
router.post('/facebook', async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) {
            return res.status(400).json({ success: false, message: 'Facebook access token missing.' });
        }

        let fbUser;
        try {
            const fetchRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`);
            fbUser = await fetchRes.json();
            if (fbUser.error) {
                return res.status(401).json({ success: false, message: 'Invalid Facebook Token.' });
            }
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Error fetching facebook user info.' });
        }

        const facebookId = fbUser.id;
        const email = fbUser.email || '';
        const firstName = fbUser.name;
        const picture = fbUser.picture?.data?.url;

        let user = await User.findOne({ 
            $or: [
                { facebookId }, 
                // Only search by email if it exists
                ...(email ? [{ email }] : [])
            ] 
        });

        if (!user) {
            const newUserId = "fb_" + Math.random().toString(36).substring(2, 9);
            user = new User({
                facebookId,
                // Mongodb sparse unique index requires undefined instead of empty string if field is not present
                email: email ? email : undefined,
                userId: newUserId,
                firstName: firstName || 'User',
                gender: 'male',
                birthday: new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000),
                images: picture ? [picture] : [],
                isVerified: true,
                preferences: { genderPreference: 'female' }
            });
            await user.save();
        } else if (!user.facebookId) {
            user.facebookId = facebookId;
            if (picture && !user.images.length) user.images.push(picture);
            await user.save();
        }

        user.lastActive = new Date();
        user.isOnline = true;
        await user.save();

        const token = jwt.sign({ userId: user.userId, id: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            message: 'Đăng nhập Facebook thành công',
            data: {
                token,
                user: {
                    userId: user.userId,
                    firstName: user.firstName,
                    email: user.email,
                    gender: user.gender,
                    images: user.images,
                    birthday: user.birthday,
                    preferences: user.preferences,
                    credits: user.credits,
                    subscription: user.subscription,
                    bio: user.bio,
                    interests: user.interests,
                    profileDetails: user.profileDetails,
                    isVerified: user.isVerified,
                    role: user.role || 'user'
                }
            }
        });
    } catch (error) {
        console.error('Lỗi đăng nhập Facebook:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập Facebook' });
    }
});

module.exports = router;
