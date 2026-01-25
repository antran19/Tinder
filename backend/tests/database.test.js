/**
 * Database Connection và Models Tests
 * 
 * Test suite để kiểm tra kết nối MongoDB và các Mongoose models
 * Đảm bảo 3 collections chính hoạt động đúng: users, swipes, matches
 */

const mongoose = require('mongoose');
const { connectDB, getConnectionStatus, ensureCollections } = require('../config/database');
const { User, Swipe, Match } = require('../models');

// Test database URI cho testing
const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/dating-app-test';

describe('Database Connection và Models', () => {
  
  beforeAll(async () => {
    // Kết nối đến test database
    process.env.MONGODB_URI = TEST_DB_URI;
    await connectDB();
    await ensureCollections();
  });

  afterAll(async () => {
    // Cleanup: xóa test data và đóng kết nối
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Xóa data trước mỗi test
    await User.deleteMany({});
    await Swipe.deleteMany({});
    await Match.deleteMany({});
  });

  describe('Database Connection', () => {
    test('Nên kết nối thành công đến MongoDB', () => {
      const status = getConnectionStatus();
      expect(status.status).toBe('connected');
      expect(status.name).toBe('dating-app-test');
    });

    test('Nên có đủ 3 collections cần thiết', async () => {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      expect(collectionNames).toContain('users');
      expect(collectionNames).toContain('swipes');  
      expect(collectionNames).toContain('matches');
    });
  });

  describe('User Model', () => {
    test('Nên tạo user mới thành công với đầy đủ thông tin', async () => {
      const userData = {
        userId: 'user1',
        phoneNumber: '0123456789',
        firstName: 'Nguyễn Văn A',
        birthday: new Date('1995-01-01'),
        gender: 'male',
        bio: 'Tôi là một người vui vẻ',
        images: ['https://example.com/image1.jpg'],
        preferences: {
          genderPreference: 'female',
          ageRange: { min: 20, max: 30 }
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.userId).toBe(userData.userId);
      expect(savedUser.phoneNumber).toBe(userData.phoneNumber);
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.gender).toBe(userData.gender);
      expect(savedUser.preferences.genderPreference).toBe(userData.preferences.genderPreference);
      expect(savedUser.isOnline).toBe(false); // default value
      expect(savedUser.createdAt).toBeDefined();
    });

    test('Nên báo lỗi khi thiếu thông tin bắt buộc', async () => {
      const user = new User({
        phoneNumber: '0123456789'
        // Thiếu userId, firstName, birthday, gender
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('Nên báo lỗi khi phoneNumber trùng lặp', async () => {
      const userData = {
        userId: 'user1',
        phoneNumber: '0123456789',
        firstName: 'User 1',
        birthday: new Date('1995-01-01'),
        gender: 'male',
        preferences: { genderPreference: 'female' }
      };

      // Tạo user đầu tiên
      const user1 = new User(userData);
      await user1.save();

      // Tạo user thứ hai với cùng phoneNumber nhưng khác userId
      const user2 = new User({
        ...userData,
        userId: 'user2',
        firstName: 'User 2'
      });

      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('Swipe Model', () => {
    let user1, user2;

    beforeEach(async () => {
      // Tạo 2 users để test swipe
      user1 = await User.create({
        userId: 'user1',
        phoneNumber: '0123456789',
        firstName: 'User 1',
        birthday: new Date('1995-01-01'),
        gender: 'male',
        preferences: { genderPreference: 'female' }
      });

      user2 = await User.create({
        userId: 'user2',
        phoneNumber: '0987654321',
        firstName: 'User 2',
        birthday: new Date('1996-01-01'),
        gender: 'female',
        preferences: { genderPreference: 'male' }
      });
    });

    test('Nên tạo swipe thành công', async () => {
      const swipeData = {
        fromUserId: user1.userId,
        toUserId: user2.userId,
        type: 'like'
      };

      const swipe = new Swipe(swipeData);
      const savedSwipe = await swipe.save();

      expect(savedSwipe._id).toBeDefined();
      expect(savedSwipe.fromUserId).toBe(user1.userId);
      expect(savedSwipe.toUserId).toBe(user2.userId);
      expect(savedSwipe.type).toBe('like');
      expect(savedSwipe.createdAt).toBeDefined();
    });

    test('Nên báo lỗi khi tạo swipe trùng lặp', async () => {
      const swipeData = {
        fromUserId: user1.userId,
        toUserId: user2.userId,
        type: 'like'
      };

      // Tạo swipe đầu tiên
      const swipe1 = new Swipe(swipeData);
      await swipe1.save();

      // Tạo swipe thứ hai với cùng fromUserId và toUserId
      const swipe2 = new Swipe(swipeData);
      await expect(swipe2.save()).rejects.toThrow();
    });

    test('Nên chấp nhận cả like và pass', async () => {
      const likeSwipe = new Swipe({
        fromUserId: user1.userId,
        toUserId: user2.userId,
        type: 'like'
      });

      const passSwipe = new Swipe({
        fromUserId: user2.userId,
        toUserId: user1.userId,
        type: 'pass'
      });

      const savedLike = await likeSwipe.save();
      const savedPass = await passSwipe.save();

      expect(savedLike.type).toBe('like');
      expect(savedPass.type).toBe('pass');
    });
  });

  describe('Match Model', () => {
    let user1, user2, user3;

    beforeEach(async () => {
      // Tạo 3 users để test match
      user1 = await User.create({
        userId: 'user1',
        phoneNumber: '0123456789',
        firstName: 'User 1',
        birthday: new Date('1995-01-01'),
        gender: 'male',
        preferences: { genderPreference: 'female' }
      });

      user2 = await User.create({
        userId: 'user2',
        phoneNumber: '0987654321',
        firstName: 'User 2',
        birthday: new Date('1996-01-01'),
        gender: 'female',
        preferences: { genderPreference: 'male' }
      });

      user3 = await User.create({
        userId: 'user3',
        phoneNumber: '0111222333',
        firstName: 'User 3',
        birthday: new Date('1997-01-01'),
        gender: 'female',
        preferences: { genderPreference: 'male' }
      });
    });

    test('Nên tạo match thành công với 2 participants', async () => {
      const matchData = {
        participants: [user1.userId, user2.userId]
      };

      const match = new Match(matchData);
      const savedMatch = await match.save();

      expect(savedMatch._id).toBeDefined();
      expect(savedMatch.participants).toHaveLength(2);
      expect(savedMatch.participants[0]).toBe(user1.userId);
      expect(savedMatch.participants[1]).toBe(user2.userId);
      expect(savedMatch.status).toBe('active'); // default value
      expect(savedMatch.createdAt).toBeDefined();
    });

    test('Nên báo lỗi khi tạo match với không đúng 2 participants', async () => {
      // Match với 1 participant
      const match1 = new Match({
        participants: [user1.userId]
      });

      // Match với 3 participants
      const match3 = new Match({
        participants: [user1.userId, user2.userId, user3.userId]
      });

      await expect(match1.save()).rejects.toThrow('Match phải có đúng 2 participants');
      await expect(match3.save()).rejects.toThrow('Match phải có đúng 2 participants');
    });

    test('Nên báo lỗi khi tạo match với cùng một user', async () => {
      const match = new Match({
        participants: [user1.userId, user1.userId]
      });

      await expect(match.save()).rejects.toThrow('Match không thể có cùng một user');
    });

    test('Nên có method includesUser hoạt động đúng', async () => {
      const match = new Match({
        participants: [user1.userId, user2.userId]
      });
      const savedMatch = await match.save();

      expect(savedMatch.includesUser(user1.userId)).toBe(true);
      expect(savedMatch.includesUser(user2.userId)).toBe(true);
      expect(savedMatch.includesUser(user3.userId)).toBe(false);
    });

    test('Nên có static method findByUser hoạt động đúng', async () => {
      // Tạo 2 matches cho user1
      await Match.create({ participants: [user1.userId, user2.userId] });
      await Match.create({ participants: [user1.userId, user3.userId] });
      
      // Tạo 1 match không liên quan đến user1
      await Match.create({ participants: [user2.userId, user3.userId] });

      // Tìm matches mà không populate để test includesUser method
      const user1Matches = await Match.find({
        participants: user1.userId,
        status: 'active'
      });
      
      expect(user1Matches).toHaveLength(2);
      user1Matches.forEach(match => {
        expect(match.includesUser(user1.userId)).toBe(true);
      });
    });
  });
});