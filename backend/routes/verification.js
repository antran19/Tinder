const express = require('express');
const router = express.Router();
const { User } = require('../models');

/**
 * POST /api/verification/submit
 * User gửi selfie để xác minh
 */
router.post('/submit', async (req, res) => {
    try {
        const { userId, selfieUrl } = req.body;

        if (!userId || !selfieUrl) {
            return res.status(400).json({ success: false, message: 'Cần userId và selfieUrl' });
        }

        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ success: false, message: 'User không tồn tại' });

        if (user.verification?.status === 'pending') {
            return res.status(400).json({ success: false, message: 'Bạn đã gửi yêu cầu xác minh rồi. Vui lòng chờ duyệt.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'Tài khoản đã được xác minh' });
        }

        await User.updateOne({ userId }, {
            'verification.status': 'pending',
            'verification.selfieUrl': selfieUrl,
            'verification.submittedAt': new Date()
        });

        console.log(`📸 Verification request from ${userId}`);

        res.json({ success: true, message: 'Đã gửi yêu cầu xác minh! Admin sẽ duyệt trong vòng 24h.' });
    } catch (error) {
        console.error('Verification submit error:', error);
        res.status(500).json({ success: false, message: 'Lỗi gửi xác minh' });
    }
});

/**
 * GET /api/verification/status/:userId
 * Check trạng thái xác minh
 */
router.get('/status/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId })
            .select('isVerified verification');

        if (!user) return res.status(404).json({ success: false });

        res.json({
            success: true,
            data: {
                isVerified: user.isVerified,
                verification: user.verification || { status: 'none' }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy trạng thái' });
    }
});

/**
 * GET /api/verification/admin/pending
 * Admin: Lấy danh sách chờ duyệt
 */
router.get('/admin/pending', async (req, res) => {
    try {
        const users = await User.find({ 'verification.status': 'pending' })
            .select('userId firstName images verification')
            .sort({ 'verification.submittedAt': -1 });

        res.json({ success: true, data: { requests: users } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách' });
    }
});

/**
 * PUT /api/verification/admin/review/:userId
 * Admin: Duyệt/Từ chối xác minh
 */
router.put('/admin/review/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { action, reviewedBy } = req.body; // action: 'approve' | 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Action phải là approve hoặc reject' });
        }

        const updates = {
            'verification.status': action === 'approve' ? 'approved' : 'rejected',
            'verification.reviewedAt': new Date(),
            'verification.reviewedBy': reviewedBy || 'admin'
        };

        if (action === 'approve') {
            updates.isVerified = true;
        }

        await User.updateOne({ userId }, updates);

        // Gửi thông báo realtime
        if (global.io) {
            global.io.to(userId.toLowerCase()).emit('verification-result', {
                status: action === 'approve' ? 'approved' : 'rejected',
                message: action === 'approve'
                    ? '🎉 Tài khoản đã được xác minh! Bạn đã có tích xanh ✅'
                    : '❌ Yêu cầu xác minh bị từ chối. Vui lòng thử lại với ảnh selfie rõ mặt.'
            });
        }

        console.log(`✅ Verification ${action}d for ${userId}`);

        res.json({ success: true, message: `Đã ${action === 'approve' ? 'duyệt' : 'từ chối'} xác minh cho ${userId}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi duyệt xác minh' });
    }
});

module.exports = router;
