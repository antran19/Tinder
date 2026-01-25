/**
 * Available Users Endpoint Test
 * 
 * Test specifically for Task 3.2: GET /api/users/available/:userId
 * Validates that the endpoint correctly excludes current user and swiped users
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import app components
const express = require('express');
const cors = require('cors');
const { User, Swipe } = require('../models');
const usersRoutes = require('../routes/users');
const swipesRoutes = require('../routes/swipes');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

// Create test app
const createTestApp = () => {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  // API Routes
  app.use('/api/users', usersRoutes);
  app.use('/api/swipes', swipesRoutes);
  
  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
};

describe('Available Users Endpoint Tests', () => {
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
  });
  
  describe('GET /api/users/available/:userId', () => {
    test('Should exclude current user from available users list', async () => {
      // Create test users
      await User.create([
        { userId: 'user1', firstName: 'User 1', birthday: '1990-01-01', gender: 'male' },
        { userId: 'user2', firstName: 'User 2', birthday: '1991-01-01', gender: 'female' },
        { userId: 'user3', firstName: 'User 3', birthday: '1992-01-01', gender: 'male' }
      ]);
      
      const response = await request(app)
        .get('/api/users/available/user1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.users.every(u => u.userId !== 'user1')).toBe(true);
      expect(response.body.data.requestedBy).toBe('user1');
    });
    
    test('Should exclude users that have been swiped (liked)', async () => {
      // Create test users
      await User.create([
        { userId: 'user1', firstName: 'User 1', birthday: '1990-01-01', gender: 'male' },
        { userId: 'user2', firstName: 'User 2', birthday: '1991-01-01', gender: 'female' },
        { userId: 'user3', firstName: 'User 3', birthday: '1992-01-01', gender: 'male' },
        { userId: 'user4', firstName: 'User 4', birthday: '1993-01-01', gender: 'female' }
      ]);
      
      // User1 likes user2
      await Swipe.create({
        fromUserId: 'user1',
        toUserId: 'user2',
        type: 'like'
      });
      
      const response = await request(app)
        .get('/api/users/available/user1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2); // user3 and user4
      expect(response.body.data.users.every(u => u.userId !== 'user1')).toBe(true);
      expect(response.body.data.users.every(u => u.userId !== 'user2')).toBe(true);
      expect(response.body.data.excludedCount).toBe(1); // Only user2 was swiped
    });
    
    test('Should exclude users that have been swiped (passed)', async () => {
      // Create test users
      await User.create([
        { userId: 'user1', firstName: 'User 1', birthday: '1990-01-01', gender: 'male' },
        { userId: 'user2', firstName: 'User 2', birthday: '1991-01-01', gender: 'female' },
        { userId: 'user3', firstName: 'User 3', birthday: '1992-01-01', gender: 'male' }
      ]);
      
      // User1 passes user2
      await Swipe.create({
        fromUserId: 'user1',
        toUserId: 'user2',
        type: 'pass'
      });
      
      const response = await request(app)
        .get('/api/users/available/user1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1); // Only user3
      expect(response.body.data.users[0].userId).toBe('user3');
      expect(response.body.data.excludedCount).toBe(1); // Only user2 was swiped
    });
    
    test('Should exclude multiple swiped users (both like and pass)', async () => {
      // Create test users
      await User.create([
        { userId: 'user1', firstName: 'User 1', birthday: '1990-01-01', gender: 'male' },
        { userId: 'user2', firstName: 'User 2', birthday: '1991-01-01', gender: 'female' },
        { userId: 'user3', firstName: 'User 3', birthday: '1992-01-01', gender: 'male' },
        { userId: 'user4', firstName: 'User 4', birthday: '1993-01-01', gender: 'female' },
        { userId: 'user5', firstName: 'User 5', birthday: '1994-01-01', gender: 'male' }
      ]);
      
      // User1 swipes multiple users
      await Swipe.create([
        { fromUserId: 'user1', toUserId: 'user2', type: 'like' },
        { fromUserId: 'user1', toUserId: 'user3', type: 'pass' },
        { fromUserId: 'user1', toUserId: 'user4', type: 'like' }
      ]);
      
      const response = await request(app)
        .get('/api/users/available/user1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1); // Only user5
      expect(response.body.data.users[0].userId).toBe('user5');
      expect(response.body.data.excludedCount).toBe(3); // user2, user3, user4 were swiped
    });
    
    test('Should return all users when no swipes have been made', async () => {
      // Create test users
      await User.create([
        { userId: 'user1', firstName: 'User 1', birthday: '1990-01-01', gender: 'male' },
        { userId: 'user2', firstName: 'User 2', birthday: '1991-01-01', gender: 'female' },
        { userId: 'user3', firstName: 'User 3', birthday: '1992-01-01', gender: 'male' }
      ]);
      
      const response = await request(app)
        .get('/api/users/available/user1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2); // user2 and user3
      expect(response.body.data.users.every(u => u.userId !== 'user1')).toBe(true);
      expect(response.body.data.excludedCount).toBe(0); // No swipes made
    });
    
    test('Should return empty list when all users have been swiped', async () => {
      // Create test users
      await User.create([
        { userId: 'user1', firstName: 'User 1', birthday: '1990-01-01', gender: 'male' },
        { userId: 'user2', firstName: 'User 2', birthday: '1991-01-01', gender: 'female' },
        { userId: 'user3', firstName: 'User 3', birthday: '1992-01-01', gender: 'male' }
      ]);
      
      // User1 swipes all other users
      await Swipe.create([
        { fromUserId: 'user1', toUserId: 'user2', type: 'like' },
        { fromUserId: 'user1', toUserId: 'user3', type: 'pass' }
      ]);
      
      const response = await request(app)
        .get('/api/users/available/user1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(0);
      expect(response.body.data.excludedCount).toBe(2); // user2 and user3 were swiped
    });
    
    test('Should handle invalid userId parameter', async () => {
      const response = await request(app)
        .get('/api/users/available/')
        .expect(404); // Route not found
    });
    
    test('Should handle empty userId parameter', async () => {
      const response = await request(app)
        .get('/api/users/available/%20') // URL encoded space
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('UserId là bắt buộc');
    });
    
    test('Should return correct response structure', async () => {
      // Create test users
      await User.create([
        { userId: 'user1', firstName: 'User 1', birthday: '1990-01-01', gender: 'male' },
        { userId: 'user2', firstName: 'User 2', birthday: '1991-01-01', gender: 'female' }
      ]);
      
      const response = await request(app)
        .get('/api/users/available/user1')
        .expect(200);
      
      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('excludedCount');
      expect(response.body.data).toHaveProperty('requestedBy');
      
      // Verify user object structure
      if (response.body.data.users.length > 0) {
        const user = response.body.data.users[0];
        expect(user).toHaveProperty('userId');
        expect(user).toHaveProperty('firstName');
        expect(user).toHaveProperty('birthday');
        expect(user).toHaveProperty('gender');
        expect(user).toHaveProperty('isOnline');
        expect(user).toHaveProperty('createdAt');
      }
    });
  });
});