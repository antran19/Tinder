import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SwipeView from './SwipeView';
import { apiService } from '../services/apiService';

// Mock the API service
jest.mock('../services/apiService');

/**
 * SwipeView Integration Tests
 * Tests the complete swipe flow integration
 * Requirements: 2.1, 2.2, 3.2 - Complete swipe flow with API integration and match notifications
 */
describe('SwipeView Integration Tests', () => {
  const mockUsers = [
    {
      userId: 'user2',
      name: 'Jane Smith',
      isOnline: true
    },
    {
      userId: 'user3', 
      name: 'Bob Johnson',
      isOnline: false
    },
    {
      userId: 'user4',
      name: 'Alice Brown',
      isOnline: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses by default
    apiService.getAvailableUsers.mockResolvedValue(mockUsers);
    apiService.createSwipe.mockResolvedValue({
      success: true,
      match: false
    });
  });

  const renderSwipeView = () => {
    return render(<SwipeView />);
  };

  describe('Initial Loading and User Display', () => {
    test('loads available users on mount', async () => {
      renderSwipeView();

      // Should show loading initially
      expect(screen.getByText('Loading users...')).toBeInTheDocument();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Verify API was called
      expect(apiService.getAvailableUsers).toHaveBeenCalledWith('user1');
      expect(apiService.getAvailableUsers).toHaveBeenCalledTimes(1);
    });

    test('displays user count correctly', async () => {
      renderSwipeView();

      await waitFor(() => {
        expect(screen.getByText('3 users remaining')).toBeInTheDocument();
      });
    });

    test('displays first user from available users', async () => {
      renderSwipeView();

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('ID: user2')).toBeInTheDocument();
      });
    });
  });

  describe('Swipe Actions Integration', () => {
    test('processes like action and moves to next user', async () => {
      renderSwipeView();

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Click like button
      const likeButton = screen.getByLabelText('Like this user');
      fireEvent.click(likeButton);

      // Verify API call
      await waitFor(() => {
        expect(apiService.createSwipe).toHaveBeenCalledWith({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        });
      });

      // Should move to next user
      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
        expect(screen.getByText('2 users remaining')).toBeInTheDocument();
      });
    });

    test('processes pass action and moves to next user', async () => {
      renderSwipeView();

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Click pass button
      const passButton = screen.getByLabelText('Pass on this user');
      fireEvent.click(passButton);

      // Verify API call
      await waitFor(() => {
        expect(apiService.createSwipe).toHaveBeenCalledWith({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'pass'
        });
      });

      // Should move to next user
      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    test('handles match creation during swipe', async () => {
      // Mock match response
      apiService.createSwipe.mockResolvedValue({
        success: true,
        match: true,
        matchData: {
          _id: 'match123',
          participants: ['user1', 'user2'],
          createdAt: new Date().toISOString()
        }
      });

      renderSwipeView();

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Click like button
      const likeButton = screen.getByLabelText('Like this user');
      fireEvent.click(likeButton);

      // Verify API call
      await waitFor(() => {
        expect(apiService.createSwipe).toHaveBeenCalledWith({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        });
      });

      // Should still move to next user even with match
      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });
  });

  describe('End of Users Flow', () => {
    test('shows no more users message when all users are swiped', async () => {
      // Mock with only one user
      apiService.getAvailableUsers.mockResolvedValue([mockUsers[0]]);

      renderSwipeView();

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Swipe on the only user
      const likeButton = screen.getByLabelText('Like this user');
      fireEvent.click(likeButton);

      // Should show no more users message
      await waitFor(() => {
        expect(screen.getByText('No more users to swipe!')).toBeInTheDocument();
        expect(screen.getByText('Check back later for new people to meet.')).toBeInTheDocument();
      });
    });

    test('refresh button reloads available users', async () => {
      // Mock with no users initially
      apiService.getAvailableUsers.mockResolvedValueOnce([]);

      renderSwipeView();

      // Wait for no users message
      await waitFor(() => {
        expect(screen.getByText('No more users to swipe!')).toBeInTheDocument();
      });

      // Mock users for refresh
      apiService.getAvailableUsers.mockResolvedValueOnce(mockUsers);

      // Click refresh button
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      // Should load users again
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      expect(apiService.getAvailableUsers).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    test('displays error message when loading users fails', async () => {
      apiService.getAvailableUsers.mockRejectedValue(new Error('Network error'));

      renderSwipeView();

      await waitFor(() => {
        expect(screen.getByText('Failed to load users. Please try again.')).toBeInTheDocument();
      });
    });

    test('retry button reloads users after error', async () => {
      // Mock error first, then success
      apiService.getAvailableUsers
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockUsers);

      renderSwipeView();

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Failed to load users. Please try again.')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      // Should load users successfully
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    test('displays error when swipe action fails', async () => {
      apiService.createSwipe.mockRejectedValue(new Error('Swipe failed'));

      renderSwipeView();

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Click like button
      const likeButton = screen.getByLabelText('Like this user');
      fireEvent.click(likeButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Failed to process swipe. Please try again.')).toBeInTheDocument();
      });

      // Should not move to next user
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('UI State Management', () => {
    test('shows loading state during initial load', () => {
      renderSwipeView();

      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });

    test('updates user count as users are swiped', async () => {
      renderSwipeView();

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('3 users remaining')).toBeInTheDocument();
      });

      // Swipe on first user
      const likeButton = screen.getByLabelText('Like this user');
      fireEvent.click(likeButton);

      // Count should decrease
      await waitFor(() => {
        expect(screen.getByText('2 users remaining')).toBeInTheDocument();
      });
    });

    test('maintains proper component state during swipes', async () => {
      renderSwipeView();

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Swipe through all users
      for (let i = 0; i < mockUsers.length; i++) {
        const likeButton = screen.getByLabelText('Like this user');
        fireEvent.click(likeButton);
        
        if (i < mockUsers.length - 1) {
          await waitFor(() => {
            expect(screen.getByText(mockUsers[i + 1].name)).toBeInTheDocument();
          });
        }
      }

      // Should show no more users
      await waitFor(() => {
        expect(screen.getByText('No more users to swipe!')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Integration', () => {
    test('keyboard shortcuts work through SwipeCard integration', async () => {
      renderSwipeView();

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Use keyboard shortcut for like
      fireEvent.keyDown(document, { key: 'ArrowRight' });

      // Verify API call
      await waitFor(() => {
        expect(apiService.createSwipe).toHaveBeenCalledWith({
          fromUserId: 'user1',
          toUserId: 'user2',
          type: 'like'
        });
      });

      // Should move to next user
      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });
  });
});