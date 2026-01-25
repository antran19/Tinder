# Tài Liệu Yêu Cầu

## Giới Thiệu

Tài liệu này xác định các yêu cầu cho Ứng Dụng Hẹn Hò đơn giản nhất có thể. Tập trung vào luồng chính: hiển thị user → swipe → real-time notification → update database → hiển thị lại frontend.

## Thuật Ngữ

- **Dating_System**: Hệ thống ứng dụng hẹn hò đơn giản
- **User**: Người dùng với ID đơn giản (không cần profile phức tạp)
- **Swipe**: Hành động like/pass
- **Match**: Kết nối khi cả hai user like nhau
- **Real_Time_Notifier**: Thành phần thông báo real-time

## Yêu Cầu

### Yêu Cầu 1: Hiển Thị Danh Sách User Đơn Giản

**User Story:** Là một user, tôi muốn xem danh sách các user khác, để tôi có thể swipe.

#### Tiêu Chí Chấp Nhận

1. HỆ THỐNG Dating_System SẼ hiển thị danh sách user với ID đơn giản
2. HỆ THỐNG Dating_System SẼ loại trừ user hiện tại khỏi danh sách
3. HỆ THỐNG Dating_System SẼ hiển thị từng user một để swipe

### Yêu Cầu 2: Xử Lý Swipe Actions

**User Story:** Là một user, tôi muốn swipe like/pass, để hệ thống ghi nhận hành động của tôi.

#### Tiêu Chí Chấp Nhận

1. KHI user swipe right (like), HỆ THỐNG Dating_System SẼ ghi lại action "like" vào database
2. KHI user swipe left (pass), HỆ THỐNG Dating_System SẼ ghi lại action "pass" vào database
3. HỆ THỐNG Dating_System SẼ lưu fromUserId, toUserId, type (like/pass), timestamp

### Yêu Cầu 3: Tạo Match và Real-time Notification

**User Story:** Là một user, tôi muốn được thông báo real-time khi có match, để tôi biết ngay lập tức.

#### Tiêu Chí Chấp Nhận

1. KHI user A like user B và user B đã like user A trước đó, HỆ THỐNG Dating_System SẼ tạo match
2. KHI match được tạo, HỆ THỐNG Real_Time_Notifier SẼ gửi thông báo real-time cho cả hai user
3. HỆ THỐNG Dating_System SẼ lưu match vào database với cả hai user ID

### Yêu Cầu 4: Cập Nhật Database

**User Story:** Là hệ thống, tôi cần lưu trữ tất cả data để duy trì trạng thái.

#### Tiêu Chí Chấp Nhận

1. HỆ THỐNG Dating_System SẼ lưu users trong MongoDB collection "users"
2. HỆ THỐNG Dating_System SẼ lưu swipes trong MongoDB collection "swipes"  
3. HỆ THỐNG Dating_System SẼ lưu matches trong MongoDB collection "matches"

### Yêu Cầu 5: Hiển Thị Frontend Real-time

**User Story:** Là một user, tôi muốn thấy cập nhật real-time trên giao diện.

#### Tiêu Chí Chấp Nhận

1. KHI có match mới, HỆ THỐNG Dating_System SẼ hiển thị thông báo trên frontend ngay lập tức
2. HỆ THỐNG Dating_System SẼ cập nhật danh sách matches real-time
3. HỆ THỐNG Dating_System SẼ sử dụng Socket.io cho real-time communication

### Yêu Cầu 6: Cấu Trúc Project Đơn Giản

**User Story:** Là developer, tôi muốn cấu trúc project đơn giản để dễ phát triển.

#### Tiêu Chí Chấp Nhận

1. HỆ THỐNG Dating_System SẼ có folder "backend" chứa Node.js/Express server
2. HỆ THỐNG Dating_System SẼ có folder "frontend" chứa React app
3. HỆ THỐNG Dating_System SẼ sử dụng Socket.io cho real-time features
4. HỆ THỐNG Dating_System SẼ có MongoDB database với 3 collections cơ bản
5. HỆ THỐNG Dating_System SẼ có code comments chi tiết để dễ hiểu