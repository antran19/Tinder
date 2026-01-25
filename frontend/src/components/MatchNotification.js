import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Mới
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import './MatchNotification.css';

/**
 * MatchNotification Component
 * Displays real-time match notifications
 * Requirements: 3.2, 5.1 - Real-time match notifications
 */
const MatchNotification = () => {
  const { user } = useAuth();
  const [notification, setNotification] = useState(null);
  const [originalMatchData, setOriginalMatchData] = useState(null); // Lưu data gốc để truyền đi
  const { socket } = useSocket();
  const navigate = useNavigate(); // Mới

  const currentUserId = user?.userId;

  useEffect(() => {
    if (socket) {
      const handleNewMatch = (matchData) => {
        console.log('Match notification received:', matchData);

        // Only show notification if current user is involved
        if (matchData.participants.includes(currentUserId)) {
          const otherUserId = matchData.matchedWith || matchData.participants.find(id => id !== currentUserId);

          setOriginalMatchData(matchData);
          setNotification({
            id: matchData.matchId || matchData._id,
            otherUserId,
            createdAt: matchData.createdAt
          });

          // Auto-hide after 10 seconds (đủ lâu để xem hiệu ứng chúc mừng)
          setTimeout(() => {
            setNotification(null);
            setOriginalMatchData(null);
          }, 10000);
        }
      };

      socket.on('new-match', handleNewMatch);

      return () => {
        socket.off('new-match', handleNewMatch);
      };
    }
  }, [socket, currentUserId]);

  const handleClose = () => {
    setNotification(null);
  };

  const handleSendMessageNow = () => {
    // Chuyển sang trang Matches và gửi tín hiệu mở chat
    navigate('/matches', {
      state: {
        autoOpenChat: originalMatchData
      }
    });
    handleClose();
  };

  if (!notification) {
    return null;
  }

  return (
    <div className="match-notification-overlay">
      <div className="match-notification">
        {/* Các icon trang trí bay bổng */}
        <div className="decoration deco-1">🎉</div>
        <div className="decoration deco-2">✨</div>
        <div className="decoration deco-3">🥳</div>
        <div className="decoration deco-4">🎊</div>
        <div className="decoration deco-5">⭐</div>

        <button className="close-btn" onClick={handleClose}>
          ×
        </button>

        <div className="notification-content">
          <div className="congrats-text">CHÚC MỪNG! 🎉</div>
          <div className="match-icon">💘</div>
          <h2 className="match-title">Tương hợp hoàn hảo!</h2>
          <p className="match-message">
            Bạn và <strong>{notification.otherUserId}</strong> đã tìm thấy nhau!
          </p>

          <div className="user-avatars">
            <div className="avatar-wrapper">
              <div className="avatar current-user">
                {currentUserId?.charAt(0).toUpperCase()}
              </div>
              <span className="user-label">Bạn</span>
            </div>

            <div className="heart-container">
              <div className="pulse-ring"></div>
              <div className="heart-icon">💖</div>
            </div>

            <div className="avatar-wrapper">
              <div className="avatar other-user">
                {notification.otherUserId?.charAt(0).toUpperCase()}
              </div>
              <span className="user-label">{notification.otherUserId}</span>
            </div>
          </div>

          <div className="notification-actions">
            <button className="send-message-btn" onClick={handleSendMessageNow}>
              <span>💬</span> Gửi tin nhắn ngay
            </button>
            <button className="keep-swiping-btn" onClick={handleClose}>
              Tiếp tục khám phá
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchNotification;