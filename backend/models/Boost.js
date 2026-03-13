const mongoose = require('mongoose');

/**
 * Boost Schema
 * Lưu lịch sử các lần user kích hoạt Boost
 */
const boostSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'expired'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index để query active boosts nhanh
boostSchema.index({ status: 1, endTime: 1 });

module.exports = mongoose.model('Boost', boostSchema);
