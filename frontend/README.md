# Dating App Frontend

React frontend application for the dating app with real-time matching capabilities.

## Features

- **Swipe Interface**: Browse and swipe through available users
- **Real-time Notifications**: Instant match notifications via Socket.io
- **Match Management**: View and manage your matches
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **React 18**: Modern React with hooks and functional components
- **React Router**: Client-side routing for navigation
- **Socket.io Client**: Real-time communication with backend
- **Axios**: HTTP client for API requests
- **CSS3**: Modern styling with gradients and animations

## Project Structure

```
src/
├── components/          # React components
│   ├── Navigation.js    # Main navigation component
│   ├── SwipeView.js     # Main swiping interface
│   ├── SwipeCard.js     # Individual user card
│   ├── MatchList.js     # List of matches
│   └── MatchNotification.js  # Real-time match notifications
├── context/             # React contexts
│   └── SocketContext.js # Socket.io connection management
├── services/            # API services
│   └── apiService.js    # Backend API communication
├── App.js              # Main app component
└── index.js            # App entry point
```

## Getting Started

### Prerequisites

- Node.js 16+ installed
- Backend server running on port 5000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at http://localhost:3001

### Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
PORT=3001
```

## API Integration

The frontend communicates with the backend through:

- **REST API**: User data, swipes, and matches
- **Socket.io**: Real-time match notifications and user status

### API Endpoints Used

- `GET /api/users/available/:userId` - Get available users for swiping
- `POST /api/swipes` - Create a swipe action
- `GET /api/matches/:userId` - Get user matches

### Socket.io Events

- `join-room` - Join user room for notifications
- `new-match` - Receive match notifications
- `user-online` - User status updates

## Components Overview

### SwipeView
Main interface for browsing and swiping users. Handles:
- Loading available users
- Processing swipe actions
- Error handling and loading states

### SwipeCard
Individual user card component with:
- User avatar and information
- Like/Pass action buttons
- Online status indicator

### MatchList
Displays user matches with:
- Real-time match updates
- Match history and details
- Refresh functionality

### MatchNotification
Modal notification for new matches:
- Animated match celebration
- Auto-hide after 3 seconds
- Action buttons for next steps

## Styling

The app uses a modern design with:
- Gradient backgrounds and buttons
- Smooth animations and transitions
- Responsive layout for all screen sizes
- Consistent color scheme and typography

## Testing

Run tests with:
```bash
npm test
```

## Building for Production

Create a production build:
```bash
npm run build
```

## Requirements Fulfilled

- **6.1**: React app structure in frontend folder ✅
- **6.2**: Socket.io-client and axios dependencies ✅
- **1.3**: Basic routing and components setup ✅

## Next Steps

1. Connect to running backend server
2. Test real-time match notifications
3. Add user authentication
4. Implement chat functionality
5. Add user profiles and photos