const mongoose = require('mongoose');

// Schema cho Swipe collection - lưu lịch sử hành động quẹt của user
const swipeSchema = new mongoose.Schema({
  fromUserId: {
    type: String,
    required: true // ID của người thực hiện hành động quẹt (string như "user1")
  },
  toUserId: {
    type: String,
    required: true // ID của người được quẹt (string như "user2")
  },
  type: {
    type: String,
    enum: ['like', 'pass'], // like = quẹt phải, pass = quẹt trái
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now // Thời gian thực hiện hành động
  }
});

// Tạo index để tăng tốc độ truy vấn
swipeSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true }); // Đảm bảo mỗi cặp user chỉ có 1 swipe

module.exports = mongoose.model('Swipe', swipeSchema);