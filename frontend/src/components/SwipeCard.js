import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SwipeCard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
};

const INTEREST_ICONS = {
  'Du lịch': '✈️', 'Âm nhạc': '🎵', 'Thể thao': '⚽', 'Nấu ăn': '🍳',
  'Đọc sách': '📚', 'Phim ảnh': '🎬', 'Gaming': '🎮', 'Yoga': '🧘',
  'Nhiếp ảnh': '📷', 'Thời trang': '👗', 'Công nghệ': '💻', 'Nghệ thuật': '🎨',
  'Cà phê': '☕', 'Thú cưng': '🐾', 'Gym': '💪', 'Nhảy': '💃',
  'Thiên nhiên': '🌿', 'Ẩm thực': '🍜', 'Xe cộ': '🏎️', 'Bơi lội': '🏊',
};

const SwipeCard = ({ user, onSwipe, loading = false, disabled = false, isBehind = false }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Drag state
  const cardRef = useRef(null);
  const [dragStart, setDragStart] = useState(null);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeLabel, setSwipeLabel] = useState(null); // 'LIKE', 'NOPE', 'SUPER'

  const SWIPE_THRESHOLD = 100;
  const SWIPE_UP_THRESHOLD = 80;

  // Mouse handlers
  const handleMouseDown = (e) => {
    if (disabled || isBehind || showDetails) return;
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragDelta({ x: dx, y: dy });

    if (dx > SWIPE_THRESHOLD * 0.5) setSwipeLabel('LIKE');
    else if (dx < -SWIPE_THRESHOLD * 0.5) setSwipeLabel('NOPE');
    else if (dy < -SWIPE_UP_THRESHOLD * 0.5) setSwipeLabel('SUPER LIKE');
    else setSwipeLabel(null);
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    if (dragDelta.x > SWIPE_THRESHOLD) {
      onSwipe('like');
    } else if (dragDelta.x < -SWIPE_THRESHOLD) {
      onSwipe('pass');
    } else if (dragDelta.y < -SWIPE_UP_THRESHOLD) {
      onSwipe('super_like');
    }

    setDragStart(null);
    setDragDelta({ x: 0, y: 0 });
    setIsDragging(false);
    setSwipeLabel(null);
  }, [isDragging, dragDelta, onSwipe]);

  // Touch handlers
  const handleTouchStart = (e) => {
    if (disabled || isBehind || showDetails) return;
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || !dragStart) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.x;
    const dy = touch.clientY - dragStart.y;
    setDragDelta({ x: dx, y: dy });

    if (dx > SWIPE_THRESHOLD * 0.5) setSwipeLabel('LIKE');
    else if (dx < -SWIPE_THRESHOLD * 0.5) setSwipeLabel('NOPE');
    else if (dy < -SWIPE_UP_THRESHOLD * 0.5) setSwipeLabel('SUPER LIKE');
    else setSwipeLabel(null);
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event) => {
    if (disabled || loading || isBehind) return;
    switch (event.key) {
      case 'ArrowLeft': case 'x': case 'X':
        event.preventDefault(); onSwipe('pass'); break;
      case 'ArrowRight': case 'l': case 'L':
        event.preventDefault(); onSwipe('like'); break;
      case 'ArrowUp': case 's': case 'S':
        event.preventDefault(); onSwipe('super_like'); break;
      default: break;
    }
  }, [onSwipe, disabled, loading, isBehind]);

  useEffect(() => {
    if (!isBehind) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, isBehind]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setShowDetails(false);
  }, [user]);

  if (!user && !loading) return null;

  if (loading) {
    return (
      <div className="tinder-card loading-card">
        <div className="card-skeleton"></div>
      </div>
    );
  }

  const displayName = user.firstName || user.name || user.userId || 'Unknown';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const isOnline = user.isOnline || false;
  const images = user.images || [];
  const interests = user.interests || [];
  const details = user.profileDetails || {};
  const hasImages = images.length > 0;

  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const age = user.age || calculateAge(user.birthday);

  // Tap left/right half of image to navigate photos
  const handleImageClick = (e) => {
    if (images.length <= 1 || isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    } else {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const zodiacLabels = {
    aries: '♈ Bạch Dương', taurus: '♉ Kim Ngưu', gemini: '♊ Song Tử',
    cancer: '♋ Cự Giải', leo: '♌ Sư Tử', virgo: '♍ Xử Nữ',
    libra: '♎ Thiên Bình', scorpio: '♏ Bọ Cạp', sagittarius: '♐ Nhân Mã',
    capricorn: '♑ Ma Kết', aquarius: '♒ Bảo Bình', pisces: '♓ Song Ngư'
  };

  const lookingForLabels = {
    'relationship': '💑 Mối quan hệ nghiêm túc',
    'casual': '🤙 Thoải mái',
    'friendship': '🤝 Kết bạn',
    'not-sure': '🤔 Chưa chắc'
  };

  // Drag transform
  const rotation = dragDelta.x * 0.08;
  const cardStyle = isDragging ? {
    transform: `translate(${dragDelta.x}px, ${dragDelta.y}px) rotate(${rotation}deg)`,
    transition: 'none',
    cursor: 'grabbing',
  } : {
    transform: 'translate(0, 0) rotate(0deg)',
    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'grab',
  };

  // Label opacity based on drag distance
  const likeOpacity = Math.min(dragDelta.x / SWIPE_THRESHOLD, 1);
  const nopeOpacity = Math.min(-dragDelta.x / SWIPE_THRESHOLD, 1);
  const superOpacity = Math.min(-dragDelta.y / SWIPE_UP_THRESHOLD, 1);

  return (
    <div
      ref={cardRef}
      className={`tinder-card ${isBehind ? 'behind' : ''}`}
      style={!isBehind ? cardStyle : undefined}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Swipe Labels */}
      {!isBehind && (
        <>
          <div className="swipe-label like-label" style={{ opacity: Math.max(0, likeOpacity) }}>
            LIKE
          </div>
          <div className="swipe-label nope-label" style={{ opacity: Math.max(0, nopeOpacity) }}>
            NOPE
          </div>
          <div className="swipe-label super-label" style={{ opacity: Math.max(0, superOpacity) }}>
            SUPER LIKE
          </div>
        </>
      )}

      {/* Image Area */}
      <div className="tinder-card-image" onClick={handleImageClick}>
        {hasImages ? (
          <>
            <img src={getImageUrl(images[currentImageIndex])} alt={displayName} draggable={false} />
            {images.length > 1 && (
              <div className="tinder-image-bars">
                {images.map((_, idx) => (
                  <div key={idx} className={`image-bar ${idx === currentImageIndex ? 'active' : ''} ${idx < currentImageIndex ? 'viewed' : ''}`} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="tinder-card-avatar">{avatarLetter}</div>
        )}

        <div className="tinder-card-gradient" />

        {isOnline && (
          <div className="tinder-online-badge">
            <span className="online-pulse"></span>
            Đang hoạt động
          </div>
        )}

        {/* Bottom info overlay */}
        <div className="tinder-card-info" onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}>
          <div className="tinder-name-row">
            <h2>{displayName} <span className="tinder-age">{age || ''}</span></h2>
            {user.isVerified && <span className="tinder-verified">✓</span>}
          </div>

          {details.occupation && (
            <p className="tinder-occupation">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>
              {details.occupation}
            </p>
          )}

          {details.education && (
            <p className="tinder-education">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
              {details.education}
            </p>
          )}

          {details.location && (
            <p className="tinder-location">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              {details.location}
            </p>
          )}

          {user.distance != null && (
            <p className="tinder-distance">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              Cách {user.distance < 1 ? 'dưới 1' : user.distance} km
            </p>
          )}

          <div className="tinder-expand-hint">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white" style={{transform: showDetails ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s'}}>
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="tinder-card-details">
          {user.bio && (
            <div className="detail-bio"><p>{user.bio}</p></div>
          )}
          {interests.length > 0 && (
            <div className="detail-interests">
              <h4>Sở thích</h4>
              <div className="interest-chips">
                {interests.map((interest, idx) => (
                  <span key={idx} className="interest-chip">
                    {INTEREST_ICONS[interest] || '✨'} {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="detail-essentials">
            {user.gender && (
              <div className="essential-item">
                <span>{user.gender === 'male' ? '👨' : '👩'}</span>
                <span>{user.gender === 'male' ? 'Nam' : 'Nữ'}</span>
              </div>
            )}
            {details.height && (
              <div className="essential-item"><span>📏</span><span>{details.height}cm</span></div>
            )}
            {details.zodiac && (
              <div className="essential-item"><span>🔮</span><span>{zodiacLabels[details.zodiac] || details.zodiac}</span></div>
            )}
            {details.lookingFor && (
              <div className="essential-item"><span>💭</span><span>{lookingForLabels[details.lookingFor] || details.lookingFor}</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipeCard;