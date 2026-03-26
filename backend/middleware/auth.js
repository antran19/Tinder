/**
 * Authentication & Authorization Middleware
 * 
 * 1. authenticateToken — Xác thực JWT token từ header Authorization
 * 2. authorizeOwner — Kiểm tra user chỉ truy cập data của chính mình
 * 3. authorizeAdmin — Chỉ cho phép admin
 * 4. optionalAuth — Xác thực nếu có token, bỏ qua nếu không
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

/**
 * Middleware: Xác thực JWT token
 * Yêu cầu header: Authorization: Bearer <token>
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Yêu cầu đăng nhập. Vui lòng cung cấp token.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if user still exists and not banned
        const user = await User.findOne({ userId: decoded.userId }).select('userId role isBanned');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Người dùng không tồn tại hoặc đã bị xóa.'
            });
        }

        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị cấm. Liên hệ hỗ trợ.'
            });
        }

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            id: decoded.id,
            role: user.role || 'user'
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
                code: 'TOKEN_EXPIRED'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ.',
                code: 'INVALID_TOKEN'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực.'
        });
    }
};

/**
 * Middleware: Kiểm tra user truy cập data của chính mình
 * Sử dụng sau authenticateToken
 * @param {string} paramName — Tên param chứa userId (default: 'userId')
 */
const authorizeOwner = (paramName = 'userId') => {
    return (req, res, next) => {
        const targetUserId = req.params[paramName] || req.body.userId || req.body.senderId;

        if (!targetUserId) {
            return next(); // Nếu không có targetUserId, cho qua (route sẽ tự xử lý)
        }

        // Admin có quyền truy cập mọi thứ
        if (req.user.role === 'admin') {
            return next();
        }

        if (req.user.userId.toLowerCase() !== targetUserId.toLowerCase()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập tài nguyên này.'
            });
        }

        next();
    };
};

/**
 * Middleware: Chỉ cho phép Admin
 * Sử dụng sau authenticateToken
 */
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ admin mới có quyền thực hiện hành động này.'
        });
    }
    next();
};

/**
 * Middleware: Optional Authentication
 * Nếu có token thì xác thực, không có thì vẫn cho qua
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = {
                userId: decoded.userId,
                id: decoded.id
            };
        }
    } catch (e) {
        // Token invalid/expired — ignore, treat as unauthenticated
    }
    next();
};

module.exports = {
    authenticateToken,
    authorizeOwner,
    authorizeAdmin,
    optionalAuth
};
