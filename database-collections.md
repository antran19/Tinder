# Database Collections - Dating App

## MongoDB Collections Structure

### 1. Users Collection
```json
{
  "_id": "ObjectId",
  "userId": "String", // ID đơn giản như "user1", "user2", "user3"
  "name": "String", // Tên hiển thị đơn giản
  "isOnline": "Boolean",
  "createdAt": "Date"
}
```

**Ví dụ:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "user1",
  "name": "Nguyễn Văn A",
  "isOnline": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 2. Swipes Collection
```json
{
  "_id": "ObjectId",
  "fromUserId": "String", // ID của user thực hiện swipe
  "toUserId": "String",   // ID của user được swipe
  "type": "String",       // "like" hoặc "pass"
  "createdAt": "Date"
}
```

**Ví dụ:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "fromUserId": "user1",
  "toUserId": "user2",
  "type": "like",
  "createdAt": "2024-01-15T10:35:00Z"
}
```

### 3. Matches Collection
```json
{
  "_id": "ObjectId",
  "participants": ["String", "String"], // Array chứa 2 user IDs
  "status": "String",                    // "active", "inactive"
  "createdAt": "Date"
}
```

**Ví dụ:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "participants": ["user1", "user2"],
  "status": "active",
  "createdAt": "2024-01-15T10:36:00Z"
}
```

## Luồng Hoạt Động

### 1. Hiển thị Users
- Lấy tất cả users từ `users` collection
- Loại trừ user hiện tại
- Loại trừ users đã được swipe (check trong `swipes` collection)

### 2. Xử lý Swipe
- User A swipe User B → Lưu vào `swipes` collection
- Check xem User B đã like User A chưa trong `swipes` collection
- Nếu có → Tạo match trong `matches` collection

### 3. Real-time Notification
- Khi có match mới → Socket.io emit event cho cả 2 users
- Frontend nhận event → Hiển thị thông báo match

### 4. Hiển thị Matches
- Lấy tất cả matches của user từ `matches` collection
- Hiển thị danh sách matches trên frontend

## Queries Cơ Bản

### Lấy users để hiển thị cho swipe:
```javascript
// Lấy users chưa được swipe bởi currentUser
const swipedUserIds = await Swipes.find({ fromUserId: currentUserId }).distinct('toUserId');
const availableUsers = await Users.find({ 
  userId: { $nin: [...swipedUserIds, currentUserId] } 
});
```

### Check match khi có swipe mới:
```javascript
// Check xem target user đã like current user chưa
const existingLike = await Swipes.findOne({
  fromUserId: targetUserId,
  toUserId: currentUserId,
  type: 'like'
});

if (existingLike) {
  // Tạo match mới
  const match = new Match({
    participants: [currentUserId, targetUserId],
    status: 'active'
  });
}
```

### Lấy matches của user:
```javascript
const userMatches = await Matches.find({
  participants: { $in: [currentUserId] },
  status: 'active'
});
```