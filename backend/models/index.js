/**
 * Models Index File
 * 
 * Tập trung tất cả các Mongoose models để dễ dàng import và sử dụng
 * Đảm bảo tất cả 3 collections chính của Dating App được export
 */

const User = require('./User');
const Swipe = require('./Swipe');
const Match = require('./Match');
const Message = require('./Message');
const Notification = require('./Notification');
const Boost = require('./Boost');
const Story = require('./Story');

/**
 * Export tất cả models để sử dụng trong các file khác
 */
module.exports = {
  User,
  Swipe,
  Match,
  Message,
  Notification,
  Boost,
  Story
};

/**
 * Thông tin về các collections trong database:
 * 
 * 1. Users Collection (users):
 *    - Lưu trữ thông tin người dùng: phoneNumber, firstName, birthday, gender, bio, images
 *    - Preferences: genderPreference, ageRange
 *    - Status: isOnline, createdAt
 * 
 * 2. Swipes Collection (swipes):
 *    - Lưu trữ lịch sử hành động swipe: fromUserId, toUserId, type (like/pass)
 *    - Timestamp: createdAt
 *    - Index: unique constraint trên (fromUserId, toUserId)
 * 
 * 3. Matches Collection (matches):
 *    - Lưu trữ các cặp đôi đã match: participants (array 2 userIds)
 *    - Status: active/inactive
 *    - Timestamp: createdAt
 *    - Validation: đúng 2 participants, không trùng lặp
 */