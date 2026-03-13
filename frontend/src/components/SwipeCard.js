import React, { useState, useEffect, useCallback } from 'react';
import './SwipeCard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
};

// Danh sách sở thích có sẵn với icon
const INTEREST_ICONS = {
  'Du lịch': '✈️', 'Âm nhạc': '🎵', 'Thể thao': '⚽', 'Nấu ăn': '🍳',
  'Đọc sách': '📚', 'Phim ảnh': '🎬', 'Gaming': '🎮', 'Yoga': '🧘',
  'Nhiếp ảnh': '📷', 'Thời trang': '👗', 'Công nghệ': '💻', 'Nghệ thuật': '🎨',
  'Cà phê': '☕', 'Thú cưng': '🐾', 'Gym': '💪', 'Nhảy': '💃',
  'Thiên nhiên': '🌿', 'Ẩm thực': '🍜', 'Xe cộ': '🏎️', 'Bơi lội': '🏊',
};

/**
 * SwipeCard Component - Phiên bản nâng cao
 * Hiển thị thẻ người dùng với ảnh gallery, sở thích, và thông tin chi tiết
 */
const SwipeCard = ({ user, onSwipe, loading = false, disabled = false }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const handleLike = useCallback(() => {
    if (disabled || loading) return;
    onSwipe('like');
  }, [onSwipe, disabled, loading]);

  const handleSuperLike = useCallback(() => {
    if (disabled || loading) return;
    onSwipe('super_like');
  }, [onSwipe, disabled, loading]);

  const handlePass = useCallback(() => {
    if (disabled || loading) return;
    onSwipe('pass');
  }, [onSwipe, disabled, loading]);

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
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset image index khi chuyển user
  useEffect(() => {
    setCurrentImageIndex(0);
    setShowDetails(false);
  }, [user]);

  if (!user && !loading) {
    return (
      <div className="swipe-card error-card">
        <div className="error-message"><p>Error: No user data available</p></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="swipe-card loading-card">
        <div className="card-content">
          <div className="user-avatar loading-avatar"><div className="loading-spinner"></div></div>
          <div className="user-info">
            <div className="loading-text"></div>
            <div className="loading-text short"></div>
          </div>
        </div>
        <div className="swipe-actions">
          <button className="swipe-btn pass-btn" disabled aria-label="Pass">✕</button>
          <button className="swipe-btn like-btn" disabled aria-label="Like">♥</button>
        </div>
      </div>
    );
  }

  const displayName = user.firstName || user.name || user.userId || 'Unknown User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const isOnline = user.isOnline || false;
  const images = user.images || [];
  const interests = user.interests || [];
  const details = user.profileDetails || {};

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
  const hasImages = images.length > 0;

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Zodiac labels
  const zodiacLabels = {
    aries: '♈ Bạch Dương', taurus: '♉ Kim Ngưu', gemini: '♊ Song Tử',
    cancer: '♋ Cự Giải', leo: '♌ Sư Tử', virgo: '♍ Xử Nữ',
    libra: '♎ Thiên Bình', scorpio: '♏ Bọ Cạp', sagittarius: '♐ Nhân Mã',
    capricorn: '♑ Ma Kết', aquarius: '♒ Bảo Bình', pisces: '♓ Song Ngư'
  };

  const lookingForLabels = {
    'relationship': '💑 Mối quan hệ nghiêm túc',
    'casual': '🤙 Gặp gỡ thoải mái',
    'friendship': '🤝 Kết bạn',
    'not-sure': '🤔 Chưa chắc chắn'
  };

  return (
    <div className={`swipe-card ${disabled ? 'disabled' : ''} ${hasImages ? 'has-images' : ''}`}>
      <div className="card-content">
        {/* Ảnh Gallery */}
        {hasImages ? (
          <div className="card-image-gallery">
            <img
              src={getImageUrl(images[currentImageIndex])}
              alt={displayName}
              className="gallery-image"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {/* Image indicators */}
            {images.length > 1 && (
              <>
                <div className="image-indicators">
                  {images.map((_, idx) => (
                    <div key={idx} className={`indicator ${idx === currentImageIndex ? 'active' : ''}`} />
                  ))}
                </div>
                <button className="gallery-nav prev" onClick={prevImage}>‹</button>
                <button className="gallery-nav next" onClick={nextImage}>›</button>
              </>
            )}
            {/* Overlay info */}
            <div className="card-overlay-info">
              <div className="overlay-name-row">
                <h3>{displayName}{age ? `, ${age}` : ''}</h3>
                {user.isVerified && <span className="verified-badge">✓</span>}
              </div>
              {details.occupation && <p className="overlay-occupation">{details.occupation}</p>}
              {isOnline && <span className="overlay-online-dot">● Trực tuyến</span>}
            </div>
          </div>
        ) : (
          <div className="user-avatar" title={`${displayName}'s avatar`}>
            {avatarLetter}
          </div>
        )}

        <div className="user-info">
          {!hasImages && (
            <h3 className="user-name" title={displayName}>
              {displayName}{age ? `, ${age}` : ''}
              {user.isVerified && <span className="verified-badge-inline">✓</span>}
            </h3>
          )}

          {/* Quick Info Tags */}
          <div className="user-meta">
            {user.gender && (
              <span className="meta-tag">{user.gender === 'male' ? 'Nam ♂' : 'Nữ ♀'}</span>
            )}
            {details.location && <span className="meta-tag">📍 {details.location}</span>}
            {details.height && <span className="meta-tag">📏 {details.height}cm</span>}
            {details.zodiac && <span className="meta-tag">{zodiacLabels[details.zodiac] || details.zodiac}</span>}
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="user-bio" title={user.bio}>
              {user.bio.length > 120 ? `${user.bio.substring(0, 120)}...` : user.bio}
            </p>
          )}

          {/* Interest Tags */}
          {interests.length > 0 && (
            <div className="interest-tags">
              {interests.slice(0, 6).map((interest, idx) => (
                <span key={idx} className="interest-tag">
                  {INTEREST_ICONS[interest] || '✨'} {interest}
                </span>
              ))}
              {interests.length > 6 && (
                <span className="interest-tag more">+{interests.length - 6}</span>
              )}
            </div>
          )}

          {/* Looking For */}
          {details.lookingFor && (
            <div className="looking-for-tag">
              {lookingForLabels[details.lookingFor] || details.lookingFor}
            </div>
          )}

          {/* Thông tin chi tiết (mở rộng) */}
          {(details.education || details.occupation) && (
            <button className="details-toggle" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? 'Ẩn chi tiết ▴' : 'Xem thêm ▾'}
            </button>
          )}

          {showDetails && (
            <div className="detail-section">
              {details.education && <p>🎓 {details.education}</p>}
              {details.occupation && <p>💼 {details.occupation}</p>}
            </div>
          )}

          {!hasImages && (
            <div className="user-status">
              {isOnline ? (
                <div className="online-status"><span className="online-dot"></span> Online</div>
              ) : (
                <div className="offline-status"><span className="offline-dot"></span> Offline</div>
              )}
            </div>
          )}
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
          className="swipe-btn super-like-btn"
          onClick={handleSuperLike}
          disabled={disabled || loading}
          title="Super Like (Press S)"
          aria-label="Super Like this user"
        >
          ⭐
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