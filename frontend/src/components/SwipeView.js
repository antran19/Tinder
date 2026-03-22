import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SwipeCard from './SwipeCard';
import StoriesBar from './StoriesBar';
import { apiService } from '../services/apiService';
import './SwipeView.css';

const SwipeView = () => {
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null); // 'granted' | 'denied' | 'loading'

  const currentUserId = user?.userId;

  // Xin quyền GPS và cập nhật vị trí
  const updateMyLocation = async () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation không được hỗ trợ');
      return false;
    }

    return new Promise((resolve) => {
      setLocationStatus('loading');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`📍 Got GPS: ${latitude}, ${longitude}`);
          
          try {
            // Reverse geocoding đơn giản qua Nominatim (miễn phí)
            let city = '';
            try {
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=vi`
              );
              const geoData = await geoRes.json();
              city = geoData?.address?.city || geoData?.address?.town || geoData?.address?.state || '';
            } catch (e) {
              console.warn('Reverse geocoding failed, skipping city name');
            }

            await apiService.updateLocation(currentUserId, latitude, longitude, city);
            setLocationStatus('granted');
          } catch (e) {
            console.error('Error updating location:', e);
          }
          resolve(true);
        },
        (err) => {
          console.warn('GPS denied or failed:', err.message);
          setLocationStatus('denied');
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  };

  useEffect(() => {
    const init = async () => {
      await updateMyLocation();
      await loadAvailableUsers();
    };
    init();
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
      setError('Không thể tải danh sách. Thử lại nhé!');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action) => {
    const currentUser = availableUsers[currentUserIndex];
    if (!currentUser) return;

    // Visual feedback
    setSwipeDirection(action);

    try {
      await apiService.createSwipe({
        fromUserId: currentUserId,
        toUserId: currentUser.userId,
        type: action
      });

      setTimeout(() => {
        setSwipeDirection(null);
        if (currentUserIndex < availableUsers.length - 1) {
          setCurrentUserIndex(currentUserIndex + 1);
        } else {
          loadAvailableUsers();
        }
      }, 300);

    } catch (err) {
      console.error('Error processing swipe:', err);
      setSwipeDirection(null);
      setError('Có lỗi xảy ra. Thử lại nhé!');
    }
  };

  if (loading) {
    return (
      <div className="swipe-view">
        <div className="swipe-loading">
          <div className="swipe-loading-cards">
            <div className="loading-card"></div>
            <div className="loading-card"></div>
          </div>
          <p>Đang tìm kiếm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="swipe-view">
        <div className="swipe-empty">
          <div className="empty-emoji">😥</div>
          <h3>{error}</h3>
          <button onClick={loadAvailableUsers} className="swipe-reload-btn">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const currentUser = availableUsers[currentUserIndex];

  if (!currentUser) {
    return (
      <div className="swipe-view">
        <div className="swipe-empty">
          <div className="empty-emoji">🔍</div>
          <h3>Hết rồi!</h3>
          <p>Không còn ai trong khu vực. Quay lại sau nhé!</p>
          <button onClick={loadAvailableUsers} className="swipe-reload-btn">
            🔄 Tải lại
          </button>
        </div>
      </div>
    );
  }

  const remaining = availableUsers.length - currentUserIndex;

  return (
    <div className="swipe-view">
      {/* Stories Bar */}
      <StoriesBar />
      
      <div className={`swipe-card-area ${swipeDirection ? `swiping-${swipeDirection}` : ''}`}>
        {/* Background card (next user) */}
        {currentUserIndex < availableUsers.length - 1 && (
          <div className="swipe-card-behind">
            <SwipeCard
              user={availableUsers[currentUserIndex + 1]}
              onSwipe={() => {}}
              disabled={true}
              isBehind={true}
            />
          </div>
        )}

        {/* Current card */}
        <div className="swipe-card-front">
          <SwipeCard
            key={currentUser.userId}
            user={currentUser}
            onSwipe={handleSwipe}
            loading={loading}
            disabled={loading}
          />
        </div>
      </div>

      {/* Action Buttons - Tinder style */}
      <div className="swipe-actions-bar">
        <button className="swipe-action-btn rewind-btn" title="Quay lại" disabled>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
          </svg>
        </button>
        <button className="swipe-action-btn pass-btn" onClick={() => handleSwipe('pass')} title="Bỏ qua">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        <button className="swipe-action-btn superlike-btn" onClick={() => handleSwipe('super_like')} title="Super Like">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </button>
        <button className="swipe-action-btn like-btn" onClick={() => handleSwipe('like')} title="Thích">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        <button className="swipe-action-btn boost-btn" title="Boost" disabled>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
          </svg>
        </button>
      </div>

      {/* Remaining counter */}
      <div className="swipe-remaining">
        {remaining} người còn lại
      </div>
    </div>
  );
};

export default SwipeView;