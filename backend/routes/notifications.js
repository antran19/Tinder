const express = require('express');
const router = express.Router();
const { Notification } = require('../models');

/**
 * GET /api/notifications/:userId
 * Lấy danh sách thông báo của user
 */
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, skip = 0 } = req.query;

        const notifications = await Notification.find({ recipientId: userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const unreadCount = await Notification.countDocuments({
            recipientId: userId,
            isRead: false
        });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error) {
        console.error('Lỗi lấy thông báo:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * PUT /api/notifications/mark-read/:notificationId
 * Đánh dấu một thông báo là đã đọc
 */
router.put('/mark-read/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;
        await Notification.findByIdAndUpdate(notificationId, { isRead: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

/**
 * PUT /api/notifications/mark-all-read/:userId
 * Đánh dấu tất cả thông báo là đã đọc
 */
router.put('/mark-all-read/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        await Notification.updateMany(
            { recipientId: userId, isRead: false },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

module.exports = router;
