import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import './ChatView.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
};

/**
 * ChatView Component
 * Hiển thị cửa sổ chat real-time với một match
 */
const ChatView = ({ match, onClose }) => {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const matchId = match._id || match.matchId;
    const currentUserId = user?.userId;

    // 🔍 Chuẩn hóa ID và Tìm người kia (Case-insensitive)
    const normalizedCurrentId = currentUserId?.toString().toLowerCase();
    
    const otherUserId = match.matchedWith || (match.participants?.find(id => 
        id?.toString().toLowerCase() !== normalizedCurrentId
    ));
    
    console.log('🧐 ChatView Check:', { 
        currentUserId: normalizedCurrentId, 
        participants: match.participants, 
        identifiedOtherId: otherUserId 
    });

    const otherUser = match.otherUserInfo || {
        userId: otherUserId,
        firstName: otherUserId
    };

    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const [isOtherUserOnline, setIsOtherUserOnline] = useState(otherUser.isOnline || false);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [viewImage, setViewImage] = useState(null);
    const fileInputRef = useRef(null);

    // 1. Tự động cuộn xuống cuối khi có tin nhắn mới
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // 2. Load lịch sử tin nhắn và Join room chat
    useEffect(() => {
        const initChat = async () => {
            try {
                setLoading(true);
                const history = await apiService.getMessages(matchId);
                setMessages(history);
            } catch (err) {
                console.error('Lỗi khởi tạo chat:', err);
            } finally {
                setLoading(false);
            }
        };

        if (currentUserId) initChat();
    }, [matchId, currentUserId]);

    // 2b. Join chat room whenever socket connects/reconnects
    useEffect(() => {
        if (socket && isConnected && matchId && currentUserId) {
            console.log('📡 UI: Joining chat room:', matchId, '(connected:', isConnected, ')');
            socket.emit('join-chat', { matchId: matchId.toString(), userId: currentUserId });
            socket.emit('mark-as-read', { matchId: matchId.toString(), userId: currentUserId });
        }
    }, [socket, isConnected, matchId, currentUserId]);

    // 3. Lắng nghe các event real-time từ socket
    useEffect(() => {
        if (socket) {
            // Nhận tin nhắn mới
            const handleReceiveMessage = (message) => {
                const normalizedSenderId = message.senderId?.toString().toLowerCase();
                const normalizedCurrentId = currentUserId?.toString().toLowerCase();
                
                if (message.matchId?.toString() === matchId?.toString()) {
                    setMessages((prev) => [...prev, message]);
                    if (normalizedSenderId !== normalizedCurrentId) {
                        console.log('📖 Auto-marking as read:', message.matchId);
                        socket.emit('mark-as-read', { matchId, userId: currentUserId });
                    }
                }
            };

            // Trạng thái soạn tin
            const handleDisplayTyping = (data) => {
                const normalizedSenderId = data.senderId?.toString().toLowerCase();
                const normalizedCurrentId = currentUserId?.toString().toLowerCase();
                if (data.matchId?.toString() === matchId?.toString() && normalizedSenderId !== normalizedCurrentId) {
                    setIsTyping(true);
                }
            };

            const handleHideTyping = (data) => {
                if (data.matchId?.toString() === matchId?.toString()) {
                    setIsTyping(false);
                }
            };

            // Trạng thái đã xem tin nhắn
            const handleReadUpdate = (data) => {
                console.log('📡 UI: Received read update:', data);
                const normalizedReaderId = data.readerId?.toString().toLowerCase();
                const normalizedCurrentId = currentUserId?.toString().toLowerCase();
                
                if (data.matchId?.toString() === matchId?.toString() && normalizedReaderId !== normalizedCurrentId) {
                    console.log('✅ UI: Updating local messages to "Read"');
                    setMessages(prev => prev.map(msg => 
                        msg.senderId?.toString().toLowerCase() === normalizedCurrentId ? { ...msg, isRead: true } : msg
                    ));
                }
            };

            // Online status
            const handleUserStatus = (data) => {
                const normalizedDataId = data.userId?.toString().toLowerCase();
                const normalizedOtherId = otherUserId?.toString().toLowerCase();
                if (normalizedDataId === normalizedOtherId) setIsOtherUserOnline(data.isOnline);
            };

            const handleUserOnline = (data) => {
                const normalizedDataId = data.userId?.toString().toLowerCase();
                const normalizedOtherId = otherUserId?.toString().toLowerCase();
                if (normalizedDataId === normalizedOtherId) setIsOtherUserOnline(true);
            };

            const handleUserOffline = (data) => {
                const normalizedDataId = data.userId?.toString().toLowerCase();
                const normalizedOtherId = otherUserId?.toString().toLowerCase();
                if (normalizedDataId === normalizedOtherId) setIsOtherUserOnline(false);
            };

            socket.on('receive-message', handleReceiveMessage);
            socket.on('display-typing', handleDisplayTyping);
            socket.on('hide-typing', handleHideTyping);
            socket.on('messages-read-update', handleReadUpdate);
            socket.on('user-status', handleUserStatus);
            socket.on('user-online', handleUserOnline);
            socket.on('user-offline', handleUserOffline);

            return () => {
                socket.off('receive-message', handleReceiveMessage);
                socket.off('display-typing', handleDisplayTyping);
                socket.off('hide-typing', handleHideTyping);
                socket.off('messages-read-update', handleReadUpdate);
                socket.off('user-status', handleUserStatus);
                socket.off('user-online', handleUserOnline);
                socket.off('user-offline', handleUserOffline);
            };
        }
    }, [socket, matchId, currentUserId, otherUserId]);

    // 4. Gửi tin nhắn và emit typing
    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        
        if (socket) {
            console.log('⌨️ UI: Emitting typing for match:', matchId.toString());
            socket.emit('typing', { matchId: matchId.toString(), senderId: currentUserId });
            
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop-typing', { matchId: matchId.toString(), senderId: currentUserId });
            }, 2000);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messageData = {
            matchId,
            senderId: currentUserId,
            content: newMessage.trim()
        };

        socket.emit('send-message', messageData);
        socket.emit('stop-typing', { matchId, senderId: currentUserId });
        setNewMessage('');
    };

    // 4b. Gửi ảnh trong chat
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Kiểm tra loại file
        if (!file.type.startsWith('image/')) {
            alert('Chỉ chấp nhận file ảnh!');
            return;
        }
        // Kiểm tra kích thước (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Ảnh quá lớn! Tối đa 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            setImagePreview({ file, preview: ev.target.result });
        };
        reader.readAsDataURL(file);
    };

    const handleSendImage = async () => {
        if (!imagePreview || !socket) return;
        
        try {
            setUploadingImage(true);
            const result = await apiService.uploadChatImage(imagePreview.file);
            
            socket.emit('send-message', {
                matchId,
                senderId: currentUserId,
                content: '📷 Hình ảnh',
                messageType: 'image',
                imageUrl: result.imageUrl
            });
            
            setImagePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            alert('Lỗi gửi ảnh: ' + error.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const cancelImagePreview = () => {
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // 5. Xử lý Unmatch
    const handleUnmatch = async () => {
        try {
            setLoading(true);
            await apiService.unmatchUser(matchId, currentUserId, 'User requested');
            onClose();
            window.location.reload();
        } catch (error) {
            alert('Lỗi khi unmatch: ' + error.message);
            setLoading(false);
        }
    };

    return (
        <div className="chat-view-overlay">
            <div className="chat-window">
                <div className="chat-header">
                    <div className="chat-user-info">
                        <div className="chat-avatar-wrapper">
                            <div className="chat-avatar">
                                {otherUser.firstName?.charAt(0) || otherUser.userId?.charAt(0).toUpperCase()}
                            </div>
                            <div className={`status-dot ${isOtherUserOnline ? 'online' : ''}`}></div>
                        </div>
                        <div className="chat-user-details">
                            <h3>{otherUser.firstName || otherUser.userId}</h3>
                            <span className="user-status-text">
                                {isOtherUserOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                            </span>
                        </div>
                    </div>
                    <div className="header-actions">
                         <button
                            className="unmatch-btn-icon"
                            title="Hủy tương hợp"
                            onClick={() => {
                                if (window.confirm('Bạn có chắc muốn hủy tương hợp?')) {
                                    handleUnmatch();
                                }
                            }}
                        >
                            💔
                        </button>
                        <button className="close-chat-btn" onClick={onClose}>×</button>
                    </div>
                </div>

                <div className="messages-container">
                    {loading ? (
                        <div className="chat-loading">Đang tải tin nhắn...</div>
                    ) : messages.length === 0 ? (
                        <div className="no-messages-hint">Hãy gửi lời chào tới {otherUser.firstName || otherUser.userId}! 👋</div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.senderId?.toString().toLowerCase() === currentUserId?.toString().toLowerCase();
                            const isLastMsgFromMe = isMe && 
                                (index === messages.length - 1 || 
                                 messages[index + 1]?.senderId?.toString().toLowerCase() !== currentUserId?.toString().toLowerCase());

                            return (
                                <div
                                    key={msg._id || index}
                                    className={`message-bubble ${isMe ? 'sent' : 'received'}`}
                                >
                                    {/* Tin nhắn ảnh */}
                                    {(msg.messageType === 'image' || msg.imageUrl) && (
                                        <div className="message-image" onClick={() => setViewImage(getImageUrl(msg.imageUrl))}>
                                            <img 
                                                src={getImageUrl(msg.imageUrl)} 
                                                alt="Chat" 
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                    {/* Tin nhắn text */}
                                    {msg.messageType !== 'image' && (
                                        <div className="message-content">{msg.content}</div>
                                    )}
                                    <div className="message-footer">
                                        <span className="message-time">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isLastMsgFromMe && (
                                            msg.isRead ? (
                                                <span className="seen-status read"> ✓✓ Đã xem</span>
                                            ) : (
                                                <span className="seen-status sent"> ✓ Đã gửi</span>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {isTyping && (
                        <div className="message-bubble received typing">
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={handleSendMessage}>
                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="image-preview-bar">
                            <img src={imagePreview.preview} alt="Preview" />
                            <div className="image-preview-actions">
                                <button type="button" className="cancel-preview" onClick={cancelImagePreview}>✕</button>
                                <button type="button" className="send-image-btn" onClick={handleSendImage} disabled={uploadingImage}>
                                    {uploadingImage ? '⏳' : '📤'} {uploadingImage ? 'Đang gửi...' : 'Gửi ảnh'}
                                </button>
                            </div>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                    />
                    <button type="button" className="attachment-btn" onClick={() => fileInputRef.current?.click()} title="Gửi ảnh">
                        📷
                    </button>
                    <input
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        value={newMessage}
                        onChange={handleInputChange}
                    />
                    <button type="button" className="emoji-btn" onClick={() => setNewMessage(prev => prev + '😊')}>😊</button>
                    <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="white"/>
                        </svg>
                    </button>
                </form>
            </div>

            {/* Image Viewer Modal */}
            {viewImage && (
                <div className="image-viewer-overlay" onClick={() => setViewImage(null)}>
                    <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
                        <button className="image-viewer-close" onClick={() => setViewImage(null)}>✕</button>
                        <img src={viewImage} alt="Full size" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatView;
