# Danh sách các chức năng hiện có trong dự án (Tinder Clone)

Dựa trên mã nguồn hiện tại của dự án (Frontend & Backend), đây là danh sách chi tiết các chức năng đã được phát triển và hoàn thiện:

## 1. Xác thực và Bảo mật (Authentication & Security)
- **Đăng ký / Đăng nhập (Auth)**: Sử dụng JWT (JSON Web Token), mã hóa mật khẩu bằng `bcrypt.js`.
- **Bảo mật nhiều lớp**: Middleware chống XSS, NoSQL Injection, thiết lập CORS, chia luồng Rate Limit.
- **Chống Brute Force**: Auto-lock tài khoản nếu đăng nhập sai mật khẩu quá 5 lần.
- **Xác minh danh tính (Selfie Verification)**: Người dùng chụp ảnh xác thực, admin sẽ xem xét để cấp tích xanh verify.

## 2. Các chức năng Cốt lõi (Core Swipe & Chat Experience)
- **Quẹt thẻ thông minh (Swipe)**: Quẹt trái (Pass), Quẹt phải (Like), và Quẹt lên (Super Like) với hiệu ứng drag-and-drop mượt mà.
- **Hoàn tác lượt quẹt (Rewind)**: Lấy lại lượt thẻ vừa bỏ qua (giới hạn theo hạng tài khoản).
- **Tương hợp (Matching)**: Thuật toán nhận diện Mutual Like, có màn hình popup "It's a Match!" với hiệu ứng tung confetti.
- **Nhắn tin trực tiếp (Real-time Chat)**: Gửi text, emoji, ảnh chụp. Hiển thị "đang soạn tin" (typing indicator) và "đã xem" nhờ tích hợp Socket.io.
- **Đăng bảng tin 24h (Stories)**: Post Story, theo dõi số lượt xem, lượt thả tim, với thanh progress bar như Instagram/Tinder.
- **Xem ai đã thích bạn (Who Liked You)**: Dành cho User VIP, xem danh sách những người chờ để match.

## 3. Quản lý Hồ sơ & Khám phá (Profile & Discovery)
- **Hồ sơ cá nhân (Rich Profiles)**: Up 6 ảnh, mô tả bản thân, thêm tag sở thích, chiều cao, cung hoàng đạo,...
- **Âm nhạc (Music)**: Thêm bài hát đại diện (Anthem) và nghệ sĩ yêu thích.
- **Vị trí (GPS Location)**: Tính toán hiển thị khoảng cách địa lý giữa 2 user qua tọa độ GPS.
- **Bộ lọc (Smart Filters)**: Tìm bạn theo đúng nhu cầu: Giới tính, Khoảng cách tối đa, Tuổi từ X đến Y.
- **Gợi ý AI & Độ tương hợp (AI Smart Match & Insights)**: Chấm điểm tương thích giữa 2 hồ sơ dựa trên sở thích, thuật toán hỗ trợ đưa ra người phù hợp hơn.
- **Gợi ý mở lời (Icebreakers)**: Các câu hỏi tự động do AI sinh ra dựa vào hồ sơ của đối phương giúp vượt qua ngại ngùng.

## 4. Tính năng Trả phí (Premium & Monetization)
- **Các gói Subscriptions (Premium/Gold Levels)**: Điều chỉnh cấp độ tài khoản kèm theo hạn mức lượt quẹt/rewind mỗi ngày.
- **Tăng tốc độ hiển thị (Profile Boost)**: Kích hoạt boost giúp hồ sơ hiện ở vị trí đầu tiên lên bản đồ quẹt trong vòng 30 phút.
- **Gửi Quà Ảo (Virtual Gifts)**: Bắn các item ảo vào trong phòng chat để tạo ấn tượng (Hoa hồng, Kim cương).
- **Thanh toán (QR Payment)**: Nạp tiền thông qua chuyển khoản/quét QR code Momo và ZaloPay.

## 5. Quản trị & Hệ thống (Admin & System)
- **Chặn & Báo cáo (Block & Report)**: Cho phép chặn những match độc hại, và report tài khoản vi phạm chuẩn mực.
- **Trang Quản trị (Admin Dashboard)**: Nơi Master Admin thống kê lượng người lưu thông, quản lý lượt verification và khóa account.
- **Hệ thống thông báo (Notifications)**: Báo in-app real-time về match mới, báo story, báo lượt like.
- **Tải lên File (Media Upload)**: Tích hợp middleware để upload ảnh, validation kích thước/loại file trực tiếp vào Database thông qua GridFS.
