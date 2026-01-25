import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Mới
import { apiService } from '../services/apiService';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import ChatView from './ChatView'; // Mới: Import component chat
import './MatchList.css';

/**
 * MatchList Component
 * Displays list of user matches with real-time updates
 * Requirements: 5.2 - Display matches with real-time updates
 */
const MatchList = () => {
  const { user } = useAuth();
  const location = useLocation(); // Mới
  const navigate = useNavigate(); // Mới
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null); // Mới: Match đang được chọn để chat
  const { socket } = useSocket();

  const currentUserId = user?.userId;

  useEffect(() => {
    loadMatches();
  }, []);

  // Mới: Check xem có yêu cầu tự động mở chat không (từ trang thông báo Match)
  useEffect(() => {
    if (location.state?.autoOpenChat) {
      setSelectedMatch(location.state.autoOpenChat);
      // Xóa state để tránh mở lại khi nhấn F5
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Listen for real-time match updates
  useEffect(() => {
    if (socket) {
      const handleNewMatch = (matchData) => {
        console.log('New match received:', matchData);
        // Add new match to the list if it involves current user
        if (matchData.participants.includes(currentUserId)) {
          setMatches(prevMatches => [matchData, ...prevMatches]);
        }
      };

      socket.on('new-match', handleNewMatch);

      return () => {
        socket.off('new-match', handleNewMatch);
      };
    }
  }, [socket, currentUserId]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const userMatches = await apiService.getMatches(currentUserId);
      setMatches(userMatches);
    } catch (err) {
      console.error('Error loading matches:', err);
      setError('Failed to load matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getOtherUserId = (match) => {
    return match.participants.find(id => id !== currentUserId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenChat = (match) => {
    setSelectedMatch(match);
  };

  const handleCloseChat = () => {
    setSelectedMatch(null);
  };

  if (loading) {
    return (
      <div className="match-list">
        <div className="loading">Loading matches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="match-list">
        <div className="error">
          <p>{error}</p>
          <button onClick={loadMatches} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="match-list">
      <div className="match-header">
        <h2>Your Matches</h2>
        <p>{matches.length} {matches.length === 1 ? 'match' : 'matches'}</p>
      </div>

      {matches.length === 0 ? (
        <div className="no-matches">
          <div className="no-matches-icon">💕</div>
          <h3>No matches yet</h3>
          <p>Start swiping to find your perfect match!</p>
        </div>
      ) : (
        <div className="matches-container">
          {matches.map((match) => (
            <div key={match._id} className="match-item">
              <div className="match-avatar">
                {getOtherUserId(match).charAt(0).toUpperCase()}
              </div>
              <div className="match-info">
                <h4 className="match-name">{getOtherUserId(match)}</h4>
                <p className="match-date">
                  Matched on {formatDate(match.createdAt)}
                </p>
                <span className="match-status">{match.status}</span>
              </div>
              <div className="match-actions">
                <button className="chat-btn" onClick={() => handleOpenChat(match)}>
                  💬 Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="refresh-section">
        <button onClick={loadMatches} className="refresh-btn">
          Refresh Matches
        </button>
      </div>

      {/* Mới: Cửa sổ Chat thực tế */}
      {selectedMatch && (
        <ChatView
          match={selectedMatch}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
};

export default MatchList;