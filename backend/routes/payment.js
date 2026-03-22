const express = require('express');
const router = express.Router();
const { User } = require('../models');

/**
 * VietQR Bank Payment Route
 * Tích hợp thanh toán qua QR ngân hàng sử dụng VietQR API (chuẩn Napas 247)
 * 
 * API VietQR: https://img.vietqr.io/image/{bankId}-{accountNo}-{template}.png
 */

// ===== CẤU HÌNH NGÂN HÀNG NHẬN TIỀN =====
// Thay đổi thông tin này thành tài khoản ngân hàng thực của bạn
const BANK_CONFIG = {
    bankId: 'MB',              // MB Bank
    accountNo: '0974114657',   // Số tài khoản ngân hàng
    accountName: 'TRAN NGUYEN MINH AN', // Tên chủ tài khoản
    template: 'compact2'       // Template QR: compact, compact2, qr_only, print
};

// Danh sách ngân hàng phổ biến tại Việt Nam (để user chọn)
const SUPPORTED_BANKS = [
    { id: 'MB', name: 'MB Bank', shortName: 'MB', logo: '🏦' },
    { id: 'VCB', name: 'Vietcombank', shortName: 'VCB', logo: '🏦' },
    { id: 'TCB', name: 'Techcombank', shortName: 'TCB', logo: '🏦' },
    { id: 'ACB', name: 'ACB', shortName: 'ACB', logo: '🏦' },
    { id: 'BIDV', name: 'BIDV', shortName: 'BIDV', logo: '🏦' },
    { id: 'VPB', name: 'VPBank', shortName: 'VPB', logo: '🏦' },
    { id: 'TPB', name: 'TPBank', shortName: 'TPB', logo: '🏦' },
    { id: 'STB', name: 'Sacombank', shortName: 'STB', logo: '🏦' },
    { id: 'VIB', name: 'VIB', shortName: 'VIB', logo: '🏦' },
    { id: 'SHB', name: 'SHB', shortName: 'SHB', logo: '🏦' },
    { id: 'MSB', name: 'MSB', shortName: 'MSB', logo: '🏦' },
    { id: 'HDB', name: 'HDBank', shortName: 'HDB', logo: '🏦' },
    { id: 'OCB', name: 'OCB', shortName: 'OCB', logo: '🏦' },
    { id: 'LPB', name: 'LienVietPostBank', shortName: 'LPB', logo: '🏦' },
    { id: 'SEAB', name: 'SeABank', shortName: 'SEAB', logo: '🏦' },
];

/**
 * POST /api/payment/generate-qr
 * Tạo QR code chuyển khoản ngân hàng
 * 
 * Body: { userId, tier, amount }
 * Response: { qrDataURL, bankInfo, transactionCode, amount }
 */
router.post('/generate-qr', async (req, res) => {
    try {
        const { userId, tier, amount } = req.body;

        if (!userId || !tier || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin: userId, tier, amount là bắt buộc'
            });
        }

        // Kiểm tra user tồn tại
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        // Tạo mã giao dịch unique
        const transactionCode = `TINDER${tier.toUpperCase()}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Nội dung chuyển khoản (sẽ hiện trên app ngân hàng của người chuyển)
        const transferContent = transactionCode;

        // Tạo URL QR VietQR
        // Format: https://img.vietqr.io/image/{bankId}-{accountNo}-{template}.png?amount={amount}&addInfo={content}&accountName={name}
        const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

        // Lưu transaction pending vào user
        const transaction = {
            transactionId: transactionCode,
            userId,
            tier,
            amount: parseInt(amount),
            paymentMethod: 'bank_qr',
            status: 'pending',
            createdAt: new Date()
        };

        if (!user.transactions) user.transactions = [];
        user.transactions.push(transaction);
        await user.save();

        console.log(`📱 QR generated for user ${userId}: ${transactionCode} - ${amount}đ - ${tier}`);

        res.json({
            success: true,
            message: 'QR code đã được tạo thành công',
            data: {
                qrUrl,
                transactionCode,
                amount: parseInt(amount),
                tier,
                bankInfo: {
                    bankId: BANK_CONFIG.bankId,
                    bankName: SUPPORTED_BANKS.find(b => b.id === BANK_CONFIG.bankId)?.name || BANK_CONFIG.bankId,
                    accountNo: BANK_CONFIG.accountNo,
                    accountName: BANK_CONFIG.accountName,
                    transferContent
                },
                expiresAt: new Date(Date.now() + 15 * 60 * 1000) // QR hết hạn sau 15 phút
            }
        });

    } catch (error) {
        console.error('Error generating QR:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo mã QR' });
    }
});

/**
 * POST /api/payment/confirm-transfer
 * Xác nhận đã chuyển khoản (admin hoặc tự động qua webhook)
 * Trong demo này, user bấm "Đã chuyển khoản" -> admin xác nhận
 * 
 * Body: { userId, transactionCode }
 */
router.post('/confirm-transfer', async (req, res) => {
    try {
        const { userId, transactionCode } = req.body;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        // Tìm transaction
        const txIndex = user.transactions.findIndex(t => t.transactionId === transactionCode);
        if (txIndex === -1) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
        }

        const transaction = user.transactions[txIndex];

        // Kiểm tra trạng thái
        if (transaction.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Giao dịch đã được xử lý trước đó' });
        }

        // Giả lập thời gian xử lý xác nhận
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Cập nhật transaction
        user.transactions[txIndex].status = 'completed';
        user.transactions[txIndex].completedAt = new Date();

        // Kích hoạt subscription
        const tier = transaction.tier;
        const durationDays = 30;
        user.subscription.tier = tier;
        user.subscription.startDate = new Date();
        user.subscription.endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        user.credits.rewindAvailable = true;
        user.credits.boosts = tier === 'gold' ? 3 : 1;

        await user.save();

        console.log(`✅ Bank transfer confirmed: ${transactionCode} - ${tier} for user ${userId}`);

        res.json({
            success: true,
            message: `Xác nhận thành công! Đã kích hoạt gói ${tier.toUpperCase()}.`,
            data: {
                transaction: user.transactions[txIndex],
                subscription: user.subscription,
                credits: user.credits
            }
        });

    } catch (error) {
        console.error('Error confirming transfer:', error);
        res.status(500).json({ success: false, message: 'Lỗi xác nhận giao dịch' });
    }
});

/**
 * GET /api/payment/banks
 * Lấy danh sách ngân hàng được hỗ trợ
 */
router.get('/banks', (req, res) => {
    res.json({
        success: true,
        data: {
            banks: SUPPORTED_BANKS,
            receiverBank: {
                bankId: BANK_CONFIG.bankId,
                bankName: SUPPORTED_BANKS.find(b => b.id === BANK_CONFIG.bankId)?.name || BANK_CONFIG.bankId,
                accountNo: BANK_CONFIG.accountNo,
                accountName: BANK_CONFIG.accountName
            }
        }
    });
});

/**
 * GET /api/payment/check-status/:transactionCode
 * Kiểm tra trạng thái giao dịch
 */
router.get('/check-status/:transactionCode', async (req, res) => {
    try {
        const { transactionCode } = req.params;

        // Tìm user có transaction này
        const user = await User.findOne({
            'transactions.transactionId': transactionCode
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
        }

        const transaction = user.transactions.find(t => t.transactionId === transactionCode);

        res.json({
            success: true,
            data: {
                transactionCode: transaction.transactionId,
                status: transaction.status,
                amount: transaction.amount,
                tier: transaction.tier,
                createdAt: transaction.createdAt,
                completedAt: transaction.completedAt
            }
        });

    } catch (error) {
        console.error('Error checking status:', error);
        res.status(500).json({ success: false, message: 'Lỗi kiểm tra trạng thái' });
    }
});

module.exports = router;
