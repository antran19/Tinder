import React, { useEffect, useCallback } from 'react';
import './SwipeCard.css';

/**
 * SwipeCard Component
 * Displays individual user card with swipe actions
 * Requirements: 1.3 - Display user info for swiping
 * 
 * Features:
 * - Display user information (userId, name, online status)
 * - Simple swipe gestures using buttons (Like/Pass)
 * - Keyboard accessibility support
 * - Error handling for missing user data
 * - Responsive design
 */
const SwipeCard = ({ user, onSwipe, loading = false, disabled = false }) => {
  const handleLike = useCallback(() => {
    if (disabled || loading) return;
    onSwipe('like');
  }, [onSwipe, disabled, loading]);

  const handlePass = useCallback(() => {
    if (disabled || loading) return;
    onSwipe('pass');
  }, [onSwipe, disabled, loading]);

  // Keyboard support for accessibility
  const handleKeyDown = useCallback((event) => {
    if (disabled || loading) return;

    switch (event.key) {
      case 'ArrowLeft':
      case 'x':
      case 'X':
        event.preventDefault();
        handlePass();
        break;
      case 'ArrowRight':
      case 'l':
      case 'L':
        event.preventDefault();
        handleLike();
        break;
      default:
        break;
    }
  }, [handleLike, handlePass, disabled, loading]);

  useEffect(() => {
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Validate required props
  if (!user && !loading) {
    console.error('SwipeCard: user prop is required');
    return (
      <div className="swipe-card error-card">
        <div className="error-message">
          <p>Error: No user data available</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="swipe-card loading-card">
        <div className="card-content">
          <div className="user-avatar loading-avatar">
            <div className="loading-spinner"></div>
          </div>
          <div className="user-info">
            <div className="loading-text"></div>
            <div className="loading-text short"></div>
          </div>
        </div>
        <div className="swipe-actions">
          <button className="swipe-btn pass-btn" disabled aria-label="Pass on this user">✕</button>
          <button className="swipe-btn like-btn" disabled aria-label="Like this user">♥</button>
        </div>
      </div>
    );
  }

  // Get user display information with fallbacks
  const displayName = user.firstName || user.name || user.userId || 'Unknown User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const userId = user.userId || 'N/A';
  const isOnline = user.isOnline || false;

  // Tính tuổi từ ngày sinh
  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = user.age || calculateAge(user.birthday);

  return (
    <div className={`swipe-card ${disabled ? 'disabled' : ''}`}>
      <div className="card-content">
        <div className="user-avatar" title={`${displayName}'s avatar`}>
          {avatarLetter}
        </div>

        <div className="user-info">
          <h3 className="user-name" title={displayName}>
            {displayName}{age ? `, ${age}` : ''}
          </h3>

          <div className="user-meta">
            {user.gender && (
              <span className="meta-tag">{user.gender === 'male' ? 'Nam ♂' : 'Nữ ♀'}</span>
            )}
            <span className="user-id-text">ID: {userId}</span>
          </div>

          {user.bio && (
            <p className="user-bio" title={user.bio}>
              {user.bio.length > 100 ? `${user.bio.substring(0, 100)}...` : user.bio}
            </p>
          )}

          <div className="user-status">
            {isOnline ? (
              <div className="online-status">
                <span className="online-dot"></span>
                Online
              </div>
            ) : (
              <div className="offline-status">
                <span className="offline-dot"></span>
                Offline
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="swipe-actions">
        <button
          className="swipe-btn pass-btn"
          onClick={handlePass}
          disabled={disabled || loading}
          title="Pass (Press X or Left Arrow)"
          aria-label="Pass on this user"
        >
          ✕
        </button>
        <button
          className="swipe-btn like-btn"
          onClick={handleLike}
          disabled={disabled || loading}
          title="Like (Press L or Right Arrow)"
          aria-label="Like this user"
        >
          ♥
        </button>
      </div>

      {/* Keyboard hints */}
      <div className="keyboard-hints">
        <span>← X to Pass</span>
        <span>L → to Like</span>
      </div>
    </div>
  );
};

export default SwipeCard;