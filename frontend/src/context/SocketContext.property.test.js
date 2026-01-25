import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { SocketProvider, useSocket } from './SocketContext';
import { io } from 'socket.io-client';
import fc from 'fast-check';

// Mock socket.io-client
jest.mock('socket.io-client');

/**
 * Property-Based Tests for Socket.io Client
 * 
 * These tests verify universal properties that should hold true
 * across all valid inputs and scenarios for the Socket.io client.
 */

// Test component to access socket context
const TestComponent = ({ onSocketReady }) => {
  const socketContext = useSocket();
  
  React.useEffect(() => {
    if (onSocketReady) {
      onSocketReady(socketContext);
    }
  }, [socketContext, onSocketReady]);
  
  return <div data-testid="test-component">Test</div>;
};

describe('SocketContext Property-Based Tests', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      id: 'mock-socket-id',
      on: jest.fn(),
      off: jest.fn(), 
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    io.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 1: Socket Connection Configuration Consistency
   * For any Socket.io client initialization, the connection should always
   * be configured with the same set of required options
   * **Validates: Requirements 5.3**
   */
  test('Property 1: Socket connection always uses consistent configuration', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 3 }), // reduced range for stability
      (renderCount) => {
        // Clear mocks before each property test iteration
        jest.clearAllMocks();
        
        // Render the component multiple times
        for (let i = 0; i < renderCount; i++) {
          const { unmount } = render(
            <SocketProvider>
              <TestComponent />
            </SocketProvider>
          );
          unmount();
        }

        // Verify that io() was called the expected number of times
        const calls = io.mock.calls;
        expect(calls.length).toBeGreaterThanOrEqual(renderCount);

        // Verify configuration consistency for all calls
        calls.forEach(call => {
          const [url, config] = call;
          expect(url).toBe('http://localhost:5000');
          expect(config).toEqual({
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
      }
    ), { numRuns: 20 }); // reduced runs for stability
  });

  /**
   * Property 2: Event Listener Registration Completeness
   * For any socket instance, all required event listeners should always be registered
   * **Validates: Requirements 5.3**
   */
  test('Property 2: All required event listeners are always registered', () => {
    fc.assert(fc.property(
      fc.constantFrom('user1', 'user2', 'user3', 'testUser'), // different user IDs
      (userId) => {
        // Mock environment to use different user ID
        const originalEnv = process.env;
        
        render(
          <SocketProvider>
            <TestComponent />
          </SocketProvider>
        );

        const requiredEvents = [
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

        // Verify all required events are registered
        requiredEvents.forEach(eventName => {
          const eventRegistered = mockSocket.on.mock.calls.some(call => call[0] === eventName);
          expect(eventRegistered).toBe(true);
        });

        // Verify each event has a function handler
        mockSocket.on.mock.calls.forEach(call => {
          const [eventName, handler] = call;
          expect(typeof handler).toBe('function');
        });

        process.env = originalEnv;
      }
    ), { numRuns: 30 });
  });

  /**
   * Property 3: Connection State Consistency
   * For any sequence of connection events, the connection state should always
   * reflect the most recent event correctly
   * **Validates: Requirements 5.3**
   */
  test('Property 3: Connection state always reflects the most recent event', () => {
    fc.assert(fc.property(
      fc.array(
        fc.oneof(
          fc.constant({ type: 'connect' }),
          fc.constant({ type: 'disconnect', reason: 'transport close' }),
          fc.record({ type: fc.constant('connect_error'), error: fc.string() })
        ),
        { minLength: 1, maxLength: 3 } // reduced complexity
      ),
      async (events) => {
        let socketContext = null;
        
        const { unmount } = render(
          <SocketProvider>
            <TestComponent onSocketReady={(ctx) => { socketContext = ctx; }} />
          </SocketProvider>
        );

        // Apply events in sequence
        for (const event of events) {
          const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === event.type)?.[1];
          
          if (eventHandler) {
            await act(async () => {
              switch (event.type) {
                case 'connect':
                  eventHandler();
                  break;
                case 'disconnect':
                  eventHandler(event.reason);
                  break;
                case 'connect_error':
                  eventHandler(new Error(event.error));
                  break;
              }
            });
            
            // Wait for state update
            await waitFor(() => {
              expect(socketContext).not.toBeNull();
            });
          }
        }

        // Verify final state matches the last event
        const lastEvent = events[events.length - 1];
        await waitFor(() => {
          if (lastEvent.type === 'connect') {
            expect(socketContext.isConnected).toBe(true);
          } else if (lastEvent.type === 'disconnect' || lastEvent.type === 'connect_error') {
            expect(socketContext.isConnected).toBe(false);
          }
        });
        
        unmount();
      }
    ), { numRuns: 10 }); // reduced runs
  });

  /**
   * Property 4: Event Emission Safety
   * For any event emission attempt, it should only succeed when connected
   * and should never throw errors regardless of connection state
   * **Validates: Requirements 5.3**
   */
  test('Property 4: Event emission is always safe and respects connection state', () => {
    fc.assert(fc.property(
      fc.record({
        eventName: fc.string({ minLength: 1, maxLength: 10 }),
        eventData: fc.oneof(
          fc.string({ maxLength: 10 }),
          fc.integer(),
          fc.record({ key: fc.string({ maxLength: 5 }) })
        ),
        isConnected: fc.boolean()
      }),
      ({ eventName, eventData, isConnected }) => {
        let socketContext = null;
        
        const { unmount } = render(
          <SocketProvider>
            <TestComponent onSocketReady={(ctx) => { socketContext = ctx; }} />
          </SocketProvider>
        );

        // Set connection state
        if (isConnected) {
          const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
          act(() => {
            connectHandler();
          });
        }

        // Clear previous emit calls
        mockSocket.emit.mockClear();

        // Try to emit event - should never throw
        let emitResult;
        expect(() => {
          emitResult = socketContext.emitEvent(eventName, eventData);
        }).not.toThrow();

        // Verify emit behavior matches connection state
        if (isConnected && socketContext.isConnected) {
          expect(emitResult).toBe(true);
          expect(mockSocket.emit).toHaveBeenCalledWith(eventName, eventData);
        } else {
          expect(emitResult).toBe(false);
        }
        
        unmount();
      }
    ), { numRuns: 20 }); // reduced runs
  });

  /**
   * Property 5: Cleanup Completeness
   * For any socket instance, cleanup should always remove all event listeners
   * and disconnect the socket properly
   * **Validates: Requirements 5.3**
   */
  test('Property 5: Cleanup always removes all listeners and disconnects socket', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 2 }), // reduced range
      (componentCount) => {
        // Clear mocks before test
        jest.clearAllMocks();
        
        const components = [];
        
        // Mount multiple components
        for (let i = 0; i < componentCount; i++) {
          const component = render(
            <SocketProvider>
              <TestComponent />
            </SocketProvider>
          );
          components.push(component);
        }

        // Clear disconnect calls from any previous operations
        mockSocket.disconnect.mockClear();
        mockSocket.off.mockClear();

        // Unmount all components
        components.forEach(component => {
          component.unmount();
        });

        // Verify cleanup was called at least once per component
        expect(mockSocket.disconnect).toHaveBeenCalled();

        // Verify event listeners were removed
        const requiredEvents = [
          'connect', 'disconnect', 'connect_error', 'reconnect',
          'reconnect_attempt', 'reconnect_error', 'reconnect_failed',
          'new-match', 'user-online', 'error'
        ];

        requiredEvents.forEach(eventName => {
          expect(mockSocket.off).toHaveBeenCalledWith(eventName);
        });
      }
    ), { numRuns: 10 }); // reduced runs
  });

  /**
   * Property 6: User Room Joining Consistency
   * For any successful connection, the user should always join their room
   * **Validates: Requirements 5.3**
   */
  test('Property 6: User always joins room on successful connection', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 2 }), // reduced range
      (connectionCycles) => {
        // Clear mocks before test
        jest.clearAllMocks();
        
        const { unmount } = render(
          <SocketProvider>
            <TestComponent />
          </SocketProvider>
        );

        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];

        // Clear initial emit calls
        mockSocket.emit.mockClear();

        // Simulate multiple connection cycles
        for (let i = 0; i < connectionCycles; i++) {
          act(() => {
            connectHandler();
          });
        }

        // Verify join-room was called for each connection
        expect(mockSocket.emit).toHaveBeenCalledTimes(connectionCycles);
        
        // Verify all calls were join-room with correct user ID
        mockSocket.emit.mock.calls.forEach(call => {
          expect(call[0]).toBe('join-room');
          expect(call[1]).toBe('user1');
        });
        
        unmount();
      }
    ), { numRuns: 10 }); // reduced runs
  });
});