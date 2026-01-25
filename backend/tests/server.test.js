/**
 * Server Tests - Dating App
 * 
 * Test các API endpoints cơ bản của Express server
 * Đảm bảo routes hoạt động đúng và error handling
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import app (cần tách app ra khỏi server start logic)
const express = require('express');
const cors = require('cors');
const { User, Swipe, Match } = require('../models');

// Import routes
const usersRoutes = require('../routes/users');
const swipesRoutes = require('../routes/swipes');
const matchesRoutes = require('../routes/matches');

// Import middleware
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

// Create test app
const createTestApp = () => {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  // Basic routes
  app.get('/', (req, res) => {
    res.json({
      message: 'Dating App Backend Server is running!',
      version: '1.0.0',
      status: 'active'
    });
  });
  
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });
  
  // API Routes
  app.use('/api/users', usersRoutes);
  app.use('/api/swipes', swipesRoutes);
  app.use('/api/matches', matchesRoutes);
  
  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
};

describe('Dating App Server Tests', () => {
  let mongoServer;
  let app;
  
  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    app = createTestApp();
  });
  
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});
    await Swipe.deleteMany({});
    await Match.deleteMany({});
  });
  
  describe('Basic Server Routes', () => {
    test('GET / - should return server info', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('status', 'active');
    });
    
    test('GET /health - should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
    
    test('GET /nonexistent - should return 404', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('Users API Routes', () => {
    test('GET /api/users - should return empty users list', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.users).toHaveLength(0);
    });
    
    test('POST /api/users - should create new user', async () => {
      const userData = {
        userId: 'test-user-1',
        firstName: 'Test User',
        birthday: '1990-01-01',
        gender: 'male'
      };
      
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user).toHaveProperty('userId', 'test-user-1');
    });
    
    test('GET /api/users/available/:userId - should return available users', async () => {
      // Create test users
      await User.create([
        { userId: 'user1', firstName: 'User 1', birthday: '1990-01-01', gender: 'male' },
        { userId: 'user2', firstName: 'User 2', birthday: '1991-01-01', gender: 'female' },
        { userId: 'user3', firstName: 'User 3', birthday: '1992-01-01', gender: 'male' }
      ]);
      
      const response = await request(app)
        .get('/api/users/available/user1')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.users).toHaveLength(2); // Exclude user1
      expect(response.body.data.users.every(u => u.userId !== 'user1')).toBe(true);
    });
  });
  
  describe('Swipes API Routes', () => {
    beforeEach(async () => {
      // Create test users
      await User.create([
        { userId: 'user1', firstName: 'User 1', birthday: '1990-01-01', gender: 'male' },
        { userId: 'user2', firstName: 'User 2', birthday: '1991-01-01', gender: 'female' }
      ]);
    });
    
    test('POST /api/swipes - should create swipe', async () => {
      const swipeData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        type: 'like'
      };
      
      const response = await request(app)
        .post('/api/swipes')
        .send(swipeData)
        .expect(201);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.swipe).toHaveProperty('fromUserId', 'user1');
      expect(response.body.data.swipe).toHaveProperty('toUserId', 'user2');
      expect(response.body.data.swipe).toHaveProperty('type', 'like');
    });
    
    test('POST /api/swipes - should create match on mutual like', async () => {
      // First swipe: user1 likes user2
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        })
        .expect(201);
      
      // Second swipe: user2 likes user1 (should create match)
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user2',
          toUserId: 'user1',
          type: 'like'
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('match', true);
      expect(response.body.data.matchData).toHaveProperty('participants');
      expect(response.body.data.matchData.participants).toContain('user1');
      expect(response.body.data.matchData.participants).toContain('user2');
    });
    
    test('GET /api/swipes/:userId - should return user swipes', async () => {
      // Create a swipe
      await Swipe.create({
        fromUserId: 'user1',
        toUserId: 'user2',
        type: 'like'
      });
      
      const response = await request(app)
        .get('/api/swipes/user1')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.swipes).toHaveLength(1);
    });
  });
  
  describe('Matches API Routes', () => {
    beforeEach(async () => {
      // Create test users and match
      await User.create([
        { userId: 'user1', firstName: 'User 1', birthday: '1990-01-01', gender: 'male' },
        { userId: 'user2', firstName: 'User 2', birthday: '1991-01-01', gender: 'female' }
      ]);
      
      await Match.create({
        participants: ['user1', 'user2'],
        status: 'active'
      });
    });
    
    test('GET /api/matches/:userId - should return user matches', async () => {
      const response = await request(app)
        .get('/api/matches/user1')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.matches).toHaveLength(1);
      expect(response.body.data.matches[0].participants).toContain('user1');
      expect(response.body.data.matches[0].participants).toContain('user2');
    });
    
    test('GET /api/matches - should return all matches', async () => {
      const response = await request(app)
        .get('/api/matches')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.matches).toHaveLength(1);
    });
  });
  
  describe('Error Handling', () => {
    test('POST /api/swipes - should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          // Missing toUserId and type
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
    
    test('GET /api/users/nonexistent - should handle not found', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent')
        .expect(404);
      
      expect(response.body).toHaveProperty('success', false);
    });
  });
});