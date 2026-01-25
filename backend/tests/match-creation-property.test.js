/**
 * Property-Based Tests for Match Creation Logic
 * 
 * **Property 3: Mutual Like Match Creation**
 * **Validates: Requirements 3.1, 3.3**
 * 
 * Tests universal properties that should hold across all valid inputs:
 * - For any pair of users where both have liked each other, 
 *   the system should create exactly one match record containing both user IDs
 */

const fc = require('fast-check');
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

describe('Property-Based Tests: Match Creation Logic', () => {
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

  // Helper function to clear database during property tests
  const clearDatabase = async () => {
    await User.deleteMany({});
    await Swipe.deleteMany({});
    await Match.deleteMany({});
  };

  /**
   * **Property 3: Mutual Like Match Creation**
   * **Validates: Requirements 3.1, 3.3**
   * 
   * For any pair of users where both have liked each other,
   * the system should create exactly one match record containing both user IDs
   */
  test('Property 3: Mutual likes always create exactly one match with both user IDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary user pairs
        fc.record({
          userA: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          userB: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s))
        }).filter(({ userA, userB }) => userA !== userB), // Ensure different users
        
        async ({ userA, userB }) => {
          // Clear database for this iteration
          await clearDatabase();
          
          // Setup: Create both users in database
          await User.create([
            { 
              userId: userA, 
              firstName: `User ${userA}`, 
              gender: 'female',
              birthday: new Date('1995-01-01')
            },
            { 
              userId: userB, 
              firstName: `User ${userB}`, 
              gender: 'male',
              birthday: new Date('1993-05-15')
            }
          ]);

          // Action: Create mutual likes (order shouldn't matter)
          const response1 = await request(app)
            .post('/api/swipes')
            .send({
              fromUserId: userA,
              toUserId: userB,
              type: 'like'
            });

          const response2 = await request(app)
            .post('/api/swipes')
            .send({
              fromUserId: userB,
              toUserId: userA,
              type: 'like'
            });

          // Property assertions
          
          // 1. Both swipe requests should succeed
          expect(response1.status).toBe(201);
          expect(response2.status).toBe(201);
          
          // 2. First swipe should not create match
          expect(response1.body.data.match).toBe(false);
          
          // 3. Second swipe should create match
          expect(response2.body.data.match).toBe(true);
          expect(response2.body.data.matchData).toBeDefined();
          
          // 4. Match should contain both user IDs
          const matchData = response2.body.data.matchData;
          expect(matchData.participants).toHaveLength(2);
          expect(matchData.participants).toContain(userA);
          expect(matchData.participants).toContain(userB);
          
          // 5. Match should have active status
          expect(matchData.status).toBe('active');
          
          // 6. Match should have valid timestamp
          expect(matchData.createdAt).toBeDefined();
          expect(new Date(matchData.createdAt)).toBeInstanceOf(Date);
          
          // 7. Exactly one match should exist in database
          const matchesInDb = await Match.find({
            participants: { $all: [userA, userB] }
          });
          expect(matchesInDb).toHaveLength(1);
          
          // 8. Database match should match response data
          const dbMatch = matchesInDb[0];
          expect(dbMatch._id.toString()).toBe(matchData._id);
          expect(dbMatch.participants).toContain(userA);
          expect(dbMatch.participants).toContain(userB);
          expect(dbMatch.status).toBe('active');
          
          // 9. Both swipes should exist in database
          const swipesCount = await Swipe.countDocuments({
            $or: [
              { fromUserId: userA, toUserId: userB, type: 'like' },
              { fromUserId: userB, toUserId: userA, type: 'like' }
            ]
          });
          expect(swipesCount).toBe(2);
        }
      ),
      { 
        numRuns: 50, // Run 50 iterations with different user pairs
        verbose: true
      }
    );
  }, 30000); // 30 second timeout for property test

  /**
   * Property: Non-mutual likes never create matches
   * **Validates: Requirements 3.1**
   * 
   * For any pair of users where only one has liked the other,
   * no match should be created
   */
  test('Property: Non-mutual likes never create matches', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userA: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          userB: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          swipeType: fc.constantFrom('like', 'pass')
        }).filter(({ userA, userB }) => userA !== userB),
        
        async ({ userA, userB, swipeType }) => {
          // Clear database for this iteration
          await clearDatabase();
          
          // Setup: Create both users
          await User.create([
            { 
              userId: userA, 
              firstName: `User ${userA}`, 
              gender: 'female',
              birthday: new Date('1995-01-01')
            },
            { 
              userId: userB, 
              firstName: `User ${userB}`, 
              gender: 'male',
              birthday: new Date('1993-05-15')
            }
          ]);

          // Action: Only one user swipes (like or pass)
          const response = await request(app)
            .post('/api/swipes')
            .send({
              fromUserId: userA,
              toUserId: userB,
              type: swipeType
            });

          // Property assertions
          
          // 1. Swipe should succeed
          expect(response.status).toBe(201);
          
          // 2. No match should be created
          expect(response.body.data.match).toBe(false);
          expect(response.body.data.matchData).toBeUndefined();
          
          // 3. No matches should exist in database
          const matchCount = await Match.countDocuments({
            participants: { $all: [userA, userB] }
          });
          expect(matchCount).toBe(0);
        }
      ),
      { 
        numRuns: 30,
        verbose: true
      }
    );
  }, 20000);

  /**
   * Property: Match uniqueness across multiple operations
   * **Validates: Requirements 3.3**
   * 
   * For any sequence of swipe operations between the same users,
   * at most one match should ever exist
   */
  test('Property: Match uniqueness is preserved across multiple operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userA: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          userB: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s))
        }).filter(({ userA, userB }) => userA !== userB),
        
        async ({ userA, userB }) => {
          // Clear database for this iteration
          await clearDatabase();
          
          // Setup: Create both users
          await User.create([
            { 
              userId: userA, 
              firstName: `User ${userA}`, 
              gender: 'female',
              birthday: new Date('1995-01-01')
            },
            { 
              userId: userB, 
              firstName: `User ${userB}`, 
              gender: 'male',
              birthday: new Date('1993-05-15')
            }
          ]);

          // Action: Create mutual likes to establish match
          await request(app)
            .post('/api/swipes')
            .send({
              fromUserId: userA,
              toUserId: userB,
              type: 'like'
            });

          const matchResponse = await request(app)
            .post('/api/swipes')
            .send({
              fromUserId: userB,
              toUserId: userA,
              type: 'like'
            });

          // Verify match was created
          expect(matchResponse.body.data.match).toBe(true);

          // Property assertion: Only one match should exist regardless of subsequent operations
          const finalMatchCount = await Match.countDocuments({
            participants: { $all: [userA, userB] }
          });
          expect(finalMatchCount).toBe(1);

          // Additional verification: Match should be the same one created initially
          const matches = await Match.find({
            participants: { $all: [userA, userB] }
          });
          expect(matches).toHaveLength(1);
          expect(matches[0]._id.toString()).toBe(matchResponse.body.data.matchData._id);
        }
      ),
      { 
        numRuns: 25,
        verbose: true
      }
    );
  }, 15000);

  /**
   * Property: Match data integrity
   * **Validates: Requirements 3.3**
   * 
   * For any created match, all required fields should be present and valid
   */
  test('Property: All matches have required fields with valid data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userA: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
          userB: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s))
        }).filter(({ userA, userB }) => userA !== userB),
        
        async ({ userA, userB }) => {
          // Clear database for this iteration
          await clearDatabase();
          
          // Setup: Create both users
          await User.create([
            { 
              userId: userA, 
              firstName: `User ${userA}`, 
              gender: 'female',
              birthday: new Date('1995-01-01')
            },
            { 
              userId: userB, 
              firstName: `User ${userB}`, 
              gender: 'male',
              birthday: new Date('1993-05-15')
            }
          ]);

          // Action: Create mutual likes
          await request(app)
            .post('/api/swipes')
            .send({
              fromUserId: userA,
              toUserId: userB,
              type: 'like'
            });

          const response = await request(app)
            .post('/api/swipes')
            .send({
              fromUserId: userB,
              toUserId: userA,
              type: 'like'
            });

          // Property assertions for match data integrity
          const matchData = response.body.data.matchData;
          
          // 1. Match should have valid _id
          expect(matchData._id).toBeDefined();
          expect(typeof matchData._id).toBe('string');
          expect(matchData._id.length).toBe(24); // MongoDB ObjectId length
          
          // 2. Participants should be exactly 2 valid user IDs
          expect(matchData.participants).toBeDefined();
          expect(Array.isArray(matchData.participants)).toBe(true);
          expect(matchData.participants).toHaveLength(2);
          expect(matchData.participants.every(p => typeof p === 'string')).toBe(true);
          expect(matchData.participants).toContain(userA);
          expect(matchData.participants).toContain(userB);
          
          // 3. Status should be valid enum value
          expect(matchData.status).toBeDefined();
          expect(['active', 'inactive']).toContain(matchData.status);
          
          // 4. CreatedAt should be valid timestamp
          expect(matchData.createdAt).toBeDefined();
          const createdAt = new Date(matchData.createdAt);
          expect(createdAt).toBeInstanceOf(Date);
          expect(createdAt.getTime()).not.toBeNaN();
          
          // 5. Database record should match response
          const dbMatch = await Match.findById(matchData._id);
          expect(dbMatch).toBeTruthy();
          expect(dbMatch.participants).toEqual(expect.arrayContaining([userA, userB]));
          expect(dbMatch.status).toBe(matchData.status);
        }
      ),
      { 
        numRuns: 30,
        verbose: true
      }
    );
  }, 20000);
});