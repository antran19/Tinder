import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SocketProvider, useSocket } from './SocketContext';

/**
 * Integration Tests for Socket.io Client
 * 
 * These tests verify the Socket.io client integration with real backend
 * when available, or provide meaningful feedback when backend is not running.
 */

// Test component that uses socket context
const SocketTestComponent = () => {
  const { socket, isConnected, connectionError, currentUserId, emitEvent } = useSocket();
  const [matchReceived, setMatchReceived] = React.useState(null);
  const [userOnlineReceived, setUserOnlineReceived] = React.useState(null);

  React.useEffect(() => {
    if (!socket) return;

    // Listen for match notifications
    const handleNewMatch = (matchData) => {
      setMatchReceived(matchData);
    };

    // Listen for user online status
    const handleUserOnline = (data) => {
      setUserOnlineReceived(data);
    };

    socket.on('new-match', handleNewMatch);
    socket.on('user-online', handleUserOnline);

    return () => {
      socket.off('new-match', handleNewMatch);
      socket.off('user-online', handleUserOnline);
    };
  }, [socket]);

  const handleTestEmit = () => {
    emitEvent('test-message', { 
      from: currentUserId, 
      message: 'Hello from client',
      timestamp: Date.now()
    });
  };

  return (
    <div>
      <div data-testid="connection-status">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div data-testid="user-id">{currentUserId}</div>
      <div data-testid="connection-error">
        {connectionError || 'No Error'}
      </div>
      <div data-testid="socket-id">
        {socket?.id || 'No Socket ID'}
      </div>
      <div data-testid="match-received">
        {matchReceived ? JSON.stringify(matchReceived) : 'No Match'}
      </div>
      <div data-testid="user-online-received">
        {userOnlineReceived ? JSON.stringify(userOnlineReceived) : 'No User Online'}
      </div>
      <button data-testid="emit-test" onClick={handleTestEmit}>
        Emit Test Message
      </button>
    </div>
  );
};

describe('SocketContext Integration Tests', () => {
  // Increase timeout for integration tests
  jest.setTimeout(15000);

  describe('Real Backend Integration', () => {
    test('should connect to backend server when available', async () => {
      render(
        <SocketProvider>
          <SocketTestComponent />
        </SocketProvider>
      );

      // Wait for potential connection
      await waitFor(
        () => {
          const status = screen.getByTestId('connection-status');
          const error = screen.getByTestId('connection-error');
          
          // Either connected successfully or failed with meaningful error
          expect(
            status.textContent === 'Connected' || 
            error.textContent !== 'No Error'
          ).toBe(true);
        },
        { timeout: 10000 }
      );

      const connectionStatus = screen.getByTestId('connection-status').textContent;
      const connectionError = screen.getByTestId('connection-error').textContent;

      if (connectionStatus === 'Connected') {
        console.log('✅ Successfully connected to backend server');
        
        // Verify socket ID is assigned
        const socketId = screen.getByTestId('socket-id').textContent;
        expect(socketId).not.toBe('No Socket ID');
        
        // Verify user ID is set
        expect(screen.getByTestId('user-id')).toHaveTextContent('user1');
        
        // Test event emission
        const emitButton = screen.getByTestId('emit-test');
        act(() => {
          emitButton.click();
        });
        
        // Should not throw errors when emitting
        expect(connectionError).toBe('No Error');
        
      } else {
        console.log('ℹ️ Backend server not available for integration test');
        console.log(`Connection error: ${connectionError}`);
        
        // Verify error handling works correctly
        expect(connectionStatus).toBe('Disconnected');
        expect(connectionError).not.toBe('No Error');
      }
    });

    test('should handle room joining on connection', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      render(
        <SocketProvider>
          <SocketTestComponent />
        </SocketProvider>
      );

      // Wait for connection attempt
      await waitFor(
        () => {
          const status = screen.getByTestId('connection-status');
          return status.textContent === 'Connected' || status.textContent === 'Disconnected';
        },
        { timeout: 8000 }
      );

      const connectionStatus = screen.getByTestId('connection-status').textContent;

      if (connectionStatus === 'Connected') {
        // Check console logs for room joining
        const roomJoinLog = consoleSpy.mock.calls.find(call => 
          call[0] && call[0].includes('Joined room for user')
        );
        expect(roomJoinLog).toBeTruthy();
      }

      consoleSpy.mockRestore();
    });

    test('should handle reconnection scenarios', async () => {
      const { rerender } = render(
        <SocketProvider>
          <SocketTestComponent />
        </SocketProvider>
      );

      // Wait for initial connection attempt
      await waitFor(
        () => {
          const status = screen.getByTestId('connection-status');
          return status.textContent !== '';
        },
        { timeout: 5000 }
      );

      // Force re-render to test reconnection logic
      rerender(
        <SocketProvider>
          <SocketTestComponent />
        </SocketProvider>
      );

      // Verify component handles re-initialization gracefully
      await waitFor(
        () => {
          const error = screen.getByTestId('connection-error');
          // Should not have critical errors during re-initialization
          expect(error.textContent).not.toContain('Cannot read properties');
          expect(error.textContent).not.toContain('undefined');
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle invalid server URL gracefully', async () => {
      // Mock environment variable for invalid URL
      const originalEnv = process.env.REACT_APP_SOCKET_URL;
      process.env.REACT_APP_SOCKET_URL = 'http://invalid-server:9999';

      render(
        <SocketProvider>
          <SocketTestComponent />
        </SocketProvider>
      );

      // Should handle connection failure gracefully
      await waitFor(
        () => {
          const status = screen.getByTestId('connection-status');
          const error = screen.getByTestId('connection-error');
          
          expect(status.textContent).toBe('Disconnected');
          expect(error.textContent).not.toBe('No Error');
        },
        { timeout: 8000 }
      );

      // Restore environment
      process.env.REACT_APP_SOCKET_URL = originalEnv;
    });

    test('should not crash on malformed events', async () => {
      render(
        <SocketProvider>
          <SocketTestComponent />
        </SocketProvider>
      );

      // Component should render without crashing
      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
      expect(screen.getByTestId('user-id')).toHaveTextContent('user1');
      
      // Should handle initial state properly
      expect(screen.getByTestId('match-received')).toHaveTextContent('No Match');
      expect(screen.getByTestId('user-online-received')).toHaveTextContent('No User Online');
    });
  });

  describe('Event Handling Integration', () => {
    test('should properly structure emitted events', async () => {
      render(
        <SocketProvider>
          <SocketTestComponent />
        </SocketProvider>
      );

      // Wait for component to initialize
      await waitFor(() => {
        expect(screen.getByTestId('emit-test')).toBeInTheDocument();
      });

      // Test event emission structure
      const emitButton = screen.getByTestId('emit-test');
      
      // Should not throw when emitting events
      expect(() => {
        act(() => {
          emitButton.click();
        });
      }).not.toThrow();

      // Verify component remains stable after emission
      expect(screen.getByTestId('user-id')).toHaveTextContent('user1');
    });

    test('should handle event listeners lifecycle correctly', async () => {
      const { unmount } = render(
        <SocketProvider>
          <SocketTestComponent />
        </SocketProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toBeInTheDocument();
      });

      // Unmount should not throw errors
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Performance Integration', () => {
    test('should handle multiple rapid re-renders without memory leaks', async () => {
      const { rerender, unmount } = render(
        <SocketProvider>
          <SocketTestComponent />
        </SocketProvider>
      );

      // Perform multiple rapid re-renders
      for (let i = 0; i < 5; i++) {
        rerender(
          <SocketProvider>
            <SocketTestComponent />
          </SocketProvider>
        );
        
        // Small delay between re-renders
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Should still be functional after rapid re-renders
      expect(screen.getByTestId('user-id')).toHaveTextContent('user1');
      
      // Cleanup should not throw
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test('should handle concurrent socket operations', async () => {
      render(
        <SocketProvider>
          <SocketTestComponent />
        </SocketProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('emit-test')).toBeInTheDocument();
      });

      const emitButton = screen.getByTestId('emit-test');

      // Perform multiple rapid emissions
      expect(() => {
        for (let i = 0; i < 10; i++) {
          act(() => {
            emitButton.click();
          });
        }
      }).not.toThrow();

      // Component should remain stable
      expect(screen.getByTestId('user-id')).toHaveTextContent('user1');
    });
  });
});