import axios from 'axios';

/**
 * API Service
 * Handles all HTTP requests to the backend API
 * Requirements: 7.3, 7.4, 7.5 - API service with error handling and retry logic
 */

// Configure axios with base URL pointing to backend server
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Sleep function for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    // Lấy Token từ "Ví" (localStorage) ra
    const token = localStorage.getItem('dating_token');

    // Nếu có Token, dán nó vào Header của yêu cầu để Backend kiểm tra
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const backendMessage = error.response?.data?.message;
    console.error('API Response Error:', error.response?.data || error.message);

    // Handle common error scenarios
    if (error.response?.status === 404) {
      throw new Error(backendMessage || 'Resource not found');
    } else if (error.response?.status === 500) {
      throw new Error(backendMessage || 'Server error. Please try again later.');
    } else if (error.response?.status === 409) {
      throw new Error(backendMessage || 'Conflict error');
    } else if (error.response?.status === 400) {
      throw new Error(backendMessage || 'Invalid request');
    } else if (error.response?.status === 401) {
      throw new Error(backendMessage || 'Unauthorized');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to server. Please check if the backend is running.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    }

    throw new Error(backendMessage || error.message);
  }
);

/**
 * Retry wrapper for API calls
 * @param {Function} apiCall - The API call function
 * @param {number} retries - Number of retries remaining
 * @returns {Promise} API response
 */
const withRetry = async (apiCall, retries = MAX_RETRIES) => {
  try {
    return await apiCall();
  } catch (error) {
    if (retries > 0 && shouldRetry(error)) {
      console.log(`API call failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY * (MAX_RETRIES - retries + 1)); // Exponential backoff
      return withRetry(apiCall, retries - 1);
    }
    throw error;
  }
};

/**
 * Determine if an error should trigger a retry
 * @param {Error} error - The error to check
 * @returns {boolean} Whether to retry
 */
const shouldRetry = (error) => {
  // Retry on network errors, timeouts, and 5xx server errors
  return (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    (error.response && error.response.status >= 500) ||
    // Also retry on interceptor-transformed errors for retryable conditions
    (error.message && (
      error.message.includes('Server error') ||
      error.message.includes('Cannot connect') ||
      error.message.includes('Request timeout')
    ))
  );
};

export const apiService = {
  async login(userId, password) {
    try {
      const response = await api.post('/auth/login', { userId, password });
      return response.data;
    } catch (error) {
      console.error('Lỗi API Login:', error);
      throw error;
    }
  },

  /**
   * Đăng ký tài khoản mới
   * @param {Object} userData 
   */
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Lỗi API Register:', error);
      throw error;
    }
  },

  /**
   * Cập nhật hồ sơ người dùng
   * @param {string} userId 
   * @param {Object} profileData 
   */
  async updateProfile(userId, profileData) {
    try {
      const response = await api.put(`/users/${userId}`, profileData);
      return response.data;
    } catch (error) {
      console.error('Lỗi API Update Profile:', error);
      throw error;
    }
  },

  /**
   * Get available users for swiping
   * @param {string} userId - Current user ID
   * @returns {Promise<Array>} Array of available users
   */
  async getAvailableUsers(userId) {
    return withRetry(async () => {
      try {
        const response = await api.get(`/users/available/${userId}`);
        // Handle null or undefined response
        if (!response || !response.data) {
          return [];
        }
        return response.data.data?.users || [];
      } catch (error) {
        console.error('Error fetching available users:', error);
        // Re-throw interceptor errors as-is, wrap others
        if (error.message && (
          error.message.includes('Resource not found') ||
          error.message.includes('Server error') ||
          error.message.includes('Cannot connect') ||
          error.message.includes('Request timeout')
        )) {
          throw error;
        }
        throw new Error('Failed to load available users');
      }
    });
  },

  /**
   * Create a swipe action
   * @param {Object} swipeData - Swipe data {fromUserId, toUserId, type}
   * @returns {Promise<Object>} Swipe result with match info
   */
  async createSwipe(swipeData) {
    return withRetry(async () => {
      try {
        const response = await api.post('/swipes', swipeData);
        return response.data.data || response.data;
      } catch (error) {
        console.error('Error creating swipe:', error);
        throw new Error('Failed to process swipe');
      }
    });
  },

  /**
   * Get user matches
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of matches
   */
  async getMatches(userId) {
    return withRetry(async () => {
      try {
        const response = await api.get(`/matches/${userId}`);
        return response.data.data?.matches || [];
      } catch (error) {
        console.error('Error fetching matches:', error);
        throw new Error('Failed to load matches');
      }
    });
  },

  /**
   * Get all users (for testing/admin purposes)
   * @returns {Promise<Array>} Array of all users
   */
  async getAllUsers() {
    return withRetry(async () => {
      try {
        const response = await api.get('/users');
        return response.data.data?.users || [];
      } catch (error) {
        console.error('Error fetching all users:', error);
        throw new Error('Failed to load users');
      }
    });
  },

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    return withRetry(async () => {
      try {
        const response = await api.get(`/users/${userId}`);
        return response.data.data?.user || null;
      } catch (error) {
        console.error('Error fetching user:', error);
        throw new Error('Failed to load user');
      }
    });
  },

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    return withRetry(async () => {
      try {
        const response = await api.post('/users', userData);
        return response.data.data?.user || response.data;
      } catch (error) {
        console.error('Error creating user:', error);
        // Re-throw interceptor errors as-is, wrap others
        if (error.message && (
          error.message.includes('Conflict error') ||
          error.message.includes('Invalid request') ||
          error.message.includes('Server error') ||
          error.message.includes('Cannot connect') ||
          error.message.includes('Request timeout') ||
          error.message.includes('User already exists')
        )) {
          throw error;
        }
        throw new Error('Failed to create user');
      }
    });
  },

  /**
   * Get swipe history for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options {type, limit, skip}
   * @returns {Promise<Object>} Swipe history with pagination
   */
  async getSwipeHistory(userId, options = {}) {
    return withRetry(async () => {
      try {
        const params = new URLSearchParams();
        if (options.type) params.append('type', options.type);
        if (options.limit) params.append('limit', options.limit);
        if (options.skip) params.append('skip', options.skip);

        const response = await api.get(`/swipes/${userId}?${params}`);
        return response.data.data || response.data;
      } catch (error) {
        console.error('Error fetching swipe history:', error);
        throw new Error('Failed to load swipe history');
      }
    });
  },

  /**
   * Get swipe statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Swipe statistics
   */
  async getSwipeStats(userId) {
    return withRetry(async () => {
      try {
        const response = await api.get(`/swipes/stats/${userId}`);
        return response.data.data || response.data;
      } catch (error) {
        console.error('Error fetching swipe stats:', error);
        throw new Error('Failed to load swipe statistics');
      }
    });
  },

  /**
   * Get match details by ID
   * @param {string} matchId - Match ID
   * @returns {Promise<Object>} Match details
   */
  async getMatchDetails(matchId) {
    return withRetry(async () => {
      try {
        const response = await api.get(`/matches/detail/${matchId}`);
        return response.data.data?.match || null;
      } catch (error) {
        console.error('Error fetching match details:', error);
        throw new Error('Failed to load match details');
      }
    });
  },

  /**
   * Lấy lịch sử tin nhắn của cuộc hội thoại
   * @param {string} matchId 
   * @param {Object} options {limit, before}
   */
  async getMessages(matchId, options = {}) {
    return withRetry(async () => {
      try {
        const params = new URLSearchParams();
        if (options.limit) params.append('limit', options.limit);
        if (options.before) params.append('before', options.before);

        const response = await api.get(`/messages/${matchId}?${params}`);
        return response.data.data?.messages || [];
      } catch (error) {
        console.error('Error fetching messages:', error);
        throw new Error('Không thể tải tin nhắn. Vui lòng thử lại.');
      }
    });
  },

  /**
   * Đánh dấu các tin nhắn trong cuộc hội thoại là đã xem
   * @param {string} matchId 
   * @param {string} userId 
   */
  async markMessagesAsRead(matchId, userId) {
    try {
      await api.post('/messages/mark-read', { matchId, userId });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  /**
   * Update match status
   * @param {string} matchId - Match ID
   * @param {string} status - New status ('active' or 'inactive')
   * @param {string} userId - User ID making the change
   * @returns {Promise<Object>} Updated match
   */
  async updateMatchStatus(matchId, status, userId) {
    return withRetry(async () => {
      try {
        const response = await api.put(`/matches/${matchId}/status`, { status, userId });
        return response.data.data?.match || response.data;
      } catch (error) {
        console.error('Error updating match status:', error);
        throw new Error('Failed to update match status');
      }
    });
  },

  /**
   * Health check endpoint
   * @returns {Promise<Object>} Server health status
   */
  async healthCheck() {
    return withRetry(async () => {
      try {
        // Health endpoint is at root level, not under /api
        const response = await axios.get(`${API_BASE_URL}/health`);
        return response.data;
      } catch (error) {
        console.error('Health check failed:', error);
        throw new Error('Server health check failed');
      }
    });
  },

  // === NOTIFICATIONS ===
  async getNotifications(userId) {
    try {
      const response = await api.get(`/notifications/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], unreadCount: 0 };
    }
  },

  async markNotificationRead(notificationId) {
    try {
      await api.put(`/notifications/mark-read/${notificationId}`);
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  },

  // === MATCH ACTIONS ===
  async unmatchUser(matchId, userId, reason = '') {
    try {
      const response = await api.post(`/matches/${matchId}/unmatch`, { userId, reason });
      return response.data;
    } catch (error) {
      console.error('Error unmatching:', error);
      throw error;
    }
  },

  // === PREMIUM FEATURES ===
  async activateBoost(userId) {
    try {
      const response = await api.post('/premium/activate-boost', { userId });
      return response.data;
    } catch (error) {
      console.error('Error activating boost:', error);
      throw error;
    }
  },

  async rewindSwipe(swipeId, userId) {
    try {
      const response = await api.delete(`/premium/rewind/${swipeId}`, { data: { userId } });
      return response.data;
    } catch (error) {
      console.error('Error rewinding:', error);
      throw error;
    }
  },

  async upgradeToPremium(userId, tier = 'premium') {
    try {
      const response = await api.post('/premium/upgrade', { userId, tier });
      return response.data;
    } catch (error) {
      console.error('Error upgrading:', error);
      throw error;
    }
  },

  async getPremiumStatus(userId) {
    try {
      const response = await api.get(`/premium/status/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting premium status:', error);
      return null;
    }
  },

  // ===== UPLOAD APIs =====

  /**
   * Upload ảnh trong chat
   * @param {File} imageFile - File ảnh
   * @returns {Object} { imageUrl, filename }
   */
  async uploadChatImage(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post('/upload/chat-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error uploading chat image:', error);
      throw new Error('Không thể upload ảnh. Vui lòng thử lại.');
    }
  },

  /**
   * Upload ảnh profile
   * @param {File} imageFile - File ảnh  
   * @param {string} userId - User ID
   * @returns {Object} { imageUrl, filename }
   */
  async uploadProfileImage(imageFile, userId) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('userId', userId);

      const response = await api.post('/upload/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw new Error('Không thể upload ảnh profile. Vui lòng thử lại.');
    }
  },

  /**
   * Xóa ảnh profile
   * @param {string} userId
   * @param {string} imageUrl
   */
  async deleteProfileImage(userId, imageUrl) {
    try {
      await api.delete('/upload/profile-image', { data: { userId, imageUrl } });
    } catch (error) {
      console.error('Error deleting profile image:', error);
      throw new Error('Không thể xóa ảnh.');
    }
  },

  /**
   * Cập nhật thông tin profile nâng cao (interests, profileDetails)
   * @param {string} userId
   * @param {Object} profileData - { interests, profileDetails }
   */
  async updateUserProfile(userId, profileData) {
    try {
      const response = await api.put(`/users/${userId}`, profileData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Không thể cập nhật thông tin.');
    }
  },

  // ===== WHO LIKED ME =====
  async getWhoLikedMe(userId) {
    try {
      const response = await api.get(`/premium/who-liked/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting who liked:', error);
      throw error;
    }
  },

  // ===== PAYMENT =====
  async purchasePremium(userId, tier, paymentMethod, amount) {
    try {
      const response = await api.post('/premium/purchase', { userId, tier, paymentMethod, amount });
      return response.data;
    } catch (error) {
      console.error('Error purchasing premium:', error);
      throw error;
    }
  },

  async getTransactions(userId) {
    try {
      const response = await api.get(`/premium/transactions/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return { transactions: [], totalSpent: 0 };
    }
  },

  // ===== LOCATION =====
  async updateLocation(userId, latitude, longitude, city = '') {
    try {
      const response = await api.put(`/users/${userId}/location`, { latitude, longitude, city });
      return response.data;
    } catch (error) {
      console.error('Error updating location:', error);
      return null;
    }
  },

  // ===== BANK QR PAYMENT =====
  async generateBankQR(userId, tier, amount) {
    try {
      const response = await api.post('/payment/generate-qr', { userId, tier, amount });
      return response.data;
    } catch (error) {
      console.error('Error generating QR:', error);
      throw error;
    }
  },

  async confirmBankTransfer(userId, transactionCode) {
    try {
      const response = await api.post('/payment/confirm-transfer', { userId, transactionCode });
      return response.data;
    } catch (error) {
      console.error('Error confirming transfer:', error);
      throw error;
    }
  },

  async checkPaymentStatus(transactionCode) {
    try {
      const response = await api.get(`/payment/check-status/${transactionCode}`);
      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  }
};

export default apiService;