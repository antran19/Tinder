const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Danh sách Virtual Gifts
const GIFT_CATALOG = [
    { id: 'rose', name: 'Hoa hồng', emoji: '🌹', price: 0, description: 'Gửi yêu thương' },
    { id: 'heart', name: 'Trái tim', emoji: '💝', price: 0, description: 'Gửi tình cảm' },
    { id: 'chocolate', name: 'Sô-cô-la', emoji: '🍫', price: 0, description: 'Ngọt ngào' },
    { id: 'teddy', name: 'Gấu bông', emoji: '🧸', price: 0, description: 'Ấm áp' },
    { id: 'star', name: 'Ngôi sao', emoji: '⭐', price: 0, description: 'Nổi bật' },
    { id: 'diamond', name: 'Kim cương', emoji: '💎', price: 0, description: 'Quý giá' },
    { id: 'fire', name: 'Nóng bỏng', emoji: '🔥', price: 0, description: 'Hot!' },
    { id: 'kiss', name: 'Nụ hôn', emoji: '💋', price: 0, description: 'Muah!' },
    { id: 'cake', name: 'Bánh kem', emoji: '🎂', price: 0, description: 'Chúc mừng' },
    { id: 'champagne', name: 'Rượu vang', emoji: '🍾', price: 0, description: 'Kỷ niệm' },
    { id: 'galaxy', name: 'Dải ngân hà', emoji: '🌌', price: 0, description: 'Vô hạn' },
    { id: 'crown', name: 'Vương miện', emoji: '👑', price: 0, description: 'Vua/Nữ hoàng' },
];

// GET /api/gifts/catalog — Lấy danh sách quà
router.get('/catalog', (req, res) => {
    res.json({
        success: true,
        data: { gifts: GIFT_CATALOG }
    });
});

// POST /api/gifts/send — Gửi quà (emit socket event)
router.post('/send', async (req, res) => {
    try {
        const { senderId, receiverId, matchId, giftId } = req.body;

        if (!senderId || !receiverId || !matchId || !giftId) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }

        const gift = GIFT_CATALOG.find(g => g.id === giftId);
        if (!gift) {
            return res.status(400).json({ success: false, message: 'Gift not found' });
        }

        // Emit gift event via socket
        if (global.io) {
            const giftMessage = {
                matchId,
                senderId,
                receiverId,
                gift,
                timestamp: new Date()
            };

            // Emit to the match room
            global.io.to(`match_${matchId}`).emit('receive-gift', giftMessage);

            // Also emit to the receiver directly
            global.io.to(receiverId.toLowerCase()).emit('gift-received', {
                from: senderId,
                gift,
                message: `${gift.emoji} ${senderId} đã gửi bạn ${gift.name}!`
            });
        }

        res.json({
            success: true,
            message: `Đã gửi ${gift.emoji} ${gift.name}!`,
            data: { gift }
        });

    } catch (error) {
        console.error('Gift error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
