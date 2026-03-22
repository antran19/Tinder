import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import './ReportModal.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
};

const ToastNotifications = () => {
    const { socket } = useSocket();
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((toast) => {
        const id = Date.now();
        setToasts(prev => [...prev, { ...toast, id }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    useEffect(() => {
        if (!socket) return;

        // Ai đó đã like bạn
        const handleNewLike = (data) => {
            addToast({
                type: 'like',
                title: data.type === 'super_like' ? '⭐ Super Like!' : '💕 Lượt thích mới!',
                message: data.message,
                image: data.fromUserImage
            });
        };

        // Tin nhắn mới
        const handleNewMessage = (data) => {
            addToast({
                type: 'message',
                title: '💬 Tin nhắn mới',
                message: data.content,
                image: ''
            });
        };

        // Kết quả xác minh
        const handleVerification = (data) => {
            addToast({
                type: 'verification',
                title: data.status === 'approved' ? '✅ Đã xác minh!' : '❌ Từ chối xác minh',
                message: data.message,
                image: ''
            });
        };

        socket.on('new-like', handleNewLike);
        socket.on('message-notification', handleNewMessage);
        socket.on('verification-result', handleVerification);

        return () => {
            socket.off('new-like', handleNewLike);
            socket.off('message-notification', handleNewMessage);
            socket.off('verification-result', handleVerification);
        };
    }, [socket, addToast]);

    if (toasts.length === 0) return null;

    return (
        <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 3000, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {toasts.map(toast => (
                <div key={toast.id} className={`toast-notification ${toast.type}`}>
                    {toast.image && (
                        <img src={getImageUrl(toast.image)} alt="" className="toast-avatar" />
                    )}
                    <div className="toast-content">
                        <strong>{toast.title}</strong>
                        <p>{toast.message}</p>
                    </div>
                    <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
                </div>
            ))}
        </div>
    );
};

export default ToastNotifications;
