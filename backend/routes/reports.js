const express = require('express');
const router = express.Router();
const { User } = require('../models');
const Report = require('../models/Report');

/**
 * POST /api/reports
 * Báo cáo user vi phạm
 */
router.post('/', async (req, res) => {
    try {
        const { reporterId, reportedUserId, reason, description } = req.body;

        if (!reporterId || !reportedUserId || !reason) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin báo cáo' });
        }

        if (reporterId === reportedUserId) {
            return res.status(400).json({ success: false, message: 'Không thể tự báo cáo' });
        }

        // Check duplicate report
        const existing = await Report.findOne({ reporterId, reportedUserId });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Bạn đã báo cáo người này rồi' });
        }

        const report = new Report({ reporterId, reportedUserId, reason, description });
        await report.save();

        // Đếm số lần bị report — nếu >= 5 lần, auto-ban
        const reportCount = await Report.countDocuments({ reportedUserId, status: { $ne: 'dismissed' } });
        if (reportCount >= 5) {
            await User.updateOne({ userId: reportedUserId }, { isBanned: true });
            console.log(`🚫 Auto-banned user ${reportedUserId} (${reportCount} reports)`);
        }

        res.status(201).json({ success: true, message: 'Đã gửi báo cáo. Cảm ơn bạn!' });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ success: false, message: 'Lỗi gửi báo cáo' });
    }
});

/**
 * POST /api/reports/block
 * Chặn user
 */
router.post('/block', async (req, res) => {
    try {
        const { userId, blockedUserId } = req.body;

        if (!userId || !blockedUserId) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
        }

        await User.updateOne(
            { userId },
            { $addToSet: { blockedUsers: blockedUserId } }
        );

        res.json({ success: true, message: 'Đã chặn người dùng này' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi chặn user' });
    }
});

/**
 * POST /api/reports/unblock
 * Bỏ chặn user
 */
router.post('/unblock', async (req, res) => {
    try {
        const { userId, blockedUserId } = req.body;

        await User.updateOne(
            { userId },
            { $pull: { blockedUsers: blockedUserId } }
        );

        res.json({ success: true, message: 'Đã bỏ chặn' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi bỏ chặn' });
    }
});

/**
 * GET /api/reports/blocked/:userId
 * Lấy danh sách users đã chặn
 */
router.get('/blocked/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId }).select('blockedUsers');
        res.json({ success: true, data: { blockedUsers: user?.blockedUsers || [] } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách chặn' });
    }
});

/**
 * GET /api/reports/admin/list
 * Admin: Lấy danh sách reports
 */
router.get('/admin/list', async (req, res) => {
    try {
        const { status = 'all', page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status !== 'all') filter.status = status;

        const reports = await Report.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Report.countDocuments(filter);

        // Get user info for each report
        const userIds = [...new Set(reports.flatMap(r => [r.reporterId, r.reportedUserId]))];
        const users = await User.find({ userId: { $in: userIds } }).select('userId firstName images');
        const userMap = {};
        users.forEach(u => { userMap[u.userId] = u; });

        const enrichedReports = reports.map(r => ({
            ...r.toObject(),
            reporter: userMap[r.reporterId] || { userId: r.reporterId },
            reportedUser: userMap[r.reportedUserId] || { userId: r.reportedUserId },
        }));

        res.json({
            success: true,
            data: { reports: enrichedReports, total, page: parseInt(page), totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy reports' });
    }
});

/**
 * PUT /api/reports/admin/:reportId
 * Admin: Cập nhật status report
 */
router.put('/admin/:reportId', async (req, res) => {
    try {
        const { status, adminNote, reviewedBy } = req.body;

        const report = await Report.findByIdAndUpdate(
            req.params.reportId,
            { status, adminNote, reviewedBy, reviewedAt: new Date() },
            { new: true }
        );

        if (!report) return res.status(404).json({ success: false, message: 'Report không tồn tại' });

        // Nếu resolved → ban user
        if (status === 'resolved') {
            await User.updateOne({ userId: report.reportedUserId }, { isBanned: true });
        }

        res.json({ success: true, data: { report } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật report' });
    }
});

module.exports = router;
