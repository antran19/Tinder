const express = require('express');
const router = express.Router();
const { User, Swipe, Match, Boost } = require('../models');

/**
 * POST /api/premium/activate-boost
 * Kích hoạt Boost (đưa profile lên top trong 30 phút)
 */
router.post('/activate-boost', async (req, res) => {
    try {
        const { userId } = req.body;

        // 1. Find user
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        // 2. Check credits
        if (user.credits.boosts <= 0) {
            return res.status(403).json({
                success: false,
                message: 'Bạn đã hết Boost. Nâng cấp lên Premium để nhận 1 Boost/tháng!',
                needUpgrade: true
            });
        }

        // 3. Check if already boosted
        const activeBoost = await Boost.findOne({
            userId,
            status: 'active',
            endTime: { $gt: new Date() }
        });

        if (activeBoost) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đang trong thời gian Boost',
                data: { activeUntil: activeBoost.endTime }
            });
        }

        // 4. Create boost session
        const boostDuration = 30 * 60 * 1000; // 30 minutes
        const boost = new Boost({
            userId,
            startTime: new Date(),
            endTime: new Date(Date.now() + boostDuration),
            status: 'active'
        });

        await boost.save();

        // 5. Deduct credit
        user.credits.boosts -= 1;
        await user.save();

        console.log(`🚀 User ${userId} activated Boost until ${boost.endTime}`);

        res.json({
            success: true,
            message: 'Boost đã được kích hoạt! Profile của bạn sẽ xuất hiện ở vị trí đầu tiên trong 30 phút.',
            data: {
                boost,
                remainingBoosts: user.credits.boosts
            }
        });

    } catch (error) {
        console.error('Error activating boost:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * DELETE /api/premium/rewind/:swipeId
 * Hoàn tác swipe gần nhất
 */
router.delete('/rewind/:swipeId', async (req, res) => {
    try {
        const { swipeId } = req.params;
        const { userId } = req.body;

        // 1. Find user
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        // 2. Check if user has rewind permission
        const isPremium = user.subscription?.tier === 'premium' || user.subscription?.tier === 'gold';
        if (!isPremium && !user.credits.rewindAvailable) {
            return res.status(403).json({
                success: false,
                message: 'Rewind chỉ dành cho Premium users!',
                needUpgrade: true
            });
        }

        // 3. Find swipe
        const swipe = await Swipe.findById(swipeId);
        if (!swipe) {
            return res.status(404).json({ success: false, message: 'Swipe không tồn tại' });
        }

        // 4. Verify ownership
        if (swipe.fromUserId !== userId) {
            return res.status(403).json({ success: false, message: 'Không có quyền rewind swipe này' });
        }

        // 5. Check time limit (5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (swipe.createdAt < fiveMinutesAgo) {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể rewind trong vòng 5 phút'
            });
        }

        // 6. Delete swipe
        await Swipe.findByIdAndDelete(swipeId);

        // 7. If it created a match, delete the match too
        if (swipe.type === 'like' || swipe.type === 'super_like') {
            await Match.deleteOne({
                participants: { $all: [swipe.fromUserId, swipe.toUserId] }
            });
        }

        console.log(`⏪ User ${userId} rewinded swipe ${swipeId}`);

        res.json({
            success: true,
            message: 'Đã hoàn tác thành công',
            data: { deletedSwipe: swipe }
        });

    } catch (error) {
        console.error('Error rewinding:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/premium/upgrade
 * Nâng cấp lên Premium (Mock - không có payment thật)
 */
router.post('/upgrade', async (req, res) => {
    try {
        const { userId, tier } = req.body; // tier: 'premium' or 'gold'

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        // Mock upgrade (trong thực tế cần payment gateway)
        user.subscription.tier = tier || 'premium';
        user.subscription.startDate = new Date();
        user.subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days
        user.credits.rewindAvailable = true;
        user.credits.boosts = 1; // Premium gets 1 boost/month

        await user.save();

        console.log(`⭐ User ${userId} upgraded to ${tier}`);

        res.json({
            success: true,
            message: `Chúc mừng! Bạn đã nâng cấp lên ${tier.toUpperCase()}`,
            data: { subscription: user.subscription, credits: user.credits }
        });

    } catch (error) {
        console.error('Error upgrading:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/premium/status/:userId
 * Lấy trạng thái Premium của user
 */
router.get('/status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        res.json({
            success: true,
            data: {
                subscription: user.subscription,
                credits: user.credits,
                isPremium: user.subscription?.tier !== 'free'
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/premium/who-liked/:userId
 * Xem ai đã Like bạn
 * Free: ảnh blur, tên ẩn
 * Premium: hiện đầy đủ
 */
router.get('/who-liked/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        const isPremium = user.subscription?.tier === 'premium' || user.subscription?.tier === 'gold';

        // Tìm những ai đã like mình (mà mình chưa swipe họ)
        const likesReceived = await Swipe.find({
            toUserId: userId,
            type: { $in: ['like', 'super_like'] }
        }).sort({ createdAt: -1 });

        // Lấy danh sách userIds mà mình đã swipe
        const mySwipedIds = await Swipe.find({ fromUserId: userId }).distinct('toUserId');

        // Lọc ra những người mà mình chưa swipe (chưa xem)
        const pendingLikes = likesReceived.filter(like => !mySwipedIds.includes(like.fromUserId));

        // Lấy thông tin users
        const likerUserIds = pendingLikes.map(l => l.fromUserId);
        const likerUsers = await User.find({ userId: { $in: likerUserIds } })
            .select('userId firstName birthday gender bio images interests profileDetails isVerified isOnline');

        // Build response dựa trên premium status
        const likers = likerUsers.map(liker => {
            const swipeInfo = pendingLikes.find(l => l.fromUserId === liker.userId);

            if (isPremium) {
                // Premium: hiện đầy đủ info
                return {
                    userId: liker.userId,
                    firstName: liker.firstName,
                    birthday: liker.birthday,
                    gender: liker.gender,
                    bio: liker.bio,
                    images: liker.images || [],
                    interests: liker.interests || [],
                    profileDetails: liker.profileDetails,
                    isVerified: liker.isVerified,
                    isOnline: liker.isOnline,
                    likedAt: swipeInfo?.createdAt,
                    isSuperLike: swipeInfo?.type === 'super_like',
                    isBlurred: false
                };
            } else {
                // Free: ảnh blur, tên ẩn
                return {
                    userId: liker.userId,
                    firstName: liker.firstName ? liker.firstName.charAt(0) + '***' : '***',
                    gender: liker.gender,
                    images: liker.images?.slice(0, 1) || [],
                    interests: liker.interests?.slice(0, 2) || [],
                    likedAt: swipeInfo?.createdAt,
                    isSuperLike: swipeInfo?.type === 'super_like',
                    isBlurred: true
                };
            }
        });

        res.json({
            success: true,
            data: {
                likers,
                totalLikes: likesReceived.length,
                pendingLikes: pendingLikes.length,
                isPremium
            }
        });

    } catch (error) {
        console.error('Error getting who liked:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/premium/purchase
 * Tạo giao dịch thanh toán
 */
router.post('/purchase', async (req, res) => {
    try {
        const { userId, tier, paymentMethod, amount } = req.body;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        // Tạo transaction record
        const transaction = {
            transactionId: 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            userId,
            tier,
            amount: parseInt(amount),
            paymentMethod,
            status: 'pending',
            createdAt: new Date()
        };

        // Giả lập xử lý thanh toán (trong thực tế gọi payment gateway)
        // Simulate 1.5s processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Cập nhật transaction status
        transaction.status = 'completed';
        transaction.completedAt = new Date();

        // Cập nhật subscription cho user
        const durationDays = tier === 'gold' ? 30 : 30;
        user.subscription.tier = tier;
        user.subscription.startDate = new Date();
        user.subscription.endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        user.credits.rewindAvailable = true;
        user.credits.boosts = tier === 'gold' ? 3 : 1;

        // Lưu transaction vào user (thêm array transactions)
        if (!user.transactions) user.transactions = [];
        user.transactions.push(transaction);
        await user.save();

        console.log(`💳 Payment completed: ${transaction.transactionId} - ${tier} - ${amount}đ via ${paymentMethod}`);

        res.json({
            success: true,
            message: `Thanh toán thành công! Đã kích hoạt ${tier.toUpperCase()}.`,
            data: {
                transaction,
                subscription: user.subscription,
                credits: user.credits
            }
        });

    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, message: 'Lỗi xử lý thanh toán' });
    }
});

/**
 * GET /api/premium/transactions/:userId
 * Lấy lịch sử giao dịch
 */
router.get('/transactions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        const transactions = (user.transactions || []).sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json({
            success: true,
            data: {
                transactions,
                totalSpent: transactions
                    .filter(t => t.status === 'completed')
                    .reduce((sum, t) => sum + (t.amount || 0), 0)
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
