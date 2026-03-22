const mongoose = require('mongoose');

// Schema cho User collection - lưu trữ thông tin người dùng
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    select: false
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true
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
    enum: ['male', 'female'],
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  // Nhiều ảnh profile (tối đa 6 ảnh giống Tinder)
  images: [{
    type: String
  }],
  // Sở thích / Interest Tags
  interests: [{
    type: String,
    trim: true
  }],
  // Thông tin thêm cho profile nâng cao
  profileDetails: {
    height: {
      type: Number, // cm
      default: null
    },
    occupation: {
      type: String,
      default: ''
    },
    education: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    },
    zodiac: {
      type: String,
      enum: ['', 'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 
             'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'],
      default: ''
    },
    lookingFor: {
      type: String,
      enum: ['', 'relationship', 'casual', 'friendship', 'not-sure'],
      default: ''
    }
  },
  // Vị trí GPS (GeoJSON) cho tính năng tìm người gần bạn
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    lastUpdated: {
      type: Date,
      default: null
    },
    city: {
      type: String,
      default: ''
    }
  },
  // Xác minh tài khoản
  isVerified: {
    type: Boolean,
    default: false
  },
  // Role cho admin
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  preferences: {
    genderPreference: {
      type: String,
      enum: ['male', 'female'],
      default: function () {
        return this.gender === 'male' ? 'female' : 'male';
      }
    },
    ageRange: {
      min: {
        type: Number,
        default: 18
      },
      max: {
        type: Number,
        default: 50
      }
    },
    maxDistance: {
      type: Number,
      default: 50 // km
    }
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  // Subscription & Monetization
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'premium', 'gold'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  credits: {
    superLikes: {
      type: Number,
      default: 5
    },
    boosts: {
      type: Number,
      default: 0
    },
    rewindAvailable: {
      type: Boolean,
      default: false
    }
  },
  lastCreditRefresh: {
    type: Date,
    default: Date.now
  },
  // Lịch sử giao dịch
  transactions: [{
    transactionId: String,
    tier: String,
    amount: Number,
    paymentMethod: String,
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date
  }],
  // Report & Block
  blockedUsers: [{
    type: String
  }],
  isBanned: {
    type: Boolean,
    default: false
  },
  // Selfie Verification
  verification: {
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    selfieUrl: { type: String, default: '' },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: String }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// GeoSpatial index cho tìm kiếm theo khoảng cách
userSchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('User', userSchema);