import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import './MatchNotification.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
};

const MatchNotification = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    
    const [notification, setNotification] = useState(null);
    const [originalMatchData, setOriginalMatchData] = useState(null);
    const [messageToast, setMessageToast] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);

    const currentUserId = user?.userId;

    useEffect(() => {
        if (socket) {
            const handleNewMatch = (matchData) => {
                console.log('Match notification received:', matchData);
                const normalizedCurrentId = currentUserId?.toString().toLowerCase();
                
                if (matchData.participants.some(id => id?.toString().toLowerCase() === normalizedCurrentId)) {
                    const otherUserId = matchData.matchedWith || matchData.participants.find(id => 
                        id?.toString().toLowerCase() !== normalizedCurrentId
                    );
                    setOriginalMatchData(matchData);
                    setNotification({
                        id: matchData.matchId || matchData._id,
                        otherUserId,
                        otherUserImage: matchData.otherUserImage || null,
                        createdAt: matchData.createdAt
                    });
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 3000);
                    setTimeout(() => setNotification(null), 12000);
                }
            };

            const handleMessageNotification = (data) => {
                setMessageToast(data);
                setTimeout(() => setMessageToast(null), 5000);
            };

            socket.on('new-match', handleNewMatch);
            socket.on('message-notification', handleMessageNotification);

            return () => {
                socket.off('new-match', handleNewMatch);
                socket.off('message-notification', handleMessageNotification);
            };
        }
    }, [socket, currentUserId]);

    const handleClose = () => { setNotification(null); setShowConfetti(false); };

    const handleSendMessageNow = () => {
        navigate('/matches', { state: { autoOpenChat: originalMatchData } });
        handleClose();
    };

    const handleOpenChatFromToast = () => {
        navigate('/matches', { state: { autoOpenChat: { _id: messageToast.matchId, matchedWith: messageToast.senderId } } });
        setMessageToast(null);
    };

    // Get user avatar
    const currentUserImage = user?.images?.[0] ? getImageUrl(user.images[0]) : null;
    const currentInitial = currentUserId?.charAt(0).toUpperCase() || '?';
    const otherInitial = notification?.otherUserId?.charAt(0).toUpperCase() || '?';

    return (
        <>
            {notification && (
                <div className="match-overlay" onClick={handleClose}>
                    {/* Confetti particles */}
                    {showConfetti && (
                        <div className="confetti-container">
                            {[...Array(50)].map((_, i) => (
                                <div key={i} className="confetti-piece" style={{
                                    '--x': `${Math.random() * 100}vw`,
                                    '--delay': `${Math.random() * 2}s`,
                                    '--duration': `${2 + Math.random() * 3}s`,
                                    '--color': ['#fd267a', '#ff6036', '#ffd700', '#4ade80', '#3b82f6', '#a855f7'][Math.floor(Math.random() * 6)],
                                    '--size': `${4 + Math.random() * 8}px`,
                                    '--rotation': `${Math.random() * 360}deg`,
                                }} />
                            ))}
                        </div>
                    )}

                    <div className="match-popup" onClick={(e) => e.stopPropagation()}>
                        {/* "It's a Match!" text - Tinder signature */}
                        <div className="match-title-area">
                            <h1 className="its-a-match">It's a Match!</h1>
                            <p className="match-subtitle">
                                Bạn và <strong>{notification.otherUserId}</strong> đã thích nhau
                            </p>
                        </div>

                        {/* Two avatars side by side - Tinder style */}
                        <div className="match-avatars">
                            <div className="match-avatar-circle left-avatar">
                                {currentUserImage ? (
                                    <img src={currentUserImage} alt="You" />
                                ) : (
                                    <span>{currentInitial}</span>
                                )}
                            </div>

                            <div className="match-heart-icon">
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="#fd267a">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                            </div>

                            <div className="match-avatar-circle right-avatar">
                                {notification.otherUserImage ? (
                                    <img src={getImageUrl(notification.otherUserImage)} alt={notification.otherUserId} />
                                ) : (
                                    <span>{otherInitial}</span>
                                )}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="match-buttons">
                            <button className="match-send-btn" onClick={handleSendMessageNow}>
                                Gửi tin nhắn
                            </button>
                            <button className="match-continue-btn" onClick={handleClose}>
                                Tiếp tục vuốt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Toast */}
            {messageToast && (
                <div className="msg-toast" onClick={handleOpenChatFromToast}>
                    <div className="msg-toast-avatar">
                        {messageToast.senderId?.charAt(0).toUpperCase()}
                    </div>
                    <div className="msg-toast-content">
                        <h4>{messageToast.senderId}</h4>
                        <p>{messageToast.content}</p>
                    </div>
                    <span className="msg-toast-time">Bây giờ</span>
                </div>
            )}
        </>
    );
};

export default MatchNotification;