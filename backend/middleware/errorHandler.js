/**
 * Error Handling Middleware - Dating App
 * 
 * Centralized error handling cho tất cả API endpoints
 * Xử lý các loại lỗi khác nhau và trả về response thống nhất
 */

/**
 * Global Error Handler Middleware
 * Xử lý tất cả errors từ routes và middleware khác
 */
const errorHandler = (err, req, res, next) => {
  console.error('🚨 Global Error Handler:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Default error response
  let error = {
    success: false,
    message: 'Internal server error',
    statusCode: 500
  };

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    error.message = 'Dữ liệu không hợp lệ';
    error.statusCode = 400;
    error.errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
  }

  // Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    error.message = 'ID không hợp lệ';
    error.statusCode = 400;
    error.field = err.path;
    error.value = err.value;
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    error.message = 'Dữ liệu đã tồn tại';
    error.statusCode = 409;
    error.field = Object.keys(err.keyValue)[0];
    error.value = Object.values(err.keyValue)[0];
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Token không hợp lệ';
    error.statusCode = 401;
  }

  // JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    error.message = 'Token đã hết hạn';
    error.statusCode = 401;
  }

  // Custom API Error
  if (err.isOperational) {
    error.message = err.message;
    error.statusCode = err.statusCode || 500;
  }

  // Add development details
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    error.originalError = err.message;
  }

  res.status(error.statusCode).json(error);
};

/**
 * 404 Not Found Handler
 * Xử lý các routes không tồn tại
 */
const notFoundHandler = (req, res, next) => {
  console.log(`🔍 Route not found: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    message: 'Route không tồn tại',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableRoutes: {
      users: [
        'GET /api/users',
        'GET /api/users/:userId',
        'GET /api/users/available/:userId',
        'POST /api/users'
      ],
      swipes: [
        'POST /api/swipes',
        'GET /api/swipes/:userId',
        'GET /api/swipes/stats/:userId'
      ],
      matches: [
        'GET /api/matches',
        'GET /api/matches/:userId',
        'GET /api/matches/detail/:matchId',
        'PUT /api/matches/:matchId/status',
        'GET /api/matches/stats/global'
      ]
    }
  });
};

/**
 * Async Error Wrapper
 * Wrapper cho async functions để tự động catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom API Error Class
 * Tạo custom errors với status code và message
 */
class APIError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Request Logger Middleware
 * Log tất cả requests để debug
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.originalUrl}`, {
    body: req.method !== 'GET' ? req.body : undefined,
    params: Object.keys(req.params).length > 0 ? req.params : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    console.log(`📤 ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Rate Limiting Helper
 * Đơn giản rate limiting (có thể mở rộng với Redis)
 */
const rateLimitMap = new Map();

const simpleRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const limit = rateLimitMap.get(key);
    
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + windowMs;
      return next();
    }
    
    if (limit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Quá nhiều requests, vui lòng thử lại sau',
        retryAfter: Math.ceil((limit.resetTime - now) / 1000)
      });
    }
    
    limit.count++;
    next();
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  APIError,
  requestLogger,
  simpleRateLimit
};