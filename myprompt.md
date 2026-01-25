Xây dựng một ứng dụng hẹn hò (Dating App) cho phép người dùng tìm kiếm người ở gần dựa trên vị trí địa lý, thực hiện hành động quẹt (Swipe) để kết đôi và nhắn tin thời gian thực.

2. Tech Stack yêu cầu
Frontend: React, Tailwind CSS, Framer Motion (xử lý swipe animation), React Query.

Backend: Node.js, Express.js.

Database: MongoDB (Sử dụng Geospatial Index cho vị trí).

Real-time: Socket.io (cho thông báo match và chat).

Storage: Cloudinary hoặc AWS S3 (lưu trữ hình ảnh).

3. Luồng hoạt động chính (Application Flow)
Discovery (Khám phá): Hệ thống tìm kiếm người dùng trong Database dựa trên tọa độ GPS (kinh độ, vĩ độ) của người dùng hiện tại, lọc theo giới tính và khoảng cách yêu cầu.

Swiping (Hành động): * Người dùng quẹt phải (Like): Lưu vào collection Swipes.

Hệ thống kiểm tra ngay lập tức: Nếu đối phương cũng từng Like người này -> Tạo một bản ghi trong Matches.

Real-time Match: Khi có Match mới, gửi thông báo ngay lập tức qua Socket.io.

Chatting: Người dùng nhắn tin trong các phòng chat riêng biệt được định danh bởi matchId.

4. Thiết kế Database (MongoDB Collections)
AI Agent hãy khởi tạo các Schema dựa trên cấu trúc chính xác dưới đây:

Collection 1: Users
Lưu trữ hồ sơ và tọa độ địa lý. Bắt buộc đánh index 2dsphere cho trường location.

JSON

{
  "_id": "ObjectId",
  "phoneNumber": "String",
  "firstName": "String",
  "birthday": "Date",
  "gender": "male",
  "bio": "String",
  "images": ["url1", "url2"],
  "location": {
    "type": "Point",
    "coordinates": [106.660172, 10.762622] 
  },
  "preferences": {
    "genderPreference": "female",
    "ageRange": { "min": 18, "max": 30 },
    "maxDistance": 50
  },
  "isOnline": "Boolean",
  "createdAt": "Date"
}
Collection 2: Swipes
Lưu lịch sử quẹt để xử lý logic Matching.

JSON

{
  "_id": "ObjectId",
  "fromUserId": "ObjectId",
  "toUserId": "ObjectId",
  "type": "like", // hoặc "pass"
  "createdAt": "Date"
}
Collection 3: Matches
Được tạo ra khi có sự đồng thuận từ cả hai phía.

JSON

{
  "_id": "ObjectId",
  "participants": ["ObjectId_UserA", "ObjectId_UserB"],
  "lastMessage": {
    "text": "String",
    "senderId": "ObjectId",
    "timestamp": "Date"
  },
  "status": "active",
  "createdAt": "Date"
}
Collection 4: Messages
Lưu trữ chi tiết hội thoại.

JSON

{
  "_id": "ObjectId",
  "matchId": "ObjectId",
  "senderId": "ObjectId",
  "content": "String",
  "type": "text",
  "isRead": "Boolean",
  "createdAt": "Date"
}

hiện tại tôi chưa cần socket và realtime và không cần biết vị trí địa lý, tôi chỉ cần 1 cái flow đơn giản, hiện người, matches người,tạm thời chỉ lưu lại trong DâtaBase những collection mà tôi ví dụ ở trên, vì tôi đang học và muốn tìm hiểu từ từ, rồi mấy cái khác phát triển lên sau. NHỚ LÀ CODE DÒNG CODE NÀO THÌ COMMENT LẠI Ý NGHĨA CỦA ĐOẠN CODE ĐÓ TRONG CODEBASE