/**
 * Real-time Match Notification Integration Test
 * 
 * Test Task 6.2: Implement real-time match notification
 * - Emit 'new-match' event khi có match mới
 * - Send notification cho cả hai users
 * - Requirements: 3.2
 */

const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');
const express = require('express');

// Import models và routes
const { User, Swipe, Match } = require('../models');
const swipesRouter = require('../routes/swipes');
const { emitMatchNotification } = require('../utils/socketUtils');

describe('Real-time Match Notification - Task 6.2', () => {
  let mongoServer;
  let app;
  let server;
  let io;
  let clientSocket1;
  let clientSocket2;
  let httpServer;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup Express app với Socket.io
    app = express();
    app.use(express.json());
    
    httpServer = http.createServer(app);
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Set global.io để socketUtils có thể sử dụng
    global.io = io;

    // Setup Socket.io events
    io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);
      
      socket.on('join-room', async (userId) => {
        try {
          socket.join(userId);
          socket.userId = userId;
          
          console.log(`👤 User ${userId} joined room`);
          
          socket.emit('room-joined', {
            success: true,
            userId: userId,
            message: 'Successfully joined room'
          });
          
        } catch (error) {
          console.error('❌ Error joining room:', error);
          socket.emit('room-join-error', {
            success: false,
            message: 'Failed to join room',
            error: error.message
          });
        }
      });
      
      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });

    // Setup routes
    app.use('/api/swipes', swipesRouter);

    // Start server
    await new Promise((resolve) => {
      httpServer.listen(0, resolve);
    });

    const port = httpServer.address().port;
    console.log(`🚀 Test server running on port ${port}`);
    
    // Setup client sockets
    clientSocket1 = new Client(`http://localhost:${port}`);
    clientSocket2 = new Client(`http://localhost:${port}`);

    // Wait for connections
    await Promise.all([
      new Promise((resolve) => clientSocket1.on('connect', resolve)),
      new Promise((resolve) => clientSocket2.on('connect', resolve))
    ]);
  });

  afterAll(async () => {
    // Cleanup
    if (clientSocket1) clientSocket1.close();
    if (clientSocket2) clientSocket2.close();
    if (httpServer) httpServer.close();
    
    // Clear global.io
    global.io = undefined;
    
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await Swipe.deleteMany({});
    await Match.deleteMany({});
    
    // Remove all listeners to prevent interference between tests
    clientSocket1.removeAllListeners(['new-match', 'room-joined']);
    clientSocket2.removeAllListeners(['new-match', 'room-joined']);
  });

  describe('Real-time Match Notification System', () => {
    test('Should emit new-match event to both users when match is created - Requirements 3.2', async () => {
      // Tạo test users
      const user1 = new User({
        userId: 'user1',
        firstName: 'Alice',
        birthday: new Date('1990-01-01'),
        gender: 'female'
      });
      
      const user2 = new User({
        userId: 'user2',
        firstName: 'Bob',
        birthday: new Date('1990-01-01'),
        gender: 'male'
      });
      
      await Promise.all([user1.save(), user2.save()]);

      // Both users join their rooms
      await Promise.all([
        new Promise((resolve) => {
          clientSocket1.emit('join-room', 'user1');
          clientSocket1.once('room-joined', resolve);
        }),
        new Promise((resolve) => {
          clientSocket2.emit('join-room', 'user2');
          clientSocket2.once('room-joined', resolve);
        })
      ]);

      // Setup listeners for match notifications
      const matchNotifications = [];
      
      clientSocket1.on('new-match', (data) => {
        console.log('📱 User1 received match notification:', data);
        matchNotifications.push({ user: 'user1', data });
      });
      
      clientSocket2.on('new-match', (data) => {
        console.log('📱 User2 received match notification:', data);
        matchNotifications.push({ user: 'user2', data });
      });

      // Step 1: User1 likes User2 (no match yet)
      console.log('👍 User1 likes User2...');
      const swipe1Response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        });

      expect(swipe1Response.status).toBe(201);
      expect(swipe1Response.body.success).toBe(true);
      expect(swipe1Response.body.data.match).toBe(false);

      // Wait a bit to ensure no premature notifications
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(matchNotifications).toHaveLength(0);

      // Step 2: User2 likes User1 (should create match and emit notifications)
      console.log('👍 User2 likes User1...');
      const swipe2Response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user2',
          toUserId: 'user1',
          type: 'like'
        });

      expect(swipe2Response.status).toBe(201);
      expect(swipe2Response.body.success).toBe(true);
      expect(swipe2Response.body.data.match).toBe(true);
      expect(swipe2Response.body.message).toContain("It's a Match!");

      // Wait for real-time notifications
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify both users received match notifications
      expect(matchNotifications).toHaveLength(2);

      // Check user1's notification
      const user1Notification = matchNotifications.find(n => n.user === 'user1');
      expect(user1Notification).toBeDefined();
      expect(user1Notification.data.matchId).toBeDefined();
      expect(user1Notification.data.participants).toEqual(['user2', 'user1']);
      expect(user1Notification.data.matchedWith).toBe('user2');
      expect(user1Notification.data.message).toBe("It's a Match! 🎉");

      // Check user2's notification
      const user2Notification = matchNotifications.find(n => n.user === 'user2');
      expect(user2Notification).toBeDefined();
      expect(user2Notification.data.matchId).toBeDefined();
      expect(user2Notification.data.participants).toEqual(['user2', 'user1']);
      expect(user2Notification.data.matchedWith).toBe('user1');
      expect(user2Notification.data.message).toBe("It's a Match! 🎉");

      // Verify match was created in database
      const match = await Match.findOne({ participants: { $all: ['user1', 'user2'] } });
      expect(match).toBeDefined();
      expect(match.status).toBe('active');
      expect(match.participants).toEqual(expect.arrayContaining(['user1', 'user2']));

    }, 15000);

    test('Should not emit notifications when no match occurs', async () => {
      // Tạo test users
      const user1 = new User({
        userId: 'user1',
        firstName: 'Alice',
        birthday: new Date('1990-01-01'),
        gender: 'female'
      });
      
      const user2 = new User({
        userId: 'user2',
        firstName: 'Bob',
        birthday: new Date('1990-01-01'),
        gender: 'male'
      });
      
      await Promise.all([user1.save(), user2.save()]);

      // Both users join their rooms
      await Promise.all([
        new Promise((resolve) => {
          clientSocket1.emit('join-room', 'user1');
          clientSocket1.once('room-joined', resolve);
        }),
        new Promise((resolve) => {
          clientSocket2.emit('join-room', 'user2');
          clientSocket2.once('room-joined', resolve);
        })
      ]);

      // Setup listeners for match notifications
      const matchNotifications = [];
      
      clientSocket1.on('new-match', (data) => {
        matchNotifications.push({ user: 'user1', data });
      });
      
      clientSocket2.on('new-match', (data) => {
        matchNotifications.push({ user: 'user2', data });
      });

      // User1 passes on User2 (no match)
      const swipeResponse = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'pass'
        });

      expect(swipeResponse.status).toBe(201);
      expect(swipeResponse.body.success).toBe(true);
      expect(swipeResponse.body.data.match).toBe(false);

      // Wait and verify no notifications were sent
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(matchNotifications).toHaveLength(0);

    }, 10000);

    test('Should handle offline users gracefully', async () => {
      // Tạo test users
      const user1 = new User({
        userId: 'user1',
        firstName: 'Alice',
        birthday: new Date('1990-01-01'),
        gender: 'female'
      });
      
      const user2 = new User({
        userId: 'user2',
        firstName: 'Bob',
        birthday: new Date('1990-01-01'),
        gender: 'male'
      });
      
      await Promise.all([user1.save(), user2.save()]);

      // Only user1 joins room (user2 is offline)
      await new Promise((resolve) => {
        clientSocket1.emit('join-room', 'user1');
        clientSocket1.once('room-joined', resolve);
      });

      // Setup listener for user1 only
      const matchNotifications = [];
      
      clientSocket1.on('new-match', (data) => {
        matchNotifications.push({ user: 'user1', data });
      });

      // Create mutual likes to trigger match
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        });

      const swipe2Response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user2',
          toUserId: 'user1',
          type: 'like'
        });

      expect(swipe2Response.body.data.match).toBe(true);

      // Wait for notifications
      await new Promise(resolve => setTimeout(resolve, 200));

      // User1 should still receive notification even if user2 is offline
      expect(matchNotifications).toHaveLength(1);
      expect(matchNotifications[0].user).toBe('user1');
      expect(matchNotifications[0].data.matchedWith).toBe('user2');

    }, 10000);
  });

  describe('Socket Utils Integration', () => {
    test('emitMatchNotification function should work with real Socket.io instance', () => {
      const matchData = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2'],
        createdAt: new Date()
      };
      
      // Should not throw error when global.io is available
      expect(() => {
        emitMatchNotification(matchData);
      }).not.toThrow();
    });

    test('emitMatchNotification should handle invalid data gracefully', () => {
      const invalidMatchData = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1'], // Invalid: only 1 participant
        createdAt: new Date()
      };
      
      // Should not throw error, just log warning
      expect(() => {
        emitMatchNotification(invalidMatchData);
      }).not.toThrow();
    });
  });
});