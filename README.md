# Dating App

Ứng dụng hẹn hò đơn giản tập trung vào luồng chính: hiển thị users → swipe → real-time notification → update database → hiển thị frontend.

## Cấu Trúc Project

```
dating-app/
├── backend/                 # Node.js/Express server
│   ├── models/             # MongoDB models (User, Swipe, Match)
│   ├── routes/             # API routes
│   ├── controllers/        # Business logic
│   ├── middleware/         # Custom middleware
│   ├── config/             # Configuration files
│   ├── tests/              # Backend tests
│   ├── index.js            # Main server file
│   ├── package.json        # Backend dependencies
│   └── .env                # Environment variables
├── frontend/               # React app
│   ├── src/                # React source code
│   ├── public/             # Static files
│   └── package.json        # Frontend dependencies
└── README.md               # Project documentation
```

## Công Nghệ Sử Dụng

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **Socket.io** - Real-time communication
- **Jest** - Testing framework
- **fast-check** - Property-based testing

### Frontend
- **React** - UI library
- **Socket.io-client** - Real-time client
- **Axios** - HTTP client
- **React Router** - Routing

## Cài Đặt và Chạy

### Prerequisites
- Node.js (v16 hoặc cao hơn)
- MongoDB (local hoặc cloud)
- npm hoặc yarn

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## API Endpoints (Sẽ được implement)

- `GET /api/users/available/:userId` - Lấy users available để swipe
- `POST /api/swipes` - Tạo swipe action mới
- `GET /api/matches/:userId` - Lấy danh sách matches của user

## Socket.io Events (Sẽ được implement)

### Client Events
- `join-room` - User join room với userId
- `disconnect` - User disconnect

### Server Events
- `new-match` - Emit khi có match mới
- `user-online` - Emit khi user online/offline

## Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
```

### Frontend Tests
```bash
cd frontend
npm test                   # Run React tests
```

## Development Workflow

1. **Phase 1**: Setup cơ bản (✅ Completed)
2. **Phase 2**: MongoDB models và database connection
3. **Phase 3**: Backend API endpoints
4. **Phase 4**: Socket.io real-time features
5. **Phase 5**: React frontend components
6. **Phase 6**: Integration và testing

## Requirements Traceability

- **Requirement 6.1**: ✅ Backend folder với Node.js/Express
- **Requirement 6.2**: ✅ Frontend folder với React app
- **Requirement 6.3**: ✅ Socket.io dependencies installed
- **Requirement 6.4**: ✅ MongoDB setup ready
- **Requirement 6.5**: ✅ Detailed code comments

## Notes

- Code có comments chi tiết để dễ hiểu
- Làm từng phase nhỏ để dễ test và debug
- Property-based tests validate universal correctness
- Unit tests validate specific examples và edge cases