/**
 * Edge Cases Tests for Swipes API
 * 
 * Tests additional edge cases and validation scenarios for the POST /api/swipes endpoint
 * Ensures Requirements 2.1, 2.2, 2.3 are fully satisfied
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');
const { User, Swipe, Match } = require('../models');
const swipesRoutes = require('../routes/swipes');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

// Create test app
const createTestApp = () => {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // API Routes
  app.use('/api/swipes', swipesRoutes);
  
  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
};

describe('Swipes API - Edge Cases and Validation', () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to test database
    await mongoose.connect(mongoUri);
    
    // Create test app
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
    
    // Create test users
    await User.create([
      { 
        userId: 'user1', 
        firstName: 'Alice', 
        gender: 'female',
        birthday: new Date('1995-01-01')
      },
      { 
        userId: 'user2', 
        firstName: 'Bob', 
        gender: 'male',
        birthday: new Date('1993-05-15')
      }
    ]);
  });

  describe('Input Validation - Requirements 2.1, 2.2, 2.3', () => {
    test('should reject request with missing fromUserId', async () => {
      const response = await request(app)
        .post('/api/swipes')
        .send({
          toUserId: 'user2',
          type: 'like'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('bắt buộc');
    });

    test('should reject request with missing toUserId', async () => {
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          type: 'like'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('bắt buộc');
    });

    test('should reject request with missing type', async () => {
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('bắt buộc');
    });

    test('should reject invalid swipe type', async () => {
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'invalid'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('like');
      expect(response.body.message).toContain('pass');
    });

    test('should reject self-swipe', async () => {
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user1',
          type: 'like'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('chính mình');
    });

    test('should reject swipe to non-existent user', async () => {
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'nonexistent',
          type: 'like'
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('không tồn tại');
    });

    test('should reject swipe from non-existent user', async () => {
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'nonexistent',
          toUserId: 'user2',
          type: 'like'
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('không tồn tại');
    });
  });

  describe('Duplicate Swipe Handling', () => {
    test('should prevent duplicate swipes', async () => {
      // First swipe
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        })
        .expect(201);

      // Duplicate swipe
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'pass'  // Even different type should be rejected
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Đã swipe');
      expect(response.body.data).toHaveProperty('existingSwipe');
    });
  });

  describe('Timestamp Validation - Requirement 2.3', () => {
    test('should save swipe with proper timestamp', async () => {
      const beforeSwipe = new Date();
      
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        })
        .expect(201);

      const afterSwipe = new Date();
      
      expect(response.body.data.swipe).toHaveProperty('createdAt');
      
      const swipeTime = new Date(response.body.data.swipe.createdAt);
      expect(swipeTime.getTime()).toBeGreaterThanOrEqual(beforeSwipe.getTime());
      expect(swipeTime.getTime()).toBeLessThanOrEqual(afterSwipe.getTime());
    });

    test('should save all required fields - Requirements 2.1, 2.2, 2.3', async () => {
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'pass'
        })
        .expect(201);

      const swipe = response.body.data.swipe;
      
      // Verify all required fields are present
      expect(swipe).toHaveProperty('fromUserId', 'user1');
      expect(swipe).toHaveProperty('toUserId', 'user2');
      expect(swipe).toHaveProperty('type', 'pass');
      expect(swipe).toHaveProperty('createdAt');
      expect(swipe).toHaveProperty('_id');
    });
  });

  describe('Match Creation Logic', () => {
    test('should create match only when both users like each other', async () => {
      // User1 likes User2
      const response1 = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        })
        .expect(201);

      expect(response1.body.data).toHaveProperty('match', false);

      // User2 likes User1 - should create match
      const response2 = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user2',
          toUserId: 'user1',
          type: 'like'
        })
        .expect(201);

      expect(response2.body.data).toHaveProperty('match', true);
      expect(response2.body.data).toHaveProperty('matchData');
      expect(response2.body.data.matchData.participants).toContain('user1');
      expect(response2.body.data.matchData.participants).toContain('user2');
    });

    test('should not create match if one user passes', async () => {
      // User1 passes User2
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'pass'
        })
        .expect(201);

      // User2 likes User1 - should not create match
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user2',
          toUserId: 'user1',
          type: 'like'
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('match', false);
    });

    test('should handle existing match gracefully', async () => {
      // Create initial mutual likes and match
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        });

      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user2',
          toUserId: 'user1',
          type: 'like'
        });

      // Verify match exists
      const matchCount = await Match.countDocuments({
        participants: { $all: ['user1', 'user2'] }
      });
      expect(matchCount).toBe(1);
    });
  });

  describe('Response Format Validation', () => {
    test('should return proper success response format', async () => {
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('swipe');
      expect(response.body.data).toHaveProperty('match');
    });

    test('should return proper error response format', async () => {
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'invalid'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });
});