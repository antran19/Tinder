import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SwipeCard from './SwipeCard';

/**
 * SwipeCard Component Tests
 * Tests for Requirements 1.3 - Display user info for swiping
 * 
 * Test Coverage:
 * - User information display
 * - Swipe button functionality
 * - Keyboard accessibility
 * - Loading states
 * - Error handling
 * - Responsive behavior
 */

describe('SwipeCard Component', () => {
  const mockUser = {
    userId: 'user123',
    name: 'John Doe',
    age: 25,
    gender: 'Male',
    bio: 'Love hiking and photography',
    isOnline: true
  };

  const mockOnSwipe = jest.fn();

  beforeEach(() => {
    mockOnSwipe.mockClear();
  });

  describe('User Information Display', () => {
    test('displays user name and ID correctly', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('ID: user123')).toBeInTheDocument();
    });

    test('displays user avatar with first letter of name', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      const avatar = screen.getByTitle("John Doe's avatar");
      expect(avatar).toHaveTextContent('J');
    });

    test('displays additional user information when available', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      expect(screen.getByText('Age: 25')).toBeInTheDocument();
      expect(screen.getByText('Gender: Male')).toBeInTheDocument();
      expect(screen.getByText('Love hiking and photography')).toBeInTheDocument();
    });

    test('displays online status correctly', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(document.querySelector('.online-dot')).toBeInTheDocument();
    });

    test('displays offline status when user is offline', () => {
      const offlineUser = { ...mockUser, isOnline: false };
      render(<SwipeCard user={offlineUser} onSwipe={mockOnSwipe} />);
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(document.querySelector('.offline-dot')).toBeInTheDocument();
    });

    test('handles missing optional user information gracefully', () => {
      const minimalUser = {
        userId: 'user456',
        name: 'Jane Smith'
      };
      
      render(<SwipeCard user={minimalUser} onSwipe={mockOnSwipe} />);
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('ID: user456')).toBeInTheDocument();
      expect(screen.queryByText(/Age:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Gender:/)).not.toBeInTheDocument();
    });

    test('falls back to userId when name is not provided', () => {
      const userWithoutName = {
        userId: 'user789'
      };
      
      render(<SwipeCard user={userWithoutName} onSwipe={mockOnSwipe} />);
      
      expect(screen.getByText('user789')).toBeInTheDocument();
      expect(screen.getByText('ID: user789')).toBeInTheDocument();
    });

    test('truncates long bio text', () => {
      const userWithLongBio = {
        ...mockUser,
        bio: 'This is a very long bio that should be truncated because it exceeds the maximum length limit that we have set for the bio display in the SwipeCard component to ensure good user experience'
      };
      
      render(<SwipeCard user={userWithLongBio} onSwipe={mockOnSwipe} />);
      
      const bioElement = screen.getByText(/This is a very long bio/);
      expect(bioElement.textContent).toMatch(/\.\.\.$/);
    });
  });

  describe('Swipe Button Functionality', () => {
    test('calls onSwipe with "like" when like button is clicked', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      const likeButton = screen.getByLabelText('Like this user');
      fireEvent.click(likeButton);
      
      expect(mockOnSwipe).toHaveBeenCalledWith('like');
      expect(mockOnSwipe).toHaveBeenCalledTimes(1);
    });

    test('calls onSwipe with "pass" when pass button is clicked', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      const passButton = screen.getByLabelText('Pass on this user');
      fireEvent.click(passButton);
      
      expect(mockOnSwipe).toHaveBeenCalledWith('pass');
      expect(mockOnSwipe).toHaveBeenCalledTimes(1);
    });

    test('disables buttons when disabled prop is true', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} disabled={true} />);
      
      const likeButton = screen.getByLabelText('Like this user');
      const passButton = screen.getByLabelText('Pass on this user');
      
      expect(likeButton).toBeDisabled();
      expect(passButton).toBeDisabled();
      
      fireEvent.click(likeButton);
      fireEvent.click(passButton);
      
      expect(mockOnSwipe).not.toHaveBeenCalled();
    });

    test('disables buttons when loading is true', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} loading={true} />);
      
      const likeButton = screen.getByLabelText('Like this user');
      const passButton = screen.getByLabelText('Pass on this user');
      
      expect(likeButton).toBeDisabled();
      expect(passButton).toBeDisabled();
    });
  });

  describe('Keyboard Accessibility', () => {
    test('handles right arrow key for like action', async () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      
      await waitFor(() => {
        expect(mockOnSwipe).toHaveBeenCalledWith('like');
      });
    });

    test('handles left arrow key for pass action', async () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      
      await waitFor(() => {
        expect(mockOnSwipe).toHaveBeenCalledWith('pass');
      });
    });

    test('handles L key for like action', async () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      fireEvent.keyDown(document, { key: 'L' });
      
      await waitFor(() => {
        expect(mockOnSwipe).toHaveBeenCalledWith('like');
      });
    });

    test('handles X key for pass action', async () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      fireEvent.keyDown(document, { key: 'X' });
      
      await waitFor(() => {
        expect(mockOnSwipe).toHaveBeenCalledWith('pass');
      });
    });

    test('ignores keyboard input when disabled', async () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} disabled={true} />);
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      fireEvent.keyDown(document, { key: 'L' });
      
      await waitFor(() => {
        expect(mockOnSwipe).not.toHaveBeenCalled();
      });
    });

    test('ignores keyboard input when loading', async () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} loading={true} />);
      
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      fireEvent.keyDown(document, { key: 'X' });
      
      await waitFor(() => {
        expect(mockOnSwipe).not.toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    test('displays loading state correctly', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} loading={true} />);
      
      expect(document.querySelector('.loading-card')).toBeInTheDocument();
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
      expect(document.querySelector('.loading-text')).toBeInTheDocument();
    });

    test('shows disabled buttons in loading state', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} loading={true} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when user is null and not loading', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<SwipeCard user={null} onSwipe={mockOnSwipe} />);
      
      expect(screen.getByText('Error: No user data available')).toBeInTheDocument();
      expect(document.querySelector('.error-card')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    test('displays error message when user is undefined and not loading', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<SwipeCard onSwipe={mockOnSwipe} />);
      
      expect(screen.getByText('Error: No user data available')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    test('does not show error when loading is true even if user is null', () => {
      render(<SwipeCard user={null} onSwipe={mockOnSwipe} loading={true} />);
      
      expect(screen.queryByText('Error: No user data available')).not.toBeInTheDocument();
      expect(document.querySelector('.loading-card')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    test('includes proper ARIA labels for buttons', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      expect(screen.getByLabelText('Like this user')).toBeInTheDocument();
      expect(screen.getByLabelText('Pass on this user')).toBeInTheDocument();
    });

    test('includes helpful title attributes', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      expect(screen.getByTitle("John Doe's avatar")).toBeInTheDocument();
      expect(screen.getByTitle('John Doe')).toBeInTheDocument();
      expect(screen.getByTitle('User ID: user123')).toBeInTheDocument();
    });

    test('displays keyboard hints for user guidance', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      expect(screen.getByText('← X to Pass')).toBeInTheDocument();
      expect(screen.getByText('L → to Like')).toBeInTheDocument();
    });
  });

  describe('Component Styling', () => {
    test('applies correct CSS classes', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      expect(document.querySelector('.swipe-card')).toBeInTheDocument();
      expect(document.querySelector('.card-content')).toBeInTheDocument();
      expect(document.querySelector('.user-avatar')).toBeInTheDocument();
      expect(document.querySelector('.user-info')).toBeInTheDocument();
      expect(document.querySelector('.swipe-actions')).toBeInTheDocument();
    });

    test('applies disabled class when disabled', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} disabled={true} />);
      
      expect(document.querySelector('.swipe-card.disabled')).toBeInTheDocument();
    });

    test('applies loading class when loading', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} loading={true} />);
      
      expect(document.querySelector('.swipe-card.loading-card')).toBeInTheDocument();
    });
  });
});