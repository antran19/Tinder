import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import './ChatView.css';

/**
 * ChatView Component
 * Hiển thị cửa sổ chat real-time với một match
 */
const ChatView = ({ match, onClose }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const matchId = match._id || match.matchId; // Hỗ trợ cả dữ liệu từ API (_id) và Socket (matchId)
    const currentUserId = user?.userId;

    // Tìm thông tin người kia (hỗ trợ nhiều cấu trúc dữ liệu khác nhau)
    const otherUserId = match.matchedWith || (match.participants?.find(id => id !== currentUserId));
    const otherUser = match.otherUserInfo || {
        userId: otherUserId,
        firstName: otherUserId // Fallback dùng chính ID làm tên nếu chưa có info
    };

    // 1. Tự động cuộn xuống cuối khi có tin nhắn mới
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 2. Load lịch sử tin nhắn và Join room chat
    useEffect(() => {
        const initChat = async () => {
            try {
                setLoading(true);
                // Lấy lịch sử từ database
                const history = await apiService.getMessages(matchId);
                setMessages(history);

                // Báo cho server biết mình vào phòng chat này
                if (socket) {
                    socket.emit('join-chat', matchId);
                }

                // Đánh dấu đã đọc
                apiService.markMessagesAsRead(matchId, currentUserId);
            } catch (err) {
                console.error('Lỗi khởi tạo chat:', err);
            } finally {
                setLoading(false);
            }
        };

        initChat();
    }, [matchId, socket, currentUserId]);

    // 3. Lắng nghe tin nhắn mới từ socket
    useEffect(() => {
        if (socket) {
            const handleReceiveMessage = (message) => {
                // Chỉ thêm vào danh sách nếu tin nhắn thuộc cuộc hội thoại này
                if (message.matchId === matchId) {
                    setMessages((prev) => [...prev, message]);

                    // Nếu mình đang mở cửa sổ này và tin nhắn từ người khác, đánh dấu là đã đọc
                    if (message.senderId !== currentUserId) {
                        apiService.markMessagesAsRead(matchId, currentUserId);
                    }
                }
            };

            socket.on('receive-message', handleReceiveMessage);

            return () => {
                socket.off('receive-message', handleReceiveMessage);
            };
        }
    }, [socket, matchId, currentUserId]);

    // 4. Gửi tin nhắn
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messageData = {
            matchId,
            senderId: currentUserId,
            content: newMessage.trim()
        };

        // Gửi qua socket
        socket.emit('send-message', messageData);
        setNewMessage('');
    };

    return (
        <div className="chat-view-overlay">
            <div className="chat-window">
                <div className="chat-header">
                    <div className="chat-user-info">
                        <div className="chat-avatar">
                            {otherUser.firstName?.charAt(0) || otherUser.userId.charAt(0).toUpperCase()}
                        </div>
                        <h3>{otherUser.firstName || otherUser.userId}</h3>
                    </div>
                    <button className="close-chat-btn" onClick={onClose}>×</button>
                </div>

                <div className="messages-container">
                    {loading ? (
                        <div className="chat-loading">Đang tải tin nhắn...</div>
                    ) : messages.length === 0 ? (
                        <div className="no-messages-hint">Hãy gửi lời chào tới {otherUser.firstName || otherUser.userId}! 👋</div>
                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={msg._id || index}
                                className={`message-bubble ${msg.senderId === currentUserId ? 'sent' : 'received'}`}
                            >
                                <div className="message-content">{msg.content}</div>
                                <div className="message-time">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" disabled={!newMessage.trim()}>Gửi</button>
                </form>
            </div>
        </div>
    );
};

export default ChatView;
