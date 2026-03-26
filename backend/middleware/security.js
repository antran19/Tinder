/**
 * Security Middleware
 * 
 * 1. Security Headers (OWASP recommended)
 * 2. Advanced Rate Limiting (per route, per user)
 * 3. Login Attempt Tracking (brute force protection)
 * 4. Request ID for audit trail
 */

const crypto = require('crypto');

/**
 * Security Headers
 * Thiết lập các HTTP headers bảo mật theo OWASP
 */
const securityHeaders = (req, res, next) => {
    // Ngăn chặn clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Ngăn chặn MIME-type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Enable XSS filter trên trình duyệt cũ
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Referrer Policy - chỉ gửi origin
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions Policy - giới hạn features
    res.setHeader('Permissions-Policy', 'camera=self, microphone=self, geolocation=self');
    // Strict Transport Security (HTTPS only)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    // Content Security Policy
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'");
    // Remove server info
    res.removeHeader('X-Powered-By');

    next();
};

/**
 * Advanced Rate Limiting
 * Rate limit theo route cụ thể và theo user
 */
const routeRateLimits = new Map();

const advancedRateLimit = ({ maxRequests = 30, windowMs = 60000, keyFn = null, message = null } = {}) => {
    return (req, res, next) => {
        // Key = custom function hoặc IP + route
        const key = keyFn ? keyFn(req) : `${req.ip}:${req.baseUrl}${req.path}`;
        const now = Date.now();

        if (!routeRateLimits.has(key)) {
            routeRateLimits.set(key, { count: 1, resetTime: now + windowMs, firstRequest: now });
            return next();
        }

        const limit = routeRateLimits.get(key);

        if (now > limit.resetTime) {
            limit.count = 1;
            limit.resetTime = now + windowMs;
            limit.firstRequest = now;
            return next();
        }

        if (limit.count >= maxRequests) {
            const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
            res.setHeader('Retry-After', retryAfter);
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', 0);

            return res.status(429).json({
                success: false,
                message: message || 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
                retryAfter
            });
        }

        limit.count++;
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', maxRequests - limit.count);
        next();
    };
};

/**
 * Login Attempt Tracking — Brute Force Protection
 * Khóa sau N lần sai liên tiếp
 */
const loginAttempts = new Map();

const trackLoginAttempts = ({ maxAttempts = 5, lockoutMs = 15 * 60 * 1000 } = {}) => {
    return {
        /**
         * Check if account is locked
         */
        check: (req, res, next) => {
            const key = `login:${req.body.userId || req.ip}`;
            const attempt = loginAttempts.get(key);

            if (attempt && attempt.locked && Date.now() < attempt.lockedUntil) {
                const remainingMs = attempt.lockedUntil - Date.now();
                const remainingMin = Math.ceil(remainingMs / 60000);
                return res.status(429).json({
                    success: false,
                    message: `Tài khoản bị khóa tạm thời do đăng nhập sai nhiều lần. Thử lại sau ${remainingMin} phút.`,
                    code: 'ACCOUNT_LOCKED',
                    lockedUntil: new Date(attempt.lockedUntil).toISOString()
                });
            }
            next();
        },

        /**
         * Record failed attempt
         */
        recordFail: (userId) => {
            const key = `login:${userId}`;
            const attempt = loginAttempts.get(key) || { count: 0, lastAttempt: 0 };

            attempt.count++;
            attempt.lastAttempt = Date.now();

            if (attempt.count >= maxAttempts) {
                attempt.locked = true;
                attempt.lockedUntil = Date.now() + lockoutMs;
                console.warn(`🔒 Account locked: ${userId} after ${attempt.count} failed attempts`);
            }

            loginAttempts.set(key, attempt);
            return attempt;
        },

        /**
         * Reset after successful login
         */
        recordSuccess: (userId) => {
            loginAttempts.delete(`login:${userId}`);
        }
    };
};

/**
 * Request ID Generator
 * Tạo unique ID cho mỗi request để tracking và audit
 */
const requestId = (req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    next();
};

/**
 * Audit Logger — Ghi log bảo mật
 */
const auditLog = (action) => {
    return (req, res, next) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
            action,
            userId: req.user?.userId || 'anonymous',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.originalUrl,
            method: req.method
        };

        console.log(`🔐 AUDIT: ${JSON.stringify(logEntry)}`);
        next();
    };
};

// Cleanup expired entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of routeRateLimits) {
        if (now > val.resetTime) routeRateLimits.delete(key);
    }
    for (const [key, val] of loginAttempts) {
        if (val.lockedUntil && now > val.lockedUntil + 60000) loginAttempts.delete(key);
    }
}, 10 * 60 * 1000);

module.exports = {
    securityHeaders,
    advancedRateLimit,
    trackLoginAttempts,
    requestId,
    auditLog
};
