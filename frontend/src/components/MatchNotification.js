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
    const { socket } = useSocket();
    const navigate = useNavigate();
    
    const [notification, setNotification] = useState(null);
    const [originalMatchData, setOriginalMatchData] = useState(null);
    const [messageToast, setMessageToast] = useState(null);

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
                        createdAt: matchData.createdAt
                    });
                    setTimeout(() => setNotification(null), 10000);
                }
            };

            const handleMessageNotification = (data) => {
                // Don't show toast if we are already in the chat view (this logic could be more robust)
                // For now, just show it.
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

    const handleClose = () => setNotification(null);

    const handleSendMessageNow = () => {
        navigate('/matches', { state: { autoOpenChat: originalMatchData } });
        handleClose();
    };

    const handleOpenChatFromToast = () => {
        navigate('/matches', { state: { autoOpenChat: { _id: messageToast.matchId, matchedWith: messageToast.senderId } } });
        setMessageToast(null);
    };

    return (
        <>
            {notification && (
                <div className="match-notification-overlay">
                    <div className="match-notification">
                        <div className="decoration deco-1">🎉</div>
                        <div className="decoration deco-2">✨</div>
                        <div className="decoration deco-3">🥳</div>
                        <div className="decoration deco-4">🎊</div>
                        <div className="decoration deco-5">⭐</div>

                        <button className="close-btn" onClick={handleClose}>×</button>

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
            )}

            {messageToast && (
                <div className="message-toast" onClick={handleOpenChatFromToast}>
                    <div className="toast-avatar">
                        {messageToast.senderId?.charAt(0).toUpperCase()}
                    </div>
                    <div className="toast-info">
                        <h4>{messageToast.senderId}</h4>
                        <p>{messageToast.content}</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default MatchNotification;