const mongoose = require('mongoose');

// Schema cho User collection - lưu trữ thông tin người dùng
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true // ID đơn giản như "user1", "user2"
  },
  phoneNumber: {
    type: String,
    unique: true, // Đảm bảo số điện thoại là duy nhất (nếu có)
    sparse: true // Cho phép null/undefined và không tạo unique constraint cho null values
  },
  firstName: {
    type: String,
    required: true
  },
  birthday: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'], // Chỉ cho phép 2 giá trị này
    required: true
  },
  bio: {
    type: String,
    default: '' // Mô tả bản thân, có thể để trống
  },
  images: [{
    type: String // Mảng chứa URL các hình ảnh
  }],
  preferences: {
    genderPreference: {
      type: String,
      enum: ['male', 'female'],
      default: function() {
        // Default preference: opposite gender
        return this.gender === 'male' ? 'female' : 'male';
      }
    },
    ageRange: {
      min: {
        type: Number,
        default: 18 // Tuổi tối thiểu
      },
      max: {
        type: Number,
        default: 50 // Tuổi tối đa
      }
    }
  },
  isOnline: {
    type: Boolean,
    default: false // Trạng thái online/offline
  },
  createdAt: {
    type: Date,
    default: Date.now // Thời gian tạo tài khoản
  }
});

module.exports = mongoose.model('User', userSchema);