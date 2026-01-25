const express = require('express');
const router = express.Router();
const { Message, Match } = require('../models');

/**
 * GET /api/messages/:matchId
 * Lấy lịch sử tin nhắn của một cuộc hội thoại
 */
router.get('/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;
        const { limit = 50, before } = req.query; // Hỗ trợ phân trang bằng thời gian (load more)

        // 1. Kiểm tra xem cuộc hội thoại có tồn tại không
        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cuộc hội thoại'
            });
        }

        // 2. Xây dựng query tìm kiếm tin nhắn
        const query = { matchId: matchId };

        // Nếu có 'before' (thời gian của tin nhắn cũ nhất đang hiển thị), lấy các tin nhắn cũ hơn nó
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        // 3. Lấy tin nhắn từ database, sắp xếp mới nhất ở dưới
        const messages = await Message.find(query)
            .sort({ createdAt: 1 }) // Sắp xếp từ cũ đến mới để hiển thị đúng thứ tự chat
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: {
                messages: messages,
                count: messages.length
            }
        });

    } catch (error) {
        console.error('Lỗi lấy lịch sử tin nhắn:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy tin nhắn'
        });
    }
});

/**
 * POST /api/messages/mark-read
 * Đánh dấu tin nhắn là đã xem
 */
router.post('/mark-read', async (req, res) => {
    try {
        const { matchId, userId } = req.body;

        await Message.updateMany(
            { matchId: matchId, senderId: { $ne: userId }, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

module.exports = router;
