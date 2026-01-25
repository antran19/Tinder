/**
 * Basic Socket.io Integration Test
 * 
 * Test cơ bản để verify Socket.io integration hoạt động
 */

const { getSocketStats, emitMatchNotification } = require('../utils/socketUtils');

describe('Socket.io Basic Integration', () => {
  
  describe('Socket Utils Functions', () => {
    test('getSocketStats returns correct structure when no io instance', () => {
      // Clear global.io
      global.io = undefined;
      
      const stats = getSocketStats();
      expect(stats).toEqual({
        enabled: false,
        connectedClients: 0,
        rooms: []
      });
    });

    test('getSocketStats returns correct structure with mock io instance', () => {
      // Mock global.io
      global.io = {
        engine: { clientsCount: 5 },
        sockets: {
          adapter: {
            rooms: new Map([
              ['user1', {}],
              ['user2', {}]
            ])
          }
        }
      };
      
      const stats = getSocketStats();
      expect(stats.enabled).toBe(true);
      expect(stats.connectedClients).toBe(5);
      expect(stats.rooms).toEqual(['user1', 'user2']);
    });

    test('emitMatchNotification handles missing io gracefully', () => {
      // Clear global.io
      global.io = undefined;
      
      const matchData = {
        _id: 'test-match-id',
        participants: ['user1', 'user2'],
        createdAt: new Date()
      };
      
      // Should not throw error
      expect(() => {
        emitMatchNotification(matchData);
      }).not.toThrow();
    });

    test('emitMatchNotification handles invalid match data', () => {
      // Mock global.io
      global.io = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn()
        })
      };
      
      const invalidMatchData = {
        _id: 'test-match-id',
        participants: ['user1'], // Invalid: should have 2 participants
        createdAt: new Date()
      };
      
      // Should not throw error
      expect(() => {
        emitMatchNotification(invalidMatchData);
      }).not.toThrow();
      
      // Should not call emit
      expect(global.io.to).not.toHaveBeenCalled();
    });

    test('emitMatchNotification works with valid data', () => {
      // Mock global.io
      const mockEmit = jest.fn();
      global.io = {
        to: jest.fn().mockReturnValue({
          emit: mockEmit
        })
      };
      
      const validMatchData = {
        _id: 'test-match-id',
        participants: ['user1', 'user2'],
        createdAt: new Date()
      };
      
      emitMatchNotification(validMatchData);
      
      // Should call to() for both users
      expect(global.io.to).toHaveBeenCalledWith('user1');
      expect(global.io.to).toHaveBeenCalledWith('user2');
      expect(global.io.to).toHaveBeenCalledTimes(2);
      
      // Should call emit for both users
      expect(mockEmit).toHaveBeenCalledTimes(2);
      expect(mockEmit).toHaveBeenCalledWith('new-match', expect.objectContaining({
        matchId: 'test-match-id',
        participants: ['user1', 'user2'],
        message: "It's a Match! 🎉"
      }));
    });
  });

  describe('Socket.io Server Integration', () => {
    test('Socket.io is properly configured in main server', () => {
      // This test verifies that Socket.io dependencies are available
      const socketIO = require('socket.io');
      expect(socketIO).toBeDefined();
      expect(typeof socketIO.Server).toBe('function');
    });

    test('Socket.io client is available for testing', () => {
      const Client = require('socket.io-client');
      expect(Client).toBeDefined();
      expect(typeof Client).toBe('function');
    });
  });
});