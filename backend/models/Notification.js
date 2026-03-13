const mongoose = require('mongoose');

/**
 * Notification Schema
 * Lưu trữ thông báo của người dùng
 * Requirements: System Notification features
 */
const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: String,
        required: true,
        index: true // Tối ưu query tìm thông báo của user
    },
    senderId: {
        type: String,
        required: false // Có thể là null nếu là thông báo hệ thống
    },
    type: {
        type: String,
        enum: ['new_match', 'new_message', 'system_alert', 'match_unmatched'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    entityId: {
        type: String, // ID của đối tượng liên quan (MatchID, SwipeID, etc.)
        required: false
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
