# API Service Documentation

## Overview

The API Service provides a centralized interface for all HTTP requests to the backend API. It includes comprehensive error handling, retry logic, and request/response interceptors.

## Features

- **Complete API Coverage**: Supports all backend endpoints for users, swipes, and matches
- **Error Handling**: Comprehensive error handling with user-friendly error messages
- **Retry Logic**: Automatic retry for network errors, timeouts, and server errors (5xx)
- **Request/Response Interceptors**: Logging and error transformation
- **Environment Configuration**: Configurable API base URL via environment variables
- **Timeout Configuration**: 10-second timeout for all requests
- **Exponential Backoff**: Retry delays increase with each attempt (1s, 2s, 3s)

## Configuration

### Environment Variables

```bash
REACT_APP_API_URL=http://localhost:5000  # Backend server URL
```

### Retry Configuration

- **Max Retries**: 3 attempts
- **Retry Delay**: 1000ms base delay with exponential backoff
- **Retryable Errors**: Network errors, timeouts, 5xx server errors

## API Methods

### User Operations

#### `getAvailableUsers(userId)`
Get users available for swiping (excludes current user and already swiped users).

```javascript
const users = await apiService.getAvailableUsers('user1');
```

#### `getUserById(userId)`
Get detailed information for a specific user.

```javascript
const user = await apiService.getUserById('user1');
```

#### `createUser(userData)`
Create a new user account.

```javascript
const newUser = await apiService.createUser({
  userId: 'user1',
  firstName: 'John',
  gender: 'male'
});
```

#### `getAllUsers()`
Get all users (for admin/testing purposes).

```javascript
const allUsers = await apiService.getAllUsers();
```

### Swipe Operations

#### `createSwipe(swipeData)`
Create a new swipe action (like or pass).

```javascript
const result = await apiService.createSwipe({
  fromUserId: 'user1',
  toUserId: 'user2',
  type: 'like'
});

// Result includes match information if a match was created
if (result.match) {
  console.log('It\'s a match!', result.matchData);
}
```

#### `getSwipeHistory(userId, options)`
Get swipe history for a user with pagination and filtering.

```javascript
const history = await apiService.getSwipeHistory('user1', {
  type: 'like',    // Optional: filter by 'like' or 'pass'
  limit: 10,       // Optional: number of results
  skip: 0          // Optional: pagination offset
});
```

#### `getSwipeStats(userId)`
Get swipe statistics for a user.

```javascript
const stats = await apiService.getSwipeStats('user1');
// Returns: sent/received likes, match rate, etc.
```

### Match Operations

#### `getMatches(userId)`
Get all matches for a user.

```javascript
const matches = await apiService.getMatches('user1');
```

#### `getMatchDetails(matchId)`
Get detailed information about a specific match.

```javascript
const matchDetails = await apiService.getMatchDetails('match123');
```

#### `updateMatchStatus(matchId, status, userId)`
Update the status of a match (active/inactive).

```javascript
const updatedMatch = await apiService.updateMatchStatus('match123', 'inactive', 'user1');
```

### System Operations

#### `healthCheck()`
Check backend server health status.

```javascript
const health = await apiService.healthCheck();
console.log('Server status:', health.status);
```

## Error Handling

The API service provides comprehensive error handling:

### Error Types

- **404 Not Found**: Resource doesn't exist
- **400 Bad Request**: Invalid request data
- **409 Conflict**: Resource already exists or conflict
- **500 Server Error**: Internal server error
- **Network Errors**: Connection refused, timeout, etc.

### Error Messages

All errors are transformed into user-friendly messages:

```javascript
try {
  await apiService.getAvailableUsers('user1');
} catch (error) {
  console.error(error.message); // "Failed to load available users"
}
```

### Retry Logic

The service automatically retries failed requests for:
- Network connection errors (ECONNREFUSED)
- Request timeouts (ECONNABORTED)
- Server errors (5xx status codes)

Non-retryable errors (4xx status codes) fail immediately.

## Response Format

All API responses follow a consistent format from the backend:

```javascript
{
  success: true,
  message: "Operation successful",
  data: {
    // Actual response data
  }
}
```

The API service extracts the `data` portion and returns it directly to the caller.

## Testing

The API service includes comprehensive integration tests covering:

- All API methods
- Error handling scenarios
- Edge cases (null responses, malformed data)
- Retry logic
- Query parameter handling

Run tests with:

```bash
npm test -- --testPathPattern=apiService
```

## Usage Examples

### Complete Swipe Flow

```javascript
// 1. Get available users
const users = await apiService.getAvailableUsers('user1');

// 2. User swipes on someone
const swipeResult = await apiService.createSwipe({
  fromUserId: 'user1',
  toUserId: users[0].userId,
  type: 'like'
});

// 3. Check if it's a match
if (swipeResult.match) {
  console.log('Match created!', swipeResult.matchData);
  
  // 4. Get updated matches list
  const matches = await apiService.getMatches('user1');
}
```

### Error Handling Example

```javascript
try {
  const users = await apiService.getAvailableUsers('user1');
  // Handle success
} catch (error) {
  if (error.message.includes('Cannot connect')) {
    // Handle connection error
    showOfflineMessage();
  } else if (error.message.includes('Server error')) {
    // Handle server error
    showRetryButton();
  } else {
    // Handle other errors
    showGenericError(error.message);
  }
}
```

## Requirements Satisfied

This API service implementation satisfies the following requirements:

- **7.3**: Complete API service for users, swipes, and matches endpoints
- **7.4**: Comprehensive error handling for all API calls
- **7.5**: Request/response interceptors, timeout configuration, and retry logic

The service provides a robust, production-ready interface for frontend-backend communication with proper error handling and resilience features.