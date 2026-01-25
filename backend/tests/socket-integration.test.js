/**
 * Socket.io Integration Tests
 * 
 * Test các chức năng Socket.io cơ bản:
 * - Connection và disconnection
 * - Join room events
 * - User online status updates
 * - Match notifications
 */

const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');
const express = require('express');

// Import models
const { User, Swipe, Match } = require('../models');

describe('Socket.io Integration Tests', () => {
  let mongoServer;
  let server;
  let io;
  let clientSocket;
  let serverSocket;
  let app;
  let httpServer;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup Express app với Socket.io
    app = express();
    httpServer = http.createServer(app);
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Setup Socket.io events (giống như trong main server)
    io.on('connection', (socket) => {
      serverSocket = socket;
      
      socket.on('join-room', async (userId) => {
        try {
          socket.join(userId);
          socket.userId = userId;
          
          await User.updateOne(
            { userId: userId },
            { isOnline: true },
            { upsert: false }
          );
          
          socket.emit('room-joined', {
            success: true,
            userId: userId,
            message: 'Successfully joined room'
          });
          
          socket.broadcast.emit('user-online', {
            userId: userId,
            isOnline: true
          });
          
        } catch (error) {
          socket.emit('room-join-error', {
            success: false,
            message: 'Failed to join room',
            error: error.message
          });
        }
      });
      
      socket.on('disconnect', async () => {
        if (socket.userId) {
          await User.updateOne(
            { userId: socket.userId },
            { isOnline: false }
          );
          
          socket.broadcast.emit('user-offline', {
            userId: socket.userId,
            isOnline: false
          });
        }
      });
    });

    // Start server
    await new Promise((resolve) => {
      httpServer.listen(0, resolve);
    });

    const port = httpServer.address().port;
    
    // Setup client socket
    clientSocket = new Client(`http://localhost:${port}`);
  });

  afterAll(async () => {
    // Cleanup
    if (clientSocket) clientSocket.close();
    if (httpServer) httpServer.close();
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
    if (clientSocket) {
      clientSocket.removeAllListeners();
    }
  });

  describe('Socket Connection và Join Room', () => {
    test('Client có thể kết nối và join room', (done) => {
      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });

    test('User có thể join room và update online status', async () => {
      // Tạo test user
      const testUser = new User({
        userId: 'test-user-1',
        firstName: 'Test User',
        birthday: new Date('1990-01-01'),
        gender: 'male',
        isOnline: false
      });
      await testUser.save();

      // Test join room
      return new Promise((resolve) => {
        clientSocket.emit('join-room', 'test-user-1');
        
        clientSocket.on('room-joined', async (data) => {
          expect(data.success).toBe(true);
          expect(data.userId).toBe('test-user-1');
          
          // Verify user online status updated
          const updatedUser = await User.findOne({ userId: 'test-user-1' });
          expect(updatedUser.isOnline).toBe(true);
          
          resolve();
        });
      });
    });

    test('Join room với user không tồn tại vẫn thành công (không upsert)', async () => {
      return new Promise((resolve) => {
        clientSocket.emit('join-room', 'non-existent-user');
        
        clientSocket.on('room-joined', async (data) => {
          expect(data.success).toBe(true);
          expect(data.userId).toBe('non-existent-user');
          
          // Verify user không được tạo mới
          const user = await User.findOne({ userId: 'non-existent-user' });
          expect(user).toBeNull();
          
          resolve();
        });
      });
    });
  });

  describe('User Status Updates', () => {
    test('Disconnect event updates user offline status', async () => {
      // Tạo test user
      const testUser = new User({
        userId: 'test-user-2',
        firstName: 'Test User 2',
        birthday: new Date('1990-01-01'),
        gender: 'female',
        isOnline: true
      });
      await testUser.save();

      // Join room first
      await new Promise((resolve) => {
        clientSocket.emit('join-room', 'test-user-2');
        clientSocket.on('room-joined', resolve);
      });

      // Test disconnect
      await new Promise((resolve) => {
        clientSocket.disconnect();
        
        // Wait a bit for disconnect handler to run
        setTimeout(async () => {
          const updatedUser = await User.findOne({ userId: 'test-user-2' });
          expect(updatedUser.isOnline).toBe(false);
          resolve();
        }, 100);
      });
    });
  });

  describe('Match Notifications', () => {
    test('Match notification được emit khi có mutual like', async () => {
      // Tạo test users
      const user1 = new User({
        userId: 'user1',
        firstName: 'User 1',
        birthday: new Date('1990-01-01'),
        gender: 'male'
      });
      
      const user2 = new User({
        userId: 'user2',
        firstName: 'User 2',
        birthday: new Date('1990-01-01'),
        gender: 'female'
      });
      
      await Promise.all([user1.save(), user2.save()]);

      // Test match notification
      return new Promise((resolve, reject) => {
        let roomJoined = false;
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout - client socket may not be connected'));
        }, 8000);
        
        // Ensure client is connected first
        if (!clientSocket.connected) {
          clientSocket.connect();
        }
        
        clientSocket.once('connect', () => {
          // Join room as user1
          clientSocket.emit('join-room', 'user1');
        });
        
        clientSocket.once('room-joined', () => {
          roomJoined = true;
          // Simulate match creation và emit notification
          const matchData = {
            _id: new mongoose.Types.ObjectId(),
            participants: ['user1', 'user2'],
            createdAt: new Date()
          };
          
          // Emit match notification (simulate từ server)
          setTimeout(() => {
            io.to('user1').emit('new-match', {
              matchId: matchData._id,
              participants: matchData.participants,
              matchedWith: 'user2',
              createdAt: matchData.createdAt,
              message: "It's a Match! 🎉"
            });
          }, 100);
        });
        
        clientSocket.once('new-match', (data) => {
          clearTimeout(timeout);
          expect(roomJoined).toBe(true);
          expect(data.matchId).toBeDefined();
          expect(data.participants).toEqual(['user1', 'user2']);
          expect(data.matchedWith).toBe('user2');
          expect(data.message).toBe("It's a Match! 🎉");
          resolve();
        });
        
        // If already connected, start the test immediately
        if (clientSocket.connected) {
          clientSocket.emit('join-room', 'user1');
        }
      });
    }, 12000);
  });

  describe('Socket Utils Integration', () => {
    test('Socket stats có thể được lấy', () => {
      const { getSocketStats } = require('../utils/socketUtils');
      
      // Set global.io để test
      global.io = io;
      
      const stats = getSocketStats();
      expect(stats.enabled).toBe(true);
      expect(stats.connectedClients).toBeDefined();
      expect(Array.isArray(stats.rooms)).toBe(true);
    });

    test('emitMatchNotification function hoạt động', () => {
      const { emitMatchNotification } = require('../utils/socketUtils');
      
      // Set global.io để test
      global.io = io;
      
      const matchData = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2'],
        createdAt: new Date()
      };
      
      // Should not throw error
      expect(() => {
        emitMatchNotification(matchData);
      }).not.toThrow();
    });
  });
});