const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporterId: { type: String, required: true, index: true },
    reportedUserId: { type: String, required: true, index: true },
    reason: {
        type: String,
        enum: ['fake_profile', 'harassment', 'spam', 'inappropriate_content', 'underage', 'scam', 'other'],
        required: true
    },
    description: { type: String, default: '' },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending'
    },
    adminNote: { type: String, default: '' },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Mỗi user chỉ report 1 user 1 lần
reportSchema.index({ reporterId: 1, reportedUserId: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
