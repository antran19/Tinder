# MongoDB Setup và Collections - Task 2.1

## Tổng Quan

Task 2.1 đã được hoàn thành thành công với việc thiết lập kết nối MongoDB và tạo 3 collections chính cho Dating App:

- ✅ **Users Collection**: Lưu trữ thông tin người dùng
- ✅ **Swipes Collection**: Lưu trữ lịch sử hành động swipe
- ✅ **Matches Collection**: Lưu trữ các cặp đôi đã match

## Cấu Trúc Files Đã Tạo

### 1. Database Configuration
- `backend/config/database.js`: Cấu hình kết nối MongoDB với error handling và connection events

### 2. Mongoose Models
- `backend/models/User.js`: Schema cho Users collection
- `backend/models/Swipe.js`: Schema cho Swipes collection  
- `backend/models/Match.js`: Schema cho Matches collection
- `backend/models/index.js`: Export tất cả models

### 3. Tests
- `backend/tests/database.test.js`: Comprehensive test suite cho database và models

### 4. Server Integration
- Cập nhật `backend/index.js` để tích hợp database connection

## Chi Tiết Collections

### Users Collection
```javascript
{
  _id: ObjectId,
  phoneNumber: String (unique, required),
  firstName: String (required),
  birthday: Date (required),
  gender: "male" | "female" (required),
  bio: String (default: ""),
  images: [String], // Array URLs
  preferences: {
    genderPreference: "male" | "female" (required),
    ageRange: {
      min: Number (default: 18),
      max: Number (default: 50)
    }
  },
  isOnline: Boolean (default: false),
  createdAt: Date (default: now)
}
```

**Tính năng đặc biệt:**
- Unique constraint trên phoneNumber
- Validation cho gender và genderPreference
- Default values cho bio, ageRange, isOnline

### Swipes Collection
```javascript
{
  _id: ObjectId,
  fromUserId: ObjectId (ref: User, required),
  toUserId: ObjectId (ref: User, required),
  type: "like" | "pass" (required),
  createdAt: Date (default: now)
}
```

**Tính năng đặc biệt:**
- Unique compound index trên (fromUserId, toUserId)
- References đến User collection
- Chỉ cho phép type "like" hoặc "pass"

### Matches Collection
```javascript
{
  _id: ObjectId,
  participants: [ObjectId, ObjectId] (ref: User, required),
  status: "active" | "inactive" (default: "active"),
  createdAt: Date (default: now)
}
```

**Tính năng đặc biệt:**
- Pre-save validation: đúng 2 participants, không trùng lặp
- Pre-save check: không tạo duplicate matches
- Instance method: `includesUser(userId)`
- Static method: `findByUser(userId)`

## Database Connection Features

### Connection Management
- Automatic connection với retry logic
- Connection event listeners (disconnect, error, reconnect)
- Graceful shutdown handling
- Environment-based configuration

### Collections Management
- Automatic creation của required collections
- Verification và logging của existing collections
- Health check endpoints

### Error Handling
- Comprehensive error logging
- Connection failure handling
- Graceful process termination

## API Endpoints Đã Thêm

### Health Check
```
GET /health
Response: {
  status: "healthy",
  timestamp: "2026-01-22T19:25:22.545Z",
  uptime: 18.5951963,
  database: {
    status: "connected",
    host: "localhost", 
    name: "dating-app",
    collections: ["users", "swipes", "matches"]
  }
}
```

### Database Info
```
GET /api/database/info
Response: {
  success: true,
  database: {
    status: "connected",
    host: "localhost",
    name: "dating-app",
    collections: ["users", "swipes", "matches"]
  },
  collections: {
    users: "Lưu trữ thông tin người dùng",
    swipes: "Lưu trữ lịch sử hành động swipe", 
    matches: "Lưu trữ các cặp đôi đã match"
  }
}
```

## Test Coverage

### Database Connection Tests
- ✅ Kết nối thành công đến MongoDB
- ✅ Tạo đủ 3 collections cần thiết

### User Model Tests
- ✅ Tạo user với đầy đủ thông tin
- ✅ Validation cho required fields
- ✅ Unique constraint cho phoneNumber

### Swipe Model Tests  
- ✅ Tạo swipe thành công
- ✅ Unique constraint cho (fromUserId, toUserId)
- ✅ Validation cho type (like/pass)

### Match Model Tests
- ✅ Tạo match với 2 participants
- ✅ Validation cho số lượng participants
- ✅ Validation cho duplicate participants
- ✅ Instance method includesUser
- ✅ Static method findByUser

## Environment Configuration

### Required Environment Variables
```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/dating-app

# Server Configuration  
PORT=5000
NODE_ENV=development

# Test Database
TEST_MONGODB_URI=mongodb://localhost:27017/dating-app-test
```

## Validation Requirements Met

✅ **Requirement 4.1**: HỆ THỐNG Dating_System SẼ lưu users trong MongoDB collection "users"
✅ **Requirement 4.2**: HỆ THỐNG Dating_System SẼ lưu swipes trong MongoDB collection "swipes"
✅ **Requirement 4.3**: HỆ THỐNG Dating_System SẼ lưu matches trong MongoDB collection "matches"

## Cách Sử Dụng

### Khởi động Server
```bash
cd backend
npm start
# hoặc cho development
npm run dev
```

### Chạy Tests
```bash
cd backend
npm test database.test.js
```

### Import Models
```javascript
// Import tất cả models
const { User, Swipe, Match } = require('./models');

// Hoặc import riêng lẻ
const User = require('./models/User');
```

### Sử dụng Database Connection
```javascript
const { connectDB, getConnectionStatus } = require('./config/database');

// Kết nối
await connectDB();

// Check status
const status = getConnectionStatus();
```

## Next Steps

Task 2.1 đã hoàn thành. Các task tiếp theo có thể thực hiện:

- **Task 2.2**: Viết property test cho database structure
- **Task 3.1**: Setup Express server với basic routes
- **Task 3.2**: Implement API endpoint lấy available users

Tất cả foundation cho database đã sẵn sàng để support các tính năng tiếp theo của Dating App.