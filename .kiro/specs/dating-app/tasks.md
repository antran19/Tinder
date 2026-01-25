# Implementation Plan: Dating App

## Tổng Quan

Triển khai Dating App đơn giản theo từng phase nhỏ để dễ test. Tập trung vào luồng chính: hiển thị users → swipe → real-time notification → update database → hiển thị frontend.

## Tasks

- [x] 1. Tạo cấu trúc project và setup cơ bản
  - Tạo folder backend và frontend
  - Setup package.json cho cả hai folder
  - Cài đặt dependencies cần thiết
  - _Requirements: 6.1, 6.2_

- [ ] 2. Setup MongoDB và tạo database models
  - [x] 2.1 Kết nối MongoDB và tạo 3 collections
    - Tạo connection MongoDB
    - Định nghĩa User, Swipe, Match models với Mongoose
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 2.2 Viết property test cho database structure
    - **Property 4: Database Collections Structure**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 3. Tạo backend API cơ bản
  - [x] 3.1 Setup Express server với basic routes
    - Tạo Express app với middleware cơ bản
    - Tạo routes cho users, swipes, matches
    - Thêm error handling middleware
    - _Requirements: 7.1, 7.2_
  
  - [x] 3.2 Implement API endpoint lấy available users
    - GET /api/users/available/:userId
    - Logic loại trừ user hiện tại và users đã swipe
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 3.3 Viết property test cho user exclusion
    - **Property 1: User List Exclusion**
    - **Validates: Requirements 1.2**

- [x] 4. Checkpoint - Test backend cơ bản
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement swipe handling logic
  - [x] 5.1 Tạo POST /api/swipes endpoint
    - Nhận fromUserId, toUserId, type từ request
    - Lưu swipe vào database với timestamp
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 5.2 Implement match detection logic
    - Check mutual likes khi có swipe mới
    - Tạo match record nếu có mutual like
    - _Requirements: 3.1, 3.3_
  
  - [ ]* 5.3 Viết property test cho swipe recording
    - **Property 2: Swipe Recording Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.3**
  
  - [ ]* 5.4 Viết property test cho match creation
    - **Property 3: Mutual Like Match Creation**
    - **Validates: Requirements 3.1, 3.3**

- [ ] 6. Setup Socket.io cho real-time features
  - [x] 6.1 Tích hợp Socket.io vào Express server
    - Setup Socket.io server
    - Implement join-room và disconnect events
    - Update user online status
    - _Requirements: 5.3_
  
  - [x] 6.2 Implement real-time match notification
    - Emit 'new-match' event khi có match mới
    - Send notification cho cả hai users
    - _Requirements: 3.2_

- [x] 7. Checkpoint - Test backend với real-time
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Tạo React frontend cơ bản
  - [x] 8.1 Setup React app với dependencies
    - Create React app trong folder frontend
    - Cài đặt Socket.io-client, axios
    - Setup basic routing và components
    - _Requirements: 6.1, 6.2_
  
  - [x] 8.2 Tạo SwipeCard component
    - Component hiển thị user info
    - Implement swipe gestures (buttons đơn giản)
    - Connect với backend API
    - _Requirements: 1.3_

- [ ] 9. Implement frontend swipe functionality
  - [x] 9.1 Tạo service để call backend APIs
    - API service cho users, swipes, matches
    - Error handling cho API calls
    - _Requirements: 7.3, 7.4, 7.5_
  
  - [x] 9.2 Connect SwipeCard với swipe API
    - Handle like/pass actions
    - Update UI sau khi swipe
    - _Requirements: 2.1, 2.2_

- [ ] 10. Implement real-time notifications trên frontend
  - [x] 10.1 Setup Socket.io client
    - Connect tới Socket.io server
    - Handle connection events
    - _Requirements: 5.3_
  
  - [x] 10.2 Tạo MatchNotification component
    - Listen cho 'new-match' events
    - Hiển thị match notification
    - Auto-hide sau 3 giây
    - _Requirements: 3.2, 5.1_

- [ ] 11. Tạo MatchList component
  - [x] 11.1 Implement matches display
    - GET matches từ API
    - Hiển thị danh sách matches
    - Real-time update khi có match mới
    - _Requirements: 5.2_

- [ ] 12. Final integration và testing
  - [x] 12.1 Wire tất cả components lại với nhau
    - Connect tất cả components
    - Test end-to-end flow
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [ ]* 12.2 Viết integration tests
    - Test complete swipe flow
    - Test real-time notifications
    - _Requirements: 3.2, 5.1, 5.2_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked với `*` là optional và có thể skip để làm MVP nhanh hơn
- Mỗi task reference specific requirements để traceability
- Checkpoints đảm bảo validation từng bước
- Property tests validate universal correctness properties
- Unit tests validate specific examples và edge cases
- Code sẽ có comments chi tiết giải thích từng đoạn
- Làm từng phase nhỏ để dễ test và debug