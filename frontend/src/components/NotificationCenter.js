import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './NotificationCenter.css';

const NotificationCenter = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            loadNotifications();
        }
    }, [isOpen, user]);

    // Lắng nghe thông báo mới realtime
    useEffect(() => {
        if (socket) {
            const handleNewNotify = (notify) => {
                setNotifications(prev => [notify, ...prev]);
            };
            socket.on('new-notification', handleNewNotify);
            return () => socket.off('new-notification', handleNewNotify);
        }
    }, [socket]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await apiService.getNotifications(user.userId);
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Lỗi tải thông báo:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await apiService.markNotificationRead(id);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error(error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="notification-overlay" onClick={onClose}>
            <div className="notification-panel" onClick={e => e.stopPropagation()}>
                <div className="notification-header">
                    <h3>Thông báo 🔔</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="notification-list">
                    {loading ? (
                        <div className="notify-loading">Đang tải...</div>
                    ) : notifications.length === 0 ? (
                        <div className="no-notify">Chưa có thông báo nào</div>
                    ) : (
                        notifications.map(n => (
                            <div
                                key={n._id}
                                className={`notify-item ${n.isRead ? 'read' : 'unread'}`}
                                onClick={() => handleMarkRead(n._id)}
                            >
                                <div className="notify-icon">
                                    {n.type === 'new_match' ? '💖' : '✉️'}
                                </div>
                                <div className="notify-content">
                                    <div className="notify-title">{n.title}</div>
                                    <div className="notify-text">{n.content}</div>
                                    <div className="notify-time">
                                        {new Date(n.createdAt).toLocaleString()}
                                    </div>
                                </div>
                                {!n.isRead && <div className="unread-dot"></div>}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
