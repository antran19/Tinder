import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SocketProvider, useSocket } from './SocketContext';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

// Test component to access socket context
const TestComponent = () => {
  const { socket, isConnected, connectionError, reconnectAttempts, currentUserId, emitEvent } = useSocket();
  
  return (
    <div>
      <div data-testid="connection-status">{isConnected ? 'connected' : 'disconnected'}</div>
      <div data-testid="user-id">{currentUserId}</div>
      <div data-testid="error">{connectionError || 'no-error'}</div>
      <div data-testid="reconnect-attempts">{reconnectAttempts}</div>
      <button 
        data-testid="emit-button" 
        onClick={() => emitEvent('test-event', { data: 'test' })}
      >
        Emit Event
      </button>
    </div>
  );
};

describe('SocketContext', () => {
  let mockSocket;

  beforeEach(() => {
    // Create mock socket instance
    mockSocket = {
      id: 'mock-socket-id',
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    // Mock io function to return our mock socket
    io.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Socket Connection', () => {
    test('should initialize socket connection with correct configuration', () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      expect(io).toHaveBeenCalledWith('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 5,
        forceNew: true
      });
    });

    test('should register all required event listeners', () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      const expectedEvents = [
        'connect',
        'disconnect', 
        'connect_error',
        'reconnect',
        'reconnect_attempt',
        'reconnect_error',
        'reconnect_failed',
        'new-match',
        'user-online',
        'error'
      ];

      expectedEvents.forEach(event => {
        expect(mockSocket.on).toHaveBeenCalledWith(event, expect.any(Function));
      });
    });

    test('should display current user ID', () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      expect(screen.getByTestId('user-id')).toHaveTextContent('user1');
    });
  });

  describe('Connection Events', () => {
    test('should handle successful connection', async () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      // Get the connect event handler
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];

      // Simulate connection
      act(() => {
        connectHandler();
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });

      // Should emit join-room event
      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', 'user1');
    });

    test('should handle disconnection', async () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      // First connect
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      act(() => {
        connectHandler();
      });

      // Then disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      act(() => {
        disconnectHandler('transport close');
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      });
    });

    test('should handle connection error', async () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      const testError = new Error('Connection failed');

      act(() => {
        errorHandler(testError);
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
        expect(screen.getByTestId('error')).toHaveTextContent('Connection failed');
      });
    });

    test('should handle reconnection', async () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      const reconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'reconnect')[1];

      act(() => {
        reconnectHandler(3);
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
        expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('0');
      });

      // Should rejoin room after reconnection
      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', 'user1');
    });

    test('should track reconnection attempts', async () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      const reconnectAttemptHandler = mockSocket.on.mock.calls.find(call => call[0] === 'reconnect_attempt')[1];

      act(() => {
        reconnectAttemptHandler(2);
      });

      await waitFor(() => {
        expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('2');
      });
    });

    test('should handle reconnection failure', async () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      const reconnectFailedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'reconnect_failed')[1];

      act(() => {
        reconnectFailedHandler();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to reconnect after maximum attempts');
      });
    });
  });

  describe('Event Emission', () => {
    test('should emit events when connected', async () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      // Connect first
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      act(() => {
        connectHandler();
      });

      // Wait for connection
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Emit event
      const emitButton = screen.getByTestId('emit-button');
      act(() => {
        emitButton.click();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
    });

    test('should not emit events when disconnected', () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      // Try to emit without connecting
      const emitButton = screen.getByTestId('emit-button');
      act(() => {
        emitButton.click();
      });

      // Should not call socket.emit
      expect(mockSocket.emit).not.toHaveBeenCalledWith('test-event', { data: 'test' });
    });
  });

  describe('Cleanup', () => {
    test('should cleanup event listeners and disconnect on unmount', () => {
      const { unmount } = render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      unmount();

      // Should remove all event listeners
      const expectedEvents = [
        'connect',
        'disconnect',
        'connect_error', 
        'reconnect',
        'reconnect_attempt',
        'reconnect_error',
        'reconnect_failed',
        'new-match',
        'user-online',
        'error'
      ];

      expectedEvents.forEach(event => {
        expect(mockSocket.off).toHaveBeenCalledWith(event);
      });

      // Should disconnect socket
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('useSocket Hook', () => {
    test('should throw error when used outside SocketProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSocket must be used within a SocketProvider');

      consoleSpy.mockRestore();
    });

    test('should provide socket context values', () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      // Should render without errors and show initial state
      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      expect(screen.getByTestId('user-id')).toHaveTextContent('user1');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('0');
    });
  });
});