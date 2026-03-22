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
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User, Match, Message, Notification, Swipe } = require('./models');

// Import routes
const usersRoutes = require('./routes/users');
const swipesRoutes = require('./routes/swipes');
const matchesRoutes = require('./routes/matches');
const authRoutes = require('./routes/auth');
const messagesRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/upload');

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
// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.SOCKET_CORS_ORIGIN
].filter((origin, index, self) => origin && self.indexOf(origin) === index); // Remove duplicates and undefined

// Basic middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files as static
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    origin: allowedOrigins,
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
      if (!userId) return;
      const normalizedUserId = userId.toString().toLowerCase();
      console.log(`👤 User ${normalizedUserId} joining room...`);

      socket.join(normalizedUserId);
      socket.userId = normalizedUserId;

      // Update user online status trong database (Case-insensitive query)
      await User.updateOne(
        { userId: { $regex: new RegExp(`^${normalizedUserId}$`, 'i') } },
        { isOnline: true },
        { upsert: false }
      );

      console.log(`✅ User ${normalizedUserId} joined room and marked online`);

      socket.emit('room-joined', {
        success: true,
        userId: normalizedUserId
      });

      socket.broadcast.emit('user-online', {
        userId: normalizedUserId,
        isOnline: true
      });
    } catch (error) {
      console.error(`❌ Error joining room:`, error);
    }
  });

  /**
   * Event: join-chat
   * Khi user mở cửa sổ chat với một match
   */
  socket.on('join-chat', async (data) => {
    try {
      const { matchId, userId } = typeof data === 'string' ? { matchId: data } : data;
      const effectiveUserId = (userId || socket.userId)?.toString().toLowerCase();
      
      console.log(`💬 User ${effectiveUserId} joining chat room: ${matchId}`);
      if (!matchId) return;

      socket.join(matchId.toString());
      
      // Log room membership
      const room = io.sockets.adapter.rooms.get(matchId.toString());
      console.log(`💬 Room ${matchId} now has ${room ? room.size : 0} members`);

      // Gửi trạng thái online của đối phương
      const match = await Match.findById(matchId);
      if (match && effectiveUserId) {
        const otherUserId = match.participants.find(id => id.toString().toLowerCase() !== effectiveUserId);
        const otherUser = await User.findOne({ userId: { $regex: new RegExp(`^${otherUserId}$`, 'i') } });
        if (otherUser) {
          console.log(`📡 Sending status of ${otherUserId} (${otherUser.isOnline}) to ${effectiveUserId}`);
          socket.emit('user-status', {
            userId: otherUserId.toString().toLowerCase(),
            isOnline: otherUser.isOnline
          });
          
          // Đồng thời broadcast cho người kia biết mình vừa vào chat (biến họ thành Online ngay lập tức)
          socket.to(matchId.toString()).emit('user-online', {
            userId: effectiveUserId,
            isOnline: true
          });
        }
      }
    } catch (error) {
      console.error('❌ Lỗi join-chat:', error);
    }
  });

  /**
   * Event: send-message
   * Xử lý gửi tin nhắn real-time
   */
  socket.on('send-message', async (messageData) => {
    try {
      const { matchId, senderId, content, messageType, imageUrl } = messageData;
      const normalizedSenderId = senderId?.toString().toLowerCase();

      console.log(`✉️ Tin nhắn mới (${messageType || 'text'}) trong ${matchId} từ ${normalizedSenderId}`);

      // 1. Lưu tin nhắn vào database
      const newMessage = new Message({
        matchId,
        senderId: normalizedSenderId,
        content: content || (messageType === 'image' ? '📷 Hình ảnh' : '🎞️ GIF'),
        messageType: messageType || 'text',
        imageUrl: imageUrl || null,
        createdAt: new Date()
      });
      await newMessage.save();

      // 2. Gửi tin nhắn tới tất cả mọi người trong phòng hội thoại (bao gồm cả người gửi để confirm)
      io.to(matchId).emit('receive-message', newMessage);

      // 3. (Optional) Gửi notification cho người nhận nếu họ không ở trong phòng chat
      // Có thể dùng một event riêng hoặc emit tới userId room
      const match = await Match.findById(matchId);
      if (match) {
        const receiverId = match.participants.find(id => id.toString().toLowerCase() !== normalizedSenderId);
        if (receiverId) {
          const normalizedReceiverId = receiverId.toString().toLowerCase();
          console.log(`🔔 Sending message notification to: ${normalizedReceiverId}`);
          io.to(normalizedReceiverId).emit('message-notification', {
            matchId: matchId.toString(),
            senderId: normalizedSenderId,
            content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
          });
        }
      }

    } catch (error) {
      console.error('❌ Lỗi xử lý gửi tin nhắn:', error);
      socket.emit('message-error', { message: 'Không thể gửi tin nhắn' });
    }
  });

  /**
   * Event: typing
   * Hiển thị trạng thái đang soạn tin (Phát tới tất cả mọi người trong phòng)
   */
  socket.on('typing', (data) => {
    const { matchId, senderId } = data;
    const normalizedSenderId = senderId?.toString().toLowerCase();
    if (!matchId) return;
    
    const room = io.sockets.adapter.rooms.get(matchId.toString());
    const roomSize = room ? room.size : 0;
    console.log(`⌨️ User ${normalizedSenderId} is typing in room ${matchId} (${roomSize} members in room)`);
    
    // Use socket.to() instead of io.to() - sends to everyone in room EXCEPT sender
    socket.to(matchId.toString()).emit('display-typing', { 
      matchId: matchId.toString(), 
      senderId: normalizedSenderId 
    });
  });

  /**
   * Event: stop-typing
   * Tắt trạng thái đang soạn tin
   */
  socket.on('stop-typing', (data) => {
    const { matchId, senderId } = data;
    const normalizedSenderId = senderId?.toString().toLowerCase();
    if (!matchId) return;

    console.log(`⌨️ User ${normalizedSenderId} stopped typing in ${matchId}`);
    socket.to(matchId.toString()).emit('hide-typing', { 
      matchId: matchId.toString(), 
      senderId: normalizedSenderId 
    });
  });

  /**
   * Event: mark-as-read
   * Đánh dấu tin nhắn là đã xem và thông báo cho người gửi
   */
  socket.on('mark-as-read', async (data) => {
    try {
      const { matchId, userId } = data;
      const normalizedUserId = userId?.toString().toLowerCase();
      console.log(`📖 User ${normalizedUserId} marking messages in ${matchId} as read`);
      
      const targetMatchId = mongoose.Types.ObjectId.isValid(matchId) 
        ? new mongoose.Types.ObjectId(matchId) 
        : matchId;

      // Update DB - Mark ALL messages sent by OTHER user as read
      const result = await Message.updateMany(
        { matchId: targetMatchId, senderId: { $ne: normalizedUserId }, isRead: false },
        { $set: { isRead: true } }
      );

      console.log(`✅ Updated ${result.modifiedCount} messages to read status in DB`);

      // Thông báo cho tất cả mọi người trong phòng chat
      console.log(`📡 Emitting messages-read-update to room ${matchId}`);
      io.to(matchId.toString()).emit('messages-read-update', { 
        matchId: matchId.toString(), 
        readerId: normalizedUserId,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Lỗi đánh dấu đã đọc qua socket:', error);
    }
  });

  /**
   * Event: disconnect
   * ... existing code ...
   */
  socket.on('disconnect', async (reason) => {
    try {
      console.log(`🔌 Socket ${socket.id} disconnected. Reason: ${reason}`);

      // Nếu socket có userId, update online status
      if (socket.userId) {
        console.log(`👤 User ${socket.userId} going offline...`);

        // Update user online status trong database (Case-insensitive query)
        await User.updateOne(
          { userId: { $regex: new RegExp(`^${socket.userId}$`, 'i') } },
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
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/premium', require('./routes/premium'));
app.use('/api/payment', require('./routes/payment')); // QR Bank Payment
app.use('/api/admin', require('./routes/admin'));      // Admin Dashboard
app.use('/api/stories', require('./routes/stories'));  // Stories 24h
app.use('/api/reports', require('./routes/reports'));  // Report & Block
app.use('/api/verification', require('./routes/verification')); // Selfie Verification
app.use('/api/upload', uploadRoutes); // Upload images (chat & profile)

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