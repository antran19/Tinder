/**
 * Integration Test for Available Users Flow
 * 
 * Tests the complete flow: Create users → Make swipes → Check available users
 * Demonstrates Task 3.2 working with real swipe data
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

describe('Integration Test: Available Users with Swipes', () => {
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
  
  test('Complete flow: Create users, make swipes, check available users', async () => {
    // Step 1: Create 5 test users
    const users = [
      { userId: 'alice', firstName: 'Alice', birthday: '1990-01-01', gender: 'female' },
      { userId: 'bob', firstName: 'Bob', birthday: '1991-01-01', gender: 'male' },
      { userId: 'charlie', firstName: 'Charlie', birthday: '1992-01-01', gender: 'male' },
      { userId: 'diana', firstName: 'Diana', birthday: '1993-01-01', gender: 'female' },
      { userId: 'eve', firstName: 'Eve', birthday: '1994-01-01', gender: 'female' }
    ];
    
    for (const userData of users) {
      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);
    }
    
    // Step 2: Initially, Alice should see 4 available users (everyone except herself)
    let response = await request(app)
      .get('/api/users/available/alice')
      .expect(200);
    
    expect(response.body.data.users).toHaveLength(4);
    expect(response.body.data.users.every(u => u.userId !== 'alice')).toBe(true);
    expect(response.body.data.excludedCount).toBe(0); // No swipes yet
    
    // Step 3: Alice likes Bob
    await request(app)
      .post('/api/swipes')
      .send({
        fromUserId: 'alice',
        toUserId: 'bob',
        type: 'like'
      })
      .expect(201);
    
    // Step 4: Alice should now see 3 available users (Bob is excluded)
    response = await request(app)
      .get('/api/users/available/alice')
      .expect(200);
    
    expect(response.body.data.users).toHaveLength(3);
    expect(response.body.data.users.every(u => u.userId !== 'alice')).toBe(true);
    expect(response.body.data.users.every(u => u.userId !== 'bob')).toBe(true);
    expect(response.body.data.excludedCount).toBe(1); // Bob was swiped
    
    // Step 5: Alice passes Charlie
    await request(app)
      .post('/api/swipes')
      .send({
        fromUserId: 'alice',
        toUserId: 'charlie',
        type: 'pass'
      })
      .expect(201);
    
    // Step 6: Alice should now see 2 available users (Bob and Charlie are excluded)
    response = await request(app)
      .get('/api/users/available/alice')
      .expect(200);
    
    expect(response.body.data.users).toHaveLength(2);
    expect(response.body.data.users.every(u => u.userId !== 'alice')).toBe(true);
    expect(response.body.data.users.every(u => u.userId !== 'bob')).toBe(true);
    expect(response.body.data.users.every(u => u.userId !== 'charlie')).toBe(true);
    expect(response.body.data.excludedCount).toBe(2); // Bob and Charlie were swiped
    
    // Verify the remaining users are Diana and Eve
    const remainingUserIds = response.body.data.users.map(u => u.userId).sort();
    expect(remainingUserIds).toEqual(['diana', 'eve']);
    
    // Step 7: Alice likes Diana
    await request(app)
      .post('/api/swipes')
      .send({
        fromUserId: 'alice',
        toUserId: 'diana',
        type: 'like'
      })
      .expect(201);
    
    // Step 8: Alice should now see only 1 available user (Eve)
    response = await request(app)
      .get('/api/users/available/alice')
      .expect(200);
    
    expect(response.body.data.users).toHaveLength(1);
    expect(response.body.data.users[0].userId).toBe('eve');
    expect(response.body.data.excludedCount).toBe(3); // Bob, Charlie, Diana were swiped
    
    // Step 9: Alice passes Eve (last user)
    await request(app)
      .post('/api/swipes')
      .send({
        fromUserId: 'alice',
        toUserId: 'eve',
        type: 'pass'
      })
      .expect(201);
    
    // Step 10: Alice should now see no available users
    response = await request(app)
      .get('/api/users/available/alice')
      .expect(200);
    
    expect(response.body.data.users).toHaveLength(0);
    expect(response.body.data.excludedCount).toBe(4); // All other users were swiped
    
    // Step 11: Verify other users still see Alice as available (swipes are one-way)
    response = await request(app)
      .get('/api/users/available/bob')
      .expect(200);
    
    expect(response.body.data.users).toHaveLength(4); // Bob sees everyone except himself
    expect(response.body.data.users.some(u => u.userId === 'alice')).toBe(true);
    expect(response.body.data.excludedCount).toBe(0); // Bob hasn't swiped anyone
  });
  
  test('Mutual swipes: Both users should exclude each other after swiping', async () => {
    // Create 2 users
    await request(app)
      .post('/api/users')
      .send({ userId: 'user1', firstName: 'User 1', birthday: '1990-01-01', gender: 'male' })
      .expect(201);
    
    await request(app)
      .post('/api/users')
      .send({ userId: 'user2', firstName: 'User 2', birthday: '1991-01-01', gender: 'female' })
      .expect(201);
    
    // Initially both should see each other
    let response1 = await request(app)
      .get('/api/users/available/user1')
      .expect(200);
    
    let response2 = await request(app)
      .get('/api/users/available/user2')
      .expect(200);
    
    expect(response1.body.data.users).toHaveLength(1);
    expect(response1.body.data.users[0].userId).toBe('user2');
    expect(response2.body.data.users).toHaveLength(1);
    expect(response2.body.data.users[0].userId).toBe('user1');
    
    // User1 likes User2
    await request(app)
      .post('/api/swipes')
      .send({
        fromUserId: 'user1',
        toUserId: 'user2',
        type: 'like'
      })
      .expect(201);
    
    // User1 should no longer see User2
    response1 = await request(app)
      .get('/api/users/available/user1')
      .expect(200);
    
    expect(response1.body.data.users).toHaveLength(0);
    
    // User2 should still see User1 (hasn't swiped yet)
    response2 = await request(app)
      .get('/api/users/available/user2')
      .expect(200);
    
    expect(response2.body.data.users).toHaveLength(1);
    expect(response2.body.data.users[0].userId).toBe('user1');
    
    // User2 likes User1 back (creates match)
    const swipeResponse = await request(app)
      .post('/api/swipes')
      .send({
        fromUserId: 'user2',
        toUserId: 'user1',
        type: 'like'
      })
      .expect(201);
    
    // Verify match was created
    expect(swipeResponse.body.data.match).toBe(true);
    expect(swipeResponse.body.data.matchData).toBeDefined();
    
    // Now both users should see no available users
    response1 = await request(app)
      .get('/api/users/available/user1')
      .expect(200);
    
    response2 = await request(app)
      .get('/api/users/available/user2')
      .expect(200);
    
    expect(response1.body.data.users).toHaveLength(0);
    expect(response2.body.data.users).toHaveLength(0);
  });
});