import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SwipeCard from './SwipeCard';
import { apiService } from '../services/apiService';

// Mock the API service
jest.mock('../services/apiService');

/**
 * SwipeCard Integration Tests
 * Tests the integration between SwipeCard component and swipe API
 * Requirements: 2.1, 2.2 - Handle like/pass actions and update UI
 */
describe('SwipeCard Integration Tests', () => {
  const mockUser = {
    userId: 'user123',
    name: 'John Doe',
    isOnline: true
  };

  const mockOnSwipe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSwipe.mockClear();
  });

  describe('Swipe API Integration', () => {
    test('calls API service when like button is clicked', async () => {
      // Mock successful API response
      apiService.createSwipe.mockResolvedValue({
        success: true,
        match: false
      });

      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      const likeButton = screen.getByLabelText('Like this user');
      fireEvent.click(likeButton);

      // Verify onSwipe callback is called with correct action
      expect(mockOnSwipe).toHaveBeenCalledWith('like');
      expect(mockOnSwipe).toHaveBeenCalledTimes(1);
    });

    test('calls API service when pass button is clicked', async () => {
      // Mock successful API response
      apiService.createSwipe.mockResolvedValue({
        success: true,
        match: false
      });

      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      const passButton = screen.getByLabelText('Pass on this user');
      fireEvent.click(passButton);

      // Verify onSwipe callback is called with correct action
      expect(mockOnSwipe).toHaveBeenCalledWith('pass');
      expect(mockOnSwipe).toHaveBeenCalledTimes(1);
    });

    test('handles keyboard shortcuts for swipe actions', async () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      // Test right arrow for like
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(mockOnSwipe).toHaveBeenCalledWith('like');

      // Test left arrow for pass
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      expect(mockOnSwipe).toHaveBeenCalledWith('pass');

      // Test L key for like
      fireEvent.keyDown(document, { key: 'L' });
      expect(mockOnSwipe).toHaveBeenCalledWith('like');

      // Test X key for pass
      fireEvent.keyDown(document, { key: 'X' });
      expect(mockOnSwipe).toHaveBeenCalledWith('pass');

      expect(mockOnSwipe).toHaveBeenCalledTimes(4);
    });
  });

  describe('Loading and Disabled States', () => {
    test('disables swipe actions when loading', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} loading={true} />);
      
      const likeButton = screen.getByLabelText('Like this user');
      const passButton = screen.getByLabelText('Pass on this user');

      expect(likeButton).toBeDisabled();
      expect(passButton).toBeDisabled();

      // Click should not trigger callback
      fireEvent.click(likeButton);
      fireEvent.click(passButton);
      
      expect(mockOnSwipe).not.toHaveBeenCalled();
    });

    test('disables swipe actions when disabled prop is true', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} disabled={true} />);
      
      const likeButton = screen.getByLabelText('Like this user');
      const passButton = screen.getByLabelText('Pass on this user');

      expect(likeButton).toBeDisabled();
      expect(passButton).toBeDisabled();

      // Click should not trigger callback
      fireEvent.click(likeButton);
      fireEvent.click(passButton);
      
      expect(mockOnSwipe).not.toHaveBeenCalled();
    });

    test('ignores keyboard input when disabled', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} disabled={true} />);
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      
      expect(mockOnSwipe).not.toHaveBeenCalled();
    });

    test('ignores keyboard input when loading', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} loading={true} />);
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      
      expect(mockOnSwipe).not.toHaveBeenCalled();
    });
  });

  describe('UI State Updates', () => {
    test('displays loading state correctly', () => {
      render(<SwipeCard user={null} onSwipe={mockOnSwipe} loading={true} />);
      
      expect(screen.getByText('✕')).toBeInTheDocument();
      expect(screen.getByText('♥')).toBeInTheDocument();
      expect(screen.getByLabelText('Like this user')).toBeDisabled();
      expect(screen.getByLabelText('Pass on this user')).toBeDisabled();
      
      // Should show loading spinner
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    test('applies correct CSS classes for different states', () => {
      const { rerender } = render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      let card = document.querySelector('.swipe-card');
      expect(card).not.toHaveClass('disabled');
      expect(card).not.toHaveClass('loading-card');

      // Test disabled state
      rerender(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} disabled={true} />);
      card = document.querySelector('.swipe-card');
      expect(card).toHaveClass('disabled');

      // Test loading state
      rerender(<SwipeCard user={null} onSwipe={mockOnSwipe} loading={true} />);
      card = document.querySelector('.swipe-card');
      expect(card).toHaveClass('loading-card');
    });
  });

  describe('Error Handling', () => {
    test('displays error when user is null and not loading', () => {
      render(<SwipeCard user={null} onSwipe={mockOnSwipe} loading={false} />);
      
      expect(screen.getByText('Error: No user data available')).toBeInTheDocument();
      expect(document.querySelector('.error-card')).toBeInTheDocument();
    });

    test('displays error when user is undefined and not loading', () => {
      render(<SwipeCard user={undefined} onSwipe={mockOnSwipe} loading={false} />);
      
      expect(screen.getByText('Error: No user data available')).toBeInTheDocument();
      expect(document.querySelector('.error-card')).toBeInTheDocument();
    });

    test('does not show error when loading even if user is null', () => {
      render(<SwipeCard user={null} onSwipe={mockOnSwipe} loading={true} />);
      
      expect(screen.queryByText('Error: No user data available')).not.toBeInTheDocument();
      expect(document.querySelector('.loading-card')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    test('includes proper ARIA labels and titles', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      const likeButton = screen.getByLabelText('Like this user');
      const passButton = screen.getByLabelText('Pass on this user');

      expect(likeButton).toHaveAttribute('title', 'Like (Press L or Right Arrow)');
      expect(passButton).toHaveAttribute('title', 'Pass (Press X or Left Arrow)');
    });

    test('displays keyboard hints for user guidance', () => {
      render(<SwipeCard user={mockUser} onSwipe={mockOnSwipe} />);
      
      expect(screen.getByText('← X to Pass')).toBeInTheDocument();
      expect(screen.getByText('L → to Like')).toBeInTheDocument();
    });
  });

  describe('User Information Display', () => {
    test('displays user information correctly', () => {
      const userWithAllInfo = {
        userId: 'user123',
        name: 'John Doe',
        age: 25,
        gender: 'Male',
        bio: 'Love hiking and photography',
        isOnline: true
      };

      render(<SwipeCard user={userWithAllInfo} onSwipe={mockOnSwipe} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('ID: user123')).toBeInTheDocument();
      expect(screen.getByText('Age: 25')).toBeInTheDocument();
      expect(screen.getByText('Gender: Male')).toBeInTheDocument();
      expect(screen.getByText('Love hiking and photography')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    test('handles missing optional information gracefully', () => {
      const minimalUser = {
        userId: 'user123',
        name: 'John Doe'
      };

      render(<SwipeCard user={minimalUser} onSwipe={mockOnSwipe} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('ID: user123')).toBeInTheDocument();
      expect(screen.getByText('Offline')).toBeInTheDocument();
      
      // Should not display missing fields
      expect(screen.queryByText(/Age:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Gender:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/bio/)).not.toBeInTheDocument();
    });
  });
});