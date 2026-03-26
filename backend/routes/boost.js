const express = require('express');
const router = express.Router();
const User = require('../models/User');

const BOOST_DURATION_MINUTES = 30;

// POST /api/boost/activate — Kích hoạt Boost
router.post('/activate', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });

        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Check if boost is already active
        if (user.boost?.isActive && user.boost.endsAt > new Date()) {
            const remaining = Math.ceil((user.boost.endsAt - new Date()) / 1000 / 60);
            return res.json({
                success: false,
                message: `Boost đang hoạt động! Còn ${remaining} phút`,
                data: { isActive: true, endsAt: user.boost.endsAt, remainingMinutes: remaining }
            });
        }

        // Check credits
        if (user.credits.boosts <= 0) {
            // Premium/Gold gets free boost
            const isPremium = user.subscription?.tier === 'premium' || user.subscription?.tier === 'gold';
            if (!isPremium) {
                return res.json({ success: false, message: 'Không đủ credits! Mua Boost trong Premium.' });
            }
        } else {
            user.credits.boosts -= 1;
        }

        // Activate boost
        const now = new Date();
        const endsAt = new Date(now.getTime() + BOOST_DURATION_MINUTES * 60 * 1000);

        user.boost = {
            isActive: true,
            startedAt: now,
            endsAt: endsAt,
            totalBoosts: (user.boost?.totalBoosts || 0) + 1
        };

        await user.save();

        // Emit boost notification
        if (global.io) {
            global.io.to(userId.toLowerCase()).emit('boost-activated', {
                endsAt, message: `⚡ Boost kích hoạt! Profile được ưu tiên ${BOOST_DURATION_MINUTES} phút!`
            });
        }

        res.json({
            success: true,
            message: `⚡ Boost kích hoạt ${BOOST_DURATION_MINUTES} phút!`,
            data: {
                isActive: true,
                startedAt: now,
                endsAt: endsAt,
                remainingBoosts: user.credits.boosts,
                totalBoosts: user.boost.totalBoosts
            }
        });

    } catch (error) {
        console.error('Boost error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/boost/status/:userId — Kiểm tra trạng thái Boost
router.get('/status/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const now = new Date();
        const isActive = user.boost?.isActive && user.boost.endsAt > now;
        const remainingMinutes = isActive ? Math.ceil((user.boost.endsAt - now) / 1000 / 60) : 0;

        // Auto-deactivate if expired
        if (user.boost?.isActive && user.boost.endsAt <= now) {
            user.boost.isActive = false;
            await user.save();
        }

        res.json({
            success: true,
            data: {
                isActive,
                endsAt: user.boost?.endsAt,
                remainingMinutes,
                boostCredits: user.credits?.boosts || 0,
                totalBoosts: user.boost?.totalBoosts || 0,
                tier: user.subscription?.tier || 'free'
            }
        });
    } catch (error) {
        console.error('Boost status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
