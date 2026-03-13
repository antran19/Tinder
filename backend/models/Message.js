const mongoose = require('mongoose');

/**
 * Message Model - Dating App
 * Lưu trữ các tin nhắn trong cuộc trò chuyện giữa 2 người đã match
 * Hỗ trợ: Text, Image, GIF
 */
const messageSchema = new mongoose.Schema({
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: [true, 'Match ID là bắt buộc'],
        index: true
    },
    senderId: {
        type: String,
        required: [true, 'ID người gửi là bắt buộc']
    },
    // Loại tin nhắn: text, image, gif
    messageType: {
        type: String,
        enum: ['text', 'image', 'gif'],
        default: 'text'
    },
    content: {
        type: String,
        required: [true, 'Nội dung tin nhắn không được để trống'],
        trim: true,
        maxlength: [2000, 'Tin nhắn không được quá 2000 ký tự']
    },
    // URL ảnh (chỉ dùng khi messageType = 'image' hoặc 'gif')
    imageUrl: {
        type: String,
        default: null
    },
    // Thumbnail cho ảnh (phiên bản thu nhỏ)
    thumbnail: {
        type: String,
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Chặn việc sửa đổi tin nhắn sau khi đã gửi
messageSchema.pre('save', function (next) {
    if (!this.isNew && this.isModified('content')) {
        return next(new Error('Không thể chỉnh sửa nội dung tin nhắn đã gửi'));
    }
    next();
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
