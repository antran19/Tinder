import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SwipeCard from './SwipeCard';
import { apiService } from '../services/apiService';
import './SwipeView.css';

/**
 * SwipeView Component
 * Main view for swiping through available users
 * Requirements: 1.1, 1.2, 1.3 - Display users for swiping
 */
const SwipeView = () => {
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUserId = user?.userId;

  useEffect(() => {
    loadAvailableUsers();
  }, []);

  const loadAvailableUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const users = await apiService.getAvailableUsers(currentUserId);
      setAvailableUsers(users);
      setCurrentUserIndex(0);
    } catch (err) {
      console.error('Error loading available users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action) => {
    const currentUser = availableUsers[currentUserIndex];
    if (!currentUser) return;

    try {
      // Send swipe to backend
      await apiService.createSwipe({
        fromUserId: currentUserId,
        toUserId: currentUser.userId,
        type: action // 'like' or 'pass'
      });

      // Move to next user
      if (currentUserIndex < availableUsers.length - 1) {
        setCurrentUserIndex(currentUserIndex + 1);
      } else {
        // No more users, reload
        loadAvailableUsers();
      }
    } catch (err) {
      console.error('Error processing swipe:', err);
      setError('Failed to process swipe. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="swipe-view">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="swipe-view">
        <div className="error">
          <p>{error}</p>
          <button onClick={loadAvailableUsers} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentUser = availableUsers[currentUserIndex];

  if (!currentUser) {
    return (
      <div className="swipe-view">
        <div className="no-users">
          <h2>No more users to swipe!</h2>
          <p>Check back later for new people to meet.</p>
          <button onClick={loadAvailableUsers} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="swipe-view">
      <div className="swipe-header">
        <h2>Discover People</h2>
        <p>{availableUsers.length - currentUserIndex} users remaining</p>
      </div>

      <div className="swipe-container">
        <SwipeCard
          user={currentUser}
          onSwipe={handleSwipe}
          loading={loading}
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default SwipeView;