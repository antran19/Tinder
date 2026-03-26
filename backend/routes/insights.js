const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Swipe, Match } = require('../models');

// GET /api/insights/:userId — Lấy insights cho user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // 1. Ai đã like bạn
        const likesReceived = await Swipe.countDocuments({ toUserId: userId, type: 'like' });
        const superLikesReceived = await Swipe.countDocuments({ toUserId: userId, type: 'super_like' });

        // 2. Bạn đã like ai
        const likesSent = await Swipe.countDocuments({ fromUserId: userId, type: 'like' });
        const passesSent = await Swipe.countDocuments({ fromUserId: userId, type: 'pass' });

        // 3. Tổng matches
        const totalMatches = await Match.countDocuments({ participants: userId, status: 'active' });

        // 4. Match rate
        const totalSwipesReceived = likesReceived + (await Swipe.countDocuments({ toUserId: userId, type: 'pass' }));
        const matchRate = totalSwipesReceived > 0 ? Math.round((likesReceived / totalSwipesReceived) * 100) : 0;

        // 5. Right swipe rate (bạn thích bao nhiêu %)
        const totalSwipesSent = likesSent + passesSent;
        const rightSwipeRate = totalSwipesSent > 0 ? Math.round((likesSent / totalSwipesSent) * 100) : 0;

        // 6. Người like bạn gần đây (7 ngày)
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentLikes = await Swipe.countDocuments({
            toUserId: userId, type: 'like', createdAt: { $gte: oneWeekAgo }
        });

        // 7. Sở thích phổ biến của người like bạn
        const likerIds = await Swipe.find({ toUserId: userId, type: 'like' }).distinct('fromUserId');
        const likers = await User.find({ userId: { $in: likerIds.slice(0, 50) } }).select('interests');
        const interestMap = {};
        likers.forEach(l => {
            (l.interests || []).forEach(i => {
                interestMap[i] = (interestMap[i] || 0) + 1;
            });
        });
        const topInterestsFromLikers = Object.entries(interestMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([interest, count]) => ({ interest, count }));

        // 8. Profile completeness
        const profileScore = calculateProfileScore(user);

        // 9. Tips dựa trên data
        const tips = generateTips({ likesReceived, matchRate, totalMatches, profileScore, user });

        res.json({
            success: true,
            data: {
                stats: {
                    likesReceived,
                    superLikesReceived,
                    likesSent,
                    passesSent,
                    totalMatches,
                    matchRate,
                    rightSwipeRate,
                    recentLikes,
                    profileScore
                },
                topInterestsFromLikers,
                tips,
                lastUpdated: new Date()
            }
        });

    } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

function calculateProfileScore(user) {
    let score = 0;
    if (user.images?.length > 0) score += 15;
    if (user.images?.length >= 3) score += 10;
    if (user.bio?.length > 10) score += 15;
    if (user.interests?.length >= 3) score += 15;
    if (user.profileDetails?.occupation) score += 10;
    if (user.profileDetails?.education) score += 10;
    if (user.profileDetails?.zodiac) score += 10;
    if (user.isVerified) score += 15;
    return score;
}

function generateTips({ likesReceived, matchRate, totalMatches, profileScore, user }) {
    const tips = [];

    if (profileScore < 50) {
        tips.push({ icon: '📝', text: 'Hoàn thiện hồ sơ để tăng 3x lượt thích!', priority: 'high' });
    }
    if (!user.images || user.images.length === 0) {
        tips.push({ icon: '📷', text: 'Thêm ảnh để hồ sơ hấp dẫn hơn!', priority: 'high' });
    }
    if (user.images?.length < 3) {
        tips.push({ icon: '🖼️', text: 'Thêm 3+ ảnh để tăng 70% lượt match!', priority: 'medium' });
    }
    if (!user.bio || user.bio.length < 10) {
        tips.push({ icon: '✍️', text: 'Viết bio ngắn gọn, thú vị!', priority: 'medium' });
    }
    if (matchRate < 20) {
        tips.push({ icon: '💡', text: 'Thử mở rộng bộ lọc tuổi/khoảng cách!', priority: 'medium' });
    }
    if (!user.isVerified) {
        tips.push({ icon: '✅', text: 'Xác minh tài khoản để tăng độ tin cậy!', priority: 'low' });
    }
    if (totalMatches > 0 && totalMatches < 5) {
        tips.push({ icon: '💬', text: 'Hãy chủ động nhắn tin trước!', priority: 'low' });
    }

    return tips.slice(0, 4);
}

module.exports = router;
