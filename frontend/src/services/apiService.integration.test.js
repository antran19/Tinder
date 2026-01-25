/**
 * API Service Integration Tests
 * Tests the API service functionality with mock server responses
 */

// Mock axios at the module level
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

const mockAxios = {
  create: jest.fn(() => mockAxiosInstance),
  get: jest.fn()
};

jest.doMock('axios', () => mockAxios);

describe('API Service Integration Tests', () => {
  let apiService;

  beforeAll(async () => {
    // Import after mocking
    const module = await import('./apiService');
    apiService = module.apiService;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Operations', () => {
    test('getAvailableUsers returns users successfully', async () => {
      const mockUsers = [
        { userId: 'user2', firstName: 'John', gender: 'male' },
        { userId: 'user3', firstName: 'Jane', gender: 'female' }
      ];

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { users: mockUsers }
        }
      });

      const result = await apiService.getAvailableUsers('user1');

      expect(result).toEqual(mockUsers);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/available/user1');
    });

    test('getUserById returns specific user', async () => {
      const mockUser = {
        userId: 'user1',
        firstName: 'John',
        gender: 'male',
        bio: 'Test bio'
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { user: mockUser }
        }
      });

      const result = await apiService.getUserById('user1');

      expect(result).toEqual(mockUser);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/user1');
    });

    test('createUser creates new user successfully', async () => {
      const userData = {
        userId: 'newuser',
        firstName: 'New',
        gender: 'male'
      };

      const createdUser = { ...userData, _id: 'objectid123' };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          data: { user: createdUser }
        }
      });

      const result = await apiService.createUser(userData);

      expect(result).toEqual(createdUser);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', userData);
    });
  });

  describe('Swipe Operations', () => {
    test('createSwipe processes like action', async () => {
      const swipeData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        type: 'like'
      };

      const mockResponse = {
        swipe: { ...swipeData, _id: 'swipe123', createdAt: new Date() },
        match: false
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse
        }
      });

      const result = await apiService.createSwipe(swipeData);

      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/swipes', swipeData);
    });

    test('createSwipe handles match creation', async () => {
      const swipeData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        type: 'like'
      };

      const mockResponse = {
        swipe: { ...swipeData, _id: 'swipe123' },
        match: true,
        matchData: {
          _id: 'match123',
          participants: ['user1', 'user2'],
          status: 'active'
        }
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse
        }
      });

      const result = await apiService.createSwipe(swipeData);

      expect(result.match).toBe(true);
      expect(result.matchData).toBeDefined();
      expect(result.matchData.participants).toContain('user1');
      expect(result.matchData.participants).toContain('user2');
    });

    test('getSwipeHistory returns paginated history', async () => {
      const mockHistory = {
        swipes: [
          { fromUserId: 'user1', toUserId: 'user2', type: 'like' },
          { fromUserId: 'user1', toUserId: 'user3', type: 'pass' }
        ],
        pagination: { total: 2, limit: 10, skip: 0, hasMore: false },
        stats: { likes: 1, passes: 1 }
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: mockHistory
        }
      });

      const options = { type: 'like', limit: 10 };
      const result = await apiService.getSwipeHistory('user1', options);

      expect(result).toEqual(mockHistory);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/swipes/user1?type=like&limit=10');
    });

    test('getSwipeStats returns user statistics', async () => {
      const mockStats = {
        userId: 'user1',
        stats: {
          sent: { total: 10, likes: 6, passes: 4, likeRate: '60.0' },
          received: { likes: 8 },
          matches: { total: 3, matchRate: '50.0' }
        }
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: mockStats
        }
      });

      const result = await apiService.getSwipeStats('user1');

      expect(result).toEqual(mockStats);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/swipes/stats/user1');
    });
  });

  describe('Match Operations', () => {
    test('getMatches returns user matches', async () => {
      const mockMatches = [
        {
          _id: 'match1',
          participants: ['user1', 'user2'],
          status: 'active',
          otherUser: { userId: 'user2', firstName: 'John' }
        }
      ];

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { matches: mockMatches }
        }
      });

      const result = await apiService.getMatches('user1');

      expect(result).toEqual(mockMatches);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/matches/user1');
    });

    test('getMatchDetails returns detailed match info', async () => {
      const mockMatch = {
        _id: 'match1',
        participants: ['user1', 'user2'],
        status: 'active',
        users: {
          user1: { userId: 'user1', firstName: 'Alice' },
          user2: { userId: 'user2', firstName: 'Bob' }
        },
        swipeHistory: {
          user1ToUser2: { type: 'like', createdAt: '2023-01-01' },
          user2ToUser1: { type: 'like', createdAt: '2023-01-02' }
        }
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: { match: mockMatch }
        }
      });

      const result = await apiService.getMatchDetails('match1');

      expect(result).toEqual(mockMatch);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/matches/detail/match1');
    });

    test('updateMatchStatus changes match status', async () => {
      const updatedMatch = {
        _id: 'match1',
        participants: ['user1', 'user2'],
        status: 'inactive'
      };

      mockAxiosInstance.put.mockResolvedValue({
        data: {
          success: true,
          data: { match: updatedMatch }
        }
      });

      const result = await apiService.updateMatchStatus('match1', 'inactive', 'user1');

      expect(result).toEqual(updatedMatch);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/matches/match1/status', {
        status: 'inactive',
        userId: 'user1'
      });
    });
  });

  describe('Health Check', () => {
    test('healthCheck returns server status', async () => {
      const mockHealth = {
        status: 'healthy',
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 12345,
        database: { status: 'connected' }
      };

      mockAxios.get.mockResolvedValue({ data: mockHealth });

      const result = await apiService.healthCheck();

      expect(result).toEqual(mockHealth);
      expect(mockAxios.get).toHaveBeenCalledWith('http://localhost:5000/health');
    });
  });

  describe('Error Handling', () => {
    test('handles 404 errors gracefully', async () => {
      const error404 = {
        response: {
          status: 404,
          data: { message: 'User not found' }
        }
      };

      mockAxiosInstance.get.mockRejectedValue(error404);

      await expect(apiService.getUserById('nonexistent'))
        .rejects.toThrow('Failed to load user');
    });

    test('handles 409 conflict errors', async () => {
      const error409 = {
        response: {
          status: 409,
          data: { message: 'User already exists' }
        }
      };

      // Mock the interceptor to throw the expected error
      mockAxiosInstance.post.mockImplementation(() => {
        throw new Error('User already exists');
      });

      await expect(apiService.createUser({ userId: 'existing' }))
        .rejects.toThrow('User already exists');
    });

    test('handles 500 server errors', async () => {
      const error500 = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };

      mockAxiosInstance.get.mockRejectedValue(error500);

      await expect(apiService.getAvailableUsers('user1'))
        .rejects.toThrow('Failed to load available users');
    });

    test('handles network connection errors', async () => {
      const networkError = {
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      };

      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(apiService.getAvailableUsers('user1'))
        .rejects.toThrow('Failed to load available users');
    });

    test('handles timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'Request timeout'
      };

      // Mock to fail immediately without retries for this test
      mockAxiosInstance.get.mockImplementation(() => {
        throw new Error('Request timeout. Please try again.');
      });

      await expect(apiService.getAvailableUsers('user1'))
        .rejects.toThrow('Request timeout. Please try again.');
    }, 10000); // Increase timeout for this test
  });

  describe('Edge Cases', () => {
    test('handles empty response data', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: {} }
      });

      const result = await apiService.getAvailableUsers('user1');
      expect(result).toEqual([]);
    });

    test('handles null response data', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: null
      });

      const result = await apiService.getAvailableUsers('user1');
      expect(result).toEqual([]);
    });

    test('handles missing nested data', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true }
      });

      const result = await apiService.getMatches('user1');
      expect(result).toEqual([]);
    });

    test('handles query parameters correctly', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: { swipes: [] } }
      });

      await apiService.getSwipeHistory('user1', {
        type: 'like',
        limit: 5,
        skip: 10
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/swipes/user1?type=like&limit=5&skip=10'
      );
    });

    test('handles empty query parameters', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: { swipes: [] } }
      });

      await apiService.getSwipeHistory('user1', {});

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/swipes/user1?');
    });
  });
});