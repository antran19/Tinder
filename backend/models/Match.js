const mongoose = require('mongoose');

/**
 * Schema cho Match collection - lưu trữ thông tin về các cặp đôi đã match
 * 
 * Match được tạo khi cả hai user đều like nhau (mutual like)
 * Mỗi match chứa thông tin về 2 participants và trạng thái của match
 */
const matchSchema = new mongoose.Schema({
  participants: [{
    type: String, // String userIds như "user1", "user2"
    required: true
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'unmatched', 'blocked'], // Added unmatched and blocked
    default: 'active'
  },
  unmatchedBy: {
    type: String, // UserId của người thực hiện unmatch
    default: null
  },
  unmatchReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now // Thời gian tạo match
  }
});

// Tạo compound index để tăng tốc độ truy vấn
// Không sử dụng unique constraint ở database level, thay vào đó check trong application logic
matchSchema.index({ participants: 1 });

// Pre-save middleware để check duplicate matches
matchSchema.pre('save', async function (next) {
  if (this.participants.length !== 2) {
    const error = new Error('Match phải có đúng 2 participants');
    return next(error);
  }

  // Đảm bảo 2 participants khác nhau
  if (this.participants[0] === this.participants[1]) {
    const error = new Error('Match không thể có cùng một user');
    return next(error);
  }

  // Check xem đã có match giữa 2 users này chưa (chỉ khi tạo mới)
  if (this.isNew) {
    const existingMatch = await this.constructor.findOne({
      $or: [
        { participants: { $all: [this.participants[0], this.participants[1]] } },
        { participants: { $all: [this.participants[1], this.participants[0]] } }
      ]
    });

    if (existingMatch) {
      const error = new Error('Match giữa 2 users này đã tồn tại');
      return next(error);
    }
  }

  next();
});

// Method để check xem một user có trong match này không
matchSchema.methods.includesUser = function (userId) {
  return this.participants.includes(userId);
};

// Static method để tìm matches của một user
matchSchema.statics.findByUser = function (userId) {
  return this.find({
    participants: userId,
    status: 'active'
  });
};

module.exports = mongoose.model('Match', matchSchema);