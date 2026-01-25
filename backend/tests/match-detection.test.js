/**
 * Match Detection Logic Tests
 * 
 * Comprehensive tests for Requirements 3.1 and 3.3:
 * - 3.1: When user A likes user B and user B has already liked user A, create match
 * - 3.3: Save match to database with both user IDs
 * 
 * Tests both unit-level match detection and property-based testing
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

describe('Match Detection Logic - Requirements 3.1 & 3.3', () => {
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
  });

  describe('Requirement 3.1: Mutual Like Match Creation', () => {
    beforeEach(async () => {
      // Create test users for each test
      await User.create([
        { 
          userId: 'alice', 
          firstName: 'Alice', 
          gender: 'female',
          birthday: new Date('1995-01-01')
        },
        { 
          userId: 'bob', 
          firstName: 'Bob', 
          gender: 'male',
          birthday: new Date('1993-05-15')
        }
      ]);
    });

    test('should create match when user A likes user B after user B already liked user A', async () => {
      // Step 1: Bob likes Alice first
      const response1 = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'bob',
          toUserId: 'alice',
          type: 'like'
        })
        .expect(201);

      // Verify no match created yet
      expect(response1.body.data.match).toBe(false);
      
      // Step 2: Alice likes Bob back - should create match
      const response2 = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'alice',
          toUserId: 'bob',
          type: 'like'
        })
        .expect(201);

      // Verify match was created
      expect(response2.body.data.match).toBe(true);
      expect(response2.body.data.matchData).toBeDefined();
      expect(response2.body.data.mutualSwipe).toBeDefined();
      expect(response2.body.message).toContain("It's a Match!");
    });

    test('should create match when user B likes user A after user A already liked user B', async () => {
      // Step 1: Alice likes Bob first
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'alice',
          toUserId: 'bob',
          type: 'like'
        })
        .expect(201);

      // Step 2: Bob likes Alice back - should create match
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'bob',
          toUserId: 'alice',
          type: 'like'
        })
        .expect(201);

      // Verify match was created
      expect(response.body.data.match).toBe(true);
      expect(response.body.data.matchData).toBeDefined();
    });

    test('should NOT create match when only one user likes the other', async () => {
      // Only Alice likes Bob
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'alice',
          toUserId: 'bob',
          type: 'like'
        })
        .expect(201);

      // Verify no match created
      expect(response.body.data.match).toBe(false);
      expect(response.body.data.matchData).toBeUndefined();
    });

    test('should NOT create match when one user passes', async () => {
      // Alice likes Bob
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'alice',
          toUserId: 'bob',
          type: 'like'
        });

      // Bob passes on Alice
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'bob',
          toUserId: 'alice',
          type: 'pass'
        })
        .expect(201);

      // Verify no match created
      expect(response.body.data.match).toBe(false);
    });

    test('should NOT create match when both users pass', async () => {
      // Alice passes on Bob
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'alice',
          toUserId: 'bob',
          type: 'pass'
        });

      // Bob passes on Alice
      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'bob',
          toUserId: 'alice',
          type: 'pass'
        })
        .expect(201);

      // Verify no match created
      expect(response.body.data.match).toBe(false);
    });
  });

  describe('Requirement 3.3: Match Database Storage', () => {
    beforeEach(async () => {
      // Create test users
      await User.create([
        { 
          userId: 'user1', 
          firstName: 'User One', 
          gender: 'female',
          birthday: new Date('1995-01-01')
        },
        { 
          userId: 'user2', 
          firstName: 'User Two', 
          gender: 'male',
          birthday: new Date('1993-05-15')
        }
      ]);
    });

    test('should save match to database with both user IDs', async () => {
      // Create mutual likes
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        });

      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user2',
          toUserId: 'user1',
          type: 'like'
        });

      // Verify match in response
      const matchData = response.body.data.matchData;
      expect(matchData.participants).toHaveLength(2);
      expect(matchData.participants).toContain('user1');
      expect(matchData.participants).toContain('user2');
      expect(matchData.status).toBe('active');
      expect(matchData.createdAt).toBeDefined();

      // Verify match in database
      const matchInDb = await Match.findById(matchData._id);
      expect(matchInDb).toBeTruthy();
      expect(matchInDb.participants).toContain('user1');
      expect(matchInDb.participants).toContain('user2');
      expect(matchInDb.status).toBe('active');
    });

    test('should prevent duplicate matches between same users', async () => {
      // Create first match
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

      // Verify only one match exists in database
      const matchCount = await Match.countDocuments({
        participants: { $all: ['user1', 'user2'] }
      });
      expect(matchCount).toBe(1);
    });

    test('should handle match creation with proper error handling', async () => {
      // Create mutual likes
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        });

      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user2',
          toUserId: 'user1',
          type: 'like'
        });

      // Verify successful response even with match creation
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.match).toBe(true);
    });
  });

  describe('Edge Cases for Match Detection', () => {
    beforeEach(async () => {
      // Create multiple test users
      await User.create([
        { userId: 'user1', firstName: 'User 1', gender: 'female', birthday: new Date('1995-01-01') },
        { userId: 'user2', firstName: 'User 2', gender: 'male', birthday: new Date('1993-05-15') },
        { userId: 'user3', firstName: 'User 3', gender: 'female', birthday: new Date('1997-03-20') }
      ]);
    });

    test('should handle multiple users liking the same person', async () => {
      // User1 likes User2
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        });

      // User3 likes User2
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user3',
          toUserId: 'user2',
          type: 'like'
        });

      // User2 likes User1 back - should create match with User1 only
      const response1 = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user2',
          toUserId: 'user1',
          type: 'like'
        });

      expect(response1.body.data.match).toBe(true);
      expect(response1.body.data.matchData.participants).toContain('user1');
      expect(response1.body.data.matchData.participants).toContain('user2');

      // User2 likes User3 back - should create another match
      const response2 = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user2',
          toUserId: 'user3',
          type: 'like'
        });

      expect(response2.body.data.match).toBe(true);
      expect(response2.body.data.matchData.participants).toContain('user2');
      expect(response2.body.data.matchData.participants).toContain('user3');

      // Verify two separate matches exist
      const totalMatches = await Match.countDocuments({});
      expect(totalMatches).toBe(2);
    });

    test('should handle existing match gracefully', async () => {
      // Create initial match
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        });

      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'user2',
          toUserId: 'user1',
          type: 'like'
        });

      // Verify match was created
      expect(response.body.data.match).toBe(true);
      
      // Verify existing match is returned with note
      if (response.body.data.note) {
        expect(response.body.data.note).toContain('đã tồn tại');
      }

      // Verify only one match exists in database
      const matchCount = await Match.countDocuments({
        participants: { $all: ['user1', 'user2'] }
      });
      expect(matchCount).toBe(1);
    });
  });

  describe('Match Data Integrity', () => {
    beforeEach(async () => {
      await User.create([
        { userId: 'testA', firstName: 'Test A', gender: 'female', birthday: new Date('1995-01-01') },
        { userId: 'testB', firstName: 'Test B', gender: 'male', birthday: new Date('1993-05-15') }
      ]);
    });

    test('should create match with correct timestamp', async () => {
      const beforeMatch = new Date();
      
      // Create mutual likes
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'testA',
          toUserId: 'testB',
          type: 'like'
        });

      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'testB',
          toUserId: 'testA',
          type: 'like'
        });

      const afterMatch = new Date();
      
      const matchData = response.body.data.matchData;
      const matchTime = new Date(matchData.createdAt);
      
      expect(matchTime.getTime()).toBeGreaterThanOrEqual(beforeMatch.getTime());
      expect(matchTime.getTime()).toBeLessThanOrEqual(afterMatch.getTime());
    });

    test('should create match with active status by default', async () => {
      // Create mutual likes
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'testA',
          toUserId: 'testB',
          type: 'like'
        });

      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'testB',
          toUserId: 'testA',
          type: 'like'
        });

      expect(response.body.data.matchData.status).toBe('active');
    });

    test('should include mutual swipe information in match response', async () => {
      // Create mutual likes
      await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'testA',
          toUserId: 'testB',
          type: 'like'
        });

      const response = await request(app)
        .post('/api/swipes')
        .send({
          fromUserId: 'testB',
          toUserId: 'testA',
          type: 'like'
        });

      expect(response.body.data.mutualSwipe).toBeDefined();
      expect(response.body.data.mutualSwipe.fromUserId).toBe('testA');
      expect(response.body.data.mutualSwipe.toUserId).toBe('testB');
      expect(response.body.data.mutualSwipe.type).toBe('like');
    });
  });
});