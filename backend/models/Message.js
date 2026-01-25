const mongoose = require('mongoose');

/**
 * Message Model - Dating App
 * Lưu trữ các tin nhắn trong cuộc trò chuyện giữa 2 người đã match
 */
const messageSchema = new mongoose.Schema({
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: [true, 'Match ID là bắt buộc'],
        index: true // Đánh index để tìm kiếm tin nhắn theo cuộc hội thoại nhanh hơn
    },
    senderId: {
        type: String, // userId của người gửi
        required: [true, 'ID người gửi là bắt buộc']
    },
    content: {
        type: String,
        required: [true, 'Nội dung tin nhắn không được để trống'],
        trim: true,
        maxlength: [1000, 'Tin nhắn không được quá 1000 ký tự']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true // Đánh index để sắp xếp tin nhắn theo thời gian nhanh hơn
    }
});

// Chặn việc sửa đổi tin nhắn sau khi đã gửi (tùy chọn tính toàn vẹn)
messageSchema.pre('save', function (next) {
    if (!this.isNew && this.isModified('content')) {
        return next(new Error('Không thể chỉnh sửa nội dung tin nhắn đã gửi'));
    }
    next();
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
