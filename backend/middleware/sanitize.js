/**
 * Input Sanitization & Validation Middleware
 * 
 * Chống: XSS, NoSQL Injection, Path Traversal, Invalid Input
 */

/**
 * Sanitize string: loại bỏ HTML tags, script injection
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/[<>]/g, '') // Remove < >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick=, onerror=, etc.)
        .replace(/\$(?:gt|gte|lt|lte|ne|in|nin|or|and|not|regex|where|exists)/gi, '') // NoSQL operators
        .trim();
};

/**
 * Deep sanitize object (recursive)
 */
const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return sanitizeString(obj);
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeObject);

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        // Block keys starting with $ (MongoDB operator injection)
        if (key.startsWith('$')) continue;
        // Block __proto__ pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
        sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
};

/**
 * Middleware: Sanitize tất cả input (body, query, params)
 */
const sanitizeInput = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
    }
    next();
};

/**
 * Validate userId format
 */
const validateUserId = (paramName = 'userId') => {
    return (req, res, next) => {
        const userId = req.params[paramName] || req.body[paramName];
        if (userId && !/^[a-zA-Z0-9_]{2,30}$/.test(userId)) {
            return res.status(400).json({
                success: false,
                message: 'UserId không hợp lệ. Chỉ cho phép chữ cái, số, dấu gạch dưới (2-30 ký tự).'
            });
        }
        next();
    };
};

/**
 * Validate password strength
 */
const validatePassword = (req, res, next) => {
    const { password } = req.body;
    if (!password) return next();

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Mật khẩu phải có ít nhất 6 ký tự.'
        });
    }
    if (password.length > 128) {
        return res.status(400).json({
            success: false,
            message: 'Mật khẩu không được quá 128 ký tự.'
        });
    }
    next();
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (paramName) => {
    return (req, res, next) => {
        const id = req.params[paramName];
        if (id && !/^[a-fA-F0-9]{24}$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: `${paramName} không hợp lệ.`
            });
        }
        next();
    };
};

/**
 * Limit request body size for specific routes
 */
const limitBodySize = (maxFields = 20) => {
    return (req, res, next) => {
        if (req.body && typeof req.body === 'object') {
            const keys = Object.keys(req.body);
            if (keys.length > maxFields) {
                return res.status(400).json({
                    success: false,
                    message: `Quá nhiều trường dữ liệu (tối đa ${maxFields}).`
                });
            }
        }
        next();
    };
};

module.exports = {
    sanitizeInput,
    sanitizeString,
    sanitizeObject,
    validateUserId,
    validatePassword,
    validateObjectId,
    limitBodySize
};
