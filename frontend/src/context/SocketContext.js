import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext'; // Mới

/**
 * Socket Context
 * Provides Socket.io connection throughout the app
 * Requirements: 5.3 - Real-time communication with Socket.io
 * 
 * Features:
 * - Automatic connection management
 * - Room joining for user notifications
 * - Connection state tracking
 * - Error handling and reconnection
 * - Event cleanup
 */

const SocketContext = createContext();

// Socket.io server URL
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth(); // Lấy user từ AuthContext
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const currentUserId = user?.userId;

  // Callback to emit events safely
  const emitEvent = useCallback((eventName, data) => {
    if (socket && isConnected) {
      socket.emit(eventName, data);
      return true;
    }
    console.warn(`Cannot emit ${eventName}: socket not connected`);
    return false;
  }, [socket, isConnected]);

  // Join user room
  const joinUserRoom = useCallback((userId) => {
    if (emitEvent('join-room', userId)) {
      console.log(`Joined room for user: ${userId}`);
    }
  }, [emitEvent]);

  useEffect(() => {
    console.log('Initializing Socket.io connection...');

    // Create socket connection with enhanced configuration
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
      forceNew: true
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket.io connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);

      // Join room logic moved to a separate useEffect for reliability
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket.io disconnected:', reason);
      setIsConnected(false);

      // Handle different disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        console.log('Server disconnected, attempting to reconnect...');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      setIsConnected(false);
      setConnectionError(error.message);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Socket.io reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);

      // Join room logic moved to a separate useEffect for reliability
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket.io reconnection attempt ${attemptNumber}`);
      setReconnectAttempts(attemptNumber);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket.io reconnection error:', error);
      setConnectionError(error.message);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Socket.io reconnection failed - max attempts reached');
      setConnectionError('Failed to reconnect after maximum attempts');
    });

    // Listen for match notifications
    newSocket.on('new-match', (matchData) => {
      console.log('New match notification received:', matchData);
      // This will be handled by MatchNotification component
    });

    // Listen for user online status updates
    newSocket.on('user-online', (data) => {
      console.log('User online status update:', data);
    });

    // Handle general errors
    newSocket.on('error', (error) => {
      console.error('Socket.io error:', error);
      setConnectionError(error.message || 'Unknown socket error');
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up Socket.io connection...');

      // Remove all listeners
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('reconnect');
      newSocket.off('reconnect_attempt');
      newSocket.off('reconnect_error');
      newSocket.off('reconnect_failed');
      newSocket.off('new-match');
      newSocket.off('user-online');
      newSocket.off('error');

      // Disconnect socket
      newSocket.disconnect();
    };
  }, []); // Run only once to establish the initial socket instance

  // Reactive Effect: Join the correct room whenever the user log-ins or reconnects
  useEffect(() => {
    if (socket && isConnected && currentUserId) {
      console.log(`📡 Emitting join-room for: ${currentUserId}`);
      socket.emit('join-room', currentUserId);
    }
  }, [socket, isConnected, currentUserId]);

  const value = {
    socket,
    isConnected,
    connectionError,
    reconnectAttempts,
    currentUserId,
    emitEvent,
    joinUserRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};