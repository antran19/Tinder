/**
 * Dating App Backend Server
 * 
 * Main entry point cho backend server sử dụng Express.js và Socket.io
 * Tập trung vào luồng chính: hiển thị users → swipe → real-time notification → update database
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Import database configuration
const { connectDB, setupConnectionEvents, getConnectionStatus, ensureCollections } = require('./config/database');

// Import models để đảm bảo chúng được đăng ký với Mongoose
const { User, Swipe, Match, Message } = require('./models');

// Import routes
const usersRoutes = require('./routes/users');
const swipesRoutes = require('./routes/swipes');
const matchesRoutes = require('./routes/matches');
const authRoutes = require('./routes/auth');
const messagesRoutes = require('./routes/messages'); // Mới: Thêm route tin nhắn // Mới: Thêm route đăng nhập

// Import middleware
const {
  errorHandler,
  notFoundHandler,
  requestLogger,
  simpleRateLimit
} = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors({
  origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (chỉ trong development)
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

// Simple rate limiting
app.use(simpleRateLimit(1000, 15 * 60 * 1000)); // 1000 requests per 15 minutes

// ===== SOCKET.IO SETUP =====
/**
 * Socket.io Server Configuration
 * 
 * Thiết lập Socket.io server để xử lý real-time communication
 * Tập trung vào các events chính: join-room, disconnect, và match notifications
 */
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Cấu hình connection timeout và ping interval
  pingTimeout: 60000,
  pingInterval: 25000
});

/**
 * Socket.io Connection Handler
 * 
 * Xử lý các events chính:
 * - connection: Khi user kết nối
 * - join-room: User join room với userId để nhận notifications
 * - disconnect: User ngắt kết nối, update online status
 */
io.on('connection', (socket) => {
  console.log(`🔌 New socket connection: ${socket.id}`);

  /**
   * Event: join-room
   * 
   * Khi user join room với userId:
   * 1. Join socket vào room với userId
   * 2. Lưu userId vào socket object
   * 3. Update user online status trong database
   * 4. Emit confirmation về client
   */
  socket.on('join-room', async (userId) => {
    try {
      console.log(`👤 User ${userId} joining room...`);

      // Join socket vào room với userId
      socket.join(userId);
      socket.userId = userId;

      // Update user online status trong database
      await User.updateOne(
        { userId: userId },
        { isOnline: true },
        { upsert: false } // Không tạo user mới nếu không tồn tại
      );

      console.log(`✅ User ${userId} joined room and marked online`);

      // Emit confirmation về client
      socket.emit('room-joined', {
        success: true,
        userId: userId,
        message: 'Successfully joined room'
      });

      // Broadcast user online status (optional - có thể dùng cho hiển thị online users)
      socket.broadcast.emit('user-online', {
        userId: userId,
        isOnline: true
      });

    } catch (error) {
      console.error(`❌ Error joining room for user ${userId}:`, error);
      socket.emit('room-join-error', {
        success: false,
        message: 'Failed to join room',
        error: error.message
      });
    }
  });

  /**
   * Event: join-chat
   * Khi user mở cửa sổ chat với một match
   */
  socket.on('join-chat', (matchId) => {
    console.log(`💬 User ${socket.userId} joined chat room: ${matchId}`);
    socket.join(matchId);
  });

  /**
   * Event: send-message
   * Xử lý gửi tin nhắn real-time
   */
  socket.on('send-message', async (messageData) => {
    try {
      const { matchId, senderId, content } = messageData;

      console.log(`✉️ Tin nhắn mới trong ${matchId} từ ${senderId}`);

      // 1. Lưu tin nhắn vào database
      const newMessage = new Message({
        matchId,
        senderId,
        content,
        createdAt: new Date()
      });
      await newMessage.save();

      // 2. Gửi tin nhắn tới tất cả mọi người trong phòng hội thoại (bao gồm cả người gửi để confirm)
      io.to(matchId).emit('receive-message', newMessage);

      // 3. (Optional) Gửi notification cho người nhận nếu họ không ở trong phòng chat
      // Có thể dùng một event riêng hoặc emit tới userId room
      const match = await Match.findById(matchId);
      if (match) {
        const receiverId = match.participants.find(id => id !== senderId);
        io.to(receiverId).emit('message-notification', {
          matchId,
          senderId,
          content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        });
      }

    } catch (error) {
      console.error('❌ Lỗi xử lý gửi tin nhắn:', error);
      socket.emit('message-error', { message: 'Không thể gửi tin nhắn' });
    }
  });

  /**
   * Event: disconnect
   * 
   * Khi user ngắt kết nối:
   * 1. Update user online status thành false
   * 2. Broadcast user offline status
   * 3. Log disconnect event
   */
  socket.on('disconnect', async (reason) => {
    try {
      console.log(`🔌 Socket ${socket.id} disconnected. Reason: ${reason}`);

      // Nếu socket có userId, update online status
      if (socket.userId) {
        console.log(`👤 User ${socket.userId} going offline...`);

        // Update user online status trong database
        await User.updateOne(
          { userId: socket.userId },
          { isOnline: false }
        );

        console.log(`✅ User ${socket.userId} marked offline`);

        // Broadcast user offline status
        socket.broadcast.emit('user-offline', {
          userId: socket.userId,
          isOnline: false
        });
      }

    } catch (error) {
      console.error(`❌ Error handling disconnect for user ${socket.userId}:`, error);
    }
  });

  /**
   * Event: error
   * 
   * Xử lý lỗi Socket.io
   */
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

/**
 * Export io instance để sử dụng trong routes khác
 * Đặc biệt quan trọng cho việc emit match notifications từ swipes route
 */
global.io = io;

console.log('🔌 Socket.io server setup completed');

// Basic route để test server
app.get('/', (req, res) => {
  res.json({
    message: 'Dating App Backend Server is running!',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      health: '/health',
      database: '/api/database/info',
      users: '/api/users',
      swipes: '/api/swipes',
      matches: '/api/matches'
    }
  });
});

// Health check endpoint với thông tin database và Socket.io
app.get('/health', (req, res) => {
  const dbStatus = getConnectionStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    socketio: {
      enabled: true,
      connectedClients: io.engine.clientsCount || 0
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  });
});

// Database info endpoint
app.get('/api/database/info', (req, res) => {
  const dbStatus = getConnectionStatus();
  res.json({
    success: true,
    database: dbStatus,
    collections: {
      users: 'Lưu trữ thông tin người dùng',
      swipes: 'Lưu trữ lịch sử hành động swipe',
      matches: 'Lưu trữ các cặp đôi đã match'
    }
  });
});

// Socket.io test endpoint
app.get('/api/socket/info', (req, res) => {
  const { getSocketStats } = require('./utils/socketUtils');
  const socketStats = getSocketStats();

  res.json({
    success: true,
    message: 'Socket.io information',
    data: {
      ...socketStats,
      events: {
        client_to_server: ['join-room', 'disconnect'],
        server_to_client: ['room-joined', 'room-join-error', 'new-match', 'user-online', 'user-offline', 'user-status-update']
      },
      usage: {
        join_room: 'Client emits "join-room" with userId to receive notifications',
        match_notification: 'Server emits "new-match" when mutual like creates a match',
        user_status: 'Server broadcasts user online/offline status changes'
      }
    }
  });
});

// API Routes
console.log('🔗 Setting up API routes...');

// Users routes - xử lý thông tin users và available users
app.use('/api/users', usersRoutes);

// Swipes routes - xử lý swipe actions và match logic
app.use('/api/swipes', swipesRoutes);

// Auth routes - xử lý đăng nhập
app.use('/api/auth', authRoutes);

// Messages routes - xử lý tin nhắn chat
app.use('/api/messages', messagesRoutes);

// Matches routes - xử lý matches và thống kê
app.use('/api/matches', matchesRoutes);

console.log('✅ API routes setup completed');

// 404 handler cho routes không tồn tại
app.use(notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

// Start server với database connection
const startServer = async () => {
  try {
    // Kết nối database trước khi start server
    console.log('🔄 Khởi tạo Dating App Backend...');

    // Setup database connection events
    setupConnectionEvents();

    // Kết nối đến MongoDB
    await connectDB();

    // Đảm bảo các collections cần thiết tồn tại
    const collectionsInfo = await ensureCollections();
    console.log('📊 Collections info:', collectionsInfo);

    // Start HTTP server (với Socket.io)
    server.listen(PORT, () => {
      console.log(`🚀 Dating App Backend server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`🔌 Socket.io: Enabled and ready for real-time communication`);
      console.log(`💾 Database: Connected and ready`);
      console.log(`📁 Collections: users, swipes, matches`);
      console.log('✅ Server khởi tạo thành công!');
    });

  } catch (error) {
    console.error('❌ Lỗi khởi tạo server:', error.message);
    process.exit(1);
  }
};

// Khởi chạy server
startServer();