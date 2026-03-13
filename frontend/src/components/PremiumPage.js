import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import './PremiumPage.css';

const PremiumPage = () => {
    const { user, updateUserData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('momo');
    const [paymentStep, setPaymentStep] = useState('select'); // select, processing, success, failed
    const [transactions, setTransactions] = useState([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [showHistory, setShowHistory] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');

    useEffect(() => {
        if (user) loadTransactions();
    }, [user]);

    const loadTransactions = async () => {
        try {
            const data = await apiService.getTransactions(user.userId);
            setTransactions(data.transactions || []);
            setTotalSpent(data.totalSpent || 0);
        } catch (error) {
            console.error(error);
        }
    };

    const openCheckout = (plan) => {
        setSelectedPlan(plan);
        setPaymentStep('select');
        setShowCheckout(true);
    };

    const handlePurchase = async () => {
        if (!user || !selectedPlan) return;

        setPaymentStep('processing');
        setLoading(true);

        try {
            const response = await apiService.purchasePremium(
                user.userId,
                selectedPlan.tier,
                paymentMethod,
                selectedPlan.rawPrice
            );

            if (response.success) {
                setPaymentStep('success');
                updateUserData({
                    subscription: response.data.subscription,
                    credits: response.data.credits
                });
                loadTransactions();
            }
        } catch (error) {
            setPaymentStep('failed');
        } finally {
            setLoading(false);
        }
    };

    const closeCheckout = () => {
        setShowCheckout(false);
        setPaymentStep('select');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        if (paymentStep === 'success') {
            window.location.reload();
        }
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\D/g, '').substring(0, 16);
        const parts = [];
        for (let i = 0; i < v.length; i += 4) {
            parts.push(v.substring(i, i + 4));
        }
        return parts.join(' ');
    };

    const isPremium = user?.subscription?.tier && user?.subscription?.tier !== 'free';
    const currentTier = user?.subscription?.tier || 'free';

    const plans = [
        {
            tier: 'free',
            name: 'Free',
            price: '0đ',
            rawPrice: 0,
            features: [
                { text: 'Swipe không giới hạn', included: true },
                { text: '5 Super Likes/ngày', included: true },
                { text: 'Rewind - hoàn tác swipe', included: false },
                { text: 'Boost profile', included: false },
                { text: 'Xem ai đã like bạn', included: false },
                { text: 'Badge đặc biệt', included: false },
            ],
            badge: 'Cơ bản',
            class: 'free'
        },
        {
            tier: 'premium',
            name: 'Premium',
            price: '149,000đ',
            rawPrice: 149000,
            pricePerDay: '4,967đ',
            features: [
                { text: 'Tất cả tính năng Free', included: true },
                { text: 'Super Likes không giới hạn', included: true },
                { text: 'Rewind - hoàn tác swipe', included: true },
                { text: '1 Boost miễn phí/tháng', included: true },
                { text: 'Xem ai đã like bạn', included: true },
                { text: 'Top Picks hàng ngày', included: true },
            ],
            badge: 'Phổ biến nhất',
            class: 'premium',
            isPopular: true
        },
        {
            tier: 'gold',
            name: 'Gold',
            price: '299,000đ',
            rawPrice: 299000,
            pricePerDay: '9,967đ',
            features: [
                { text: 'Tất cả tính năng Premium', included: true },
                { text: '3 Boosts miễn phí/tháng', included: true },
                { text: 'Badge vàng trên profile', included: true },
                { text: 'Độ ưu tiên cao nhất', included: true },
                { text: 'Quà tặng độc quyền', included: true },
                { text: 'Hỗ trợ ưu tiên 24/7', included: true },
            ],
            badge: 'VIP',
            class: 'gold',
            isGold: true
        }
    ];

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getMethodLabel = (method) => {
        const labels = { momo: '📱 MoMo', vnpay: '🏦 VNPay', card: '💳 Thẻ Quốc tế', zalopay: '📲 ZaloPay' };
        return labels[method] || method;
    };

    const getStatusBadge = (status) => {
        const badges = {
            completed: { class: 'status-completed', label: '✅ Thành công' },
            pending: { class: 'status-pending', label: '⏳ Đang xử lý' },
            failed: { class: 'status-failed', label: '❌ Thất bại' },
            refunded: { class: 'status-refunded', label: '↩️ Hoàn tiền' },
        };
        return badges[status] || { class: '', label: status };
    };

    return (
        <div className="premium-page">
            {/* Header */}
            <div className="premium-header">
                <h1>🌟 Nâng cấp trải nghiệm</h1>
                <p>Mở khóa những đặc quyền xứng đáng dành cho bạn</p>
                {isPremium && (
                    <div className="current-plan-badge">
                        ✨ Bạn đang dùng gói <strong>{currentTier.toUpperCase()}</strong>
                        {user?.subscription?.endDate && (
                            <span> • Hết hạn: {formatDate(user.subscription.endDate)}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Plans */}
            <div className="premium-plans">
                {plans.map((plan) => (
                    <div key={plan.tier} className={`plan-card ${plan.class} ${currentTier === plan.tier ? 'current' : ''}`}>
                        {plan.badge && (
                            <div className={`plan-badge ${plan.isPopular ? 'popular' : plan.isGold ? 'vip' : ''}`}>
                                {plan.badge}
                            </div>
                        )}
                        <h2>{plan.name}</h2>
                        <div className={`plan-price ${plan.isGold ? 'gold-text' : ''}`}>
                            {plan.price}
                            {plan.tier !== 'free' && <span>/tháng</span>}
                        </div>
                        {plan.pricePerDay && (
                            <div className="price-per-day">~ {plan.pricePerDay}/ngày</div>
                        )}
                        <ul className="plan-features">
                            {plan.features.map((feature, index) => (
                                <li key={index} className={feature.included ? 'included' : 'excluded'}>
                                    {feature.included ? '✅' : '❌'} {feature.text}
                                </li>
                            ))}
                        </ul>
                        {plan.tier === 'free' ? (
                            currentTier === 'free' && <div className="plan-current">Gói hiện tại</div>
                        ) : (
                            <button
                                className={`upgrade-btn ${plan.isGold ? 'gold-btn' : ''}`}
                                onClick={() => openCheckout(plan)}
                                disabled={currentTier === plan.tier}
                            >
                                {currentTier === plan.tier ? 'Đang sử dụng ✓' : 'Nâng cấp ngay'}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Transaction History Button */}
            <div className="transaction-section">
                <button className="history-toggle-btn" onClick={() => setShowHistory(!showHistory)}>
                    📋 {showHistory ? 'Ẩn' : 'Xem'} lịch sử giao dịch
                    {transactions.length > 0 && <span className="tx-count">({transactions.length})</span>}
                </button>

                {showHistory && (
                    <div className="transaction-history">
                        <div className="tx-header">
                            <h3>💳 Lịch sử giao dịch</h3>
                            <div className="tx-total-spent">
                                Tổng chi tiêu: <strong>{totalSpent.toLocaleString('vi-VN')}đ</strong>
                            </div>
                        </div>

                        {transactions.length === 0 ? (
                            <div className="tx-empty">Chưa có giao dịch nào.</div>
                        ) : (
                            <div className="tx-list">
                                {transactions.map((tx, idx) => {
                                    const statusInfo = getStatusBadge(tx.status);
                                    return (
                                        <div key={idx} className="tx-item">
                                            <div className="tx-info">
                                                <div className="tx-plan">Gói {tx.tier?.toUpperCase()}</div>
                                                <div className="tx-id">#{tx.transactionId}</div>
                                                <div className="tx-date">{formatDate(tx.createdAt)}</div>
                                            </div>
                                            <div className="tx-meta">
                                                <div className="tx-method">{getMethodLabel(tx.paymentMethod)}</div>
                                                <div className="tx-amount">{(tx.amount || 0).toLocaleString('vi-VN')}đ</div>
                                                <div className={`tx-status ${statusInfo.class}`}>{statusInfo.label}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Feature Detail Grid */}
            <div className="premium-features-detail">
                <h2>Khám phá quyền năng đặc biệt</h2>
                <div className="feature-grid">
                    <div className="feature-item">
                        <div className="feature-icon">⭐</div>
                        <h3>Super Likes không giới hạn</h3>
                        <p>Gửi Super Like để nổi bật và tăng gấp 3 lần cơ hội được match</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">👀</div>
                        <h3>Xem ai đã thích bạn</h3>
                        <p>Biết trước ai đã like để quyết định liệu có match hay không</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">⏪</div>
                        <h3>Rewind - Hoàn tác swipe</h3>
                        <p>Pass nhầm người ưng? Rewind ngay để có cơ hội thứ hai!</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">🚀</div>
                        <h3>Boost Profile</h3>
                        <p>Đưa profile lên top trong 30 phút, tăng lượt xem gấp 10 lần</p>
                    </div>
                </div>
            </div>

            {/* CHECKOUT MODAL */}
            {showCheckout && selectedPlan && (
                <div className="checkout-overlay" onClick={closeCheckout}>
                    <div className="checkout-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={closeCheckout}>&times;</button>

                        {/* Step: SELECT PAYMENT */}
                        {paymentStep === 'select' && (
                            <>
                                <div className="checkout-header">
                                    <h2>Xác nhận thanh toán</h2>
                                    <p>Gói <strong>{selectedPlan.name}</strong></p>
                                    <div className="checkout-price">{selectedPlan.price}<span>/tháng</span></div>
                                </div>

                                <div className="payment-methods">
                                    <h4>Chọn phương thức thanh toán</h4>
                                    {[
                                        { id: 'momo', label: 'Ví MoMo', icon: '📱', desc: 'Thanh toán qua ví điện tử MoMo' },
                                        { id: 'vnpay', label: 'VNPay', icon: '🏦', desc: 'Thanh toán qua VNPay QR' },
                                        { id: 'zalopay', label: 'ZaloPay', icon: '📲', desc: 'Thanh toán qua ZaloPay' },
                                        { id: 'card', label: 'Thẻ Quốc tế', icon: '💳', desc: 'Visa / Mastercard / JCB' },
                                    ].map(method => (
                                        <div
                                            key={method.id}
                                            className={`payment-method ${paymentMethod === method.id ? 'selected' : ''}`}
                                            onClick={() => setPaymentMethod(method.id)}
                                        >
                                            <div className="method-left">
                                                <span className="method-icon">{method.icon}</span>
                                                <div>
                                                    <strong>{method.label}</strong>
                                                    <small>{method.desc}</small>
                                                </div>
                                            </div>
                                            <div className={`method-radio ${paymentMethod === method.id ? 'active' : ''}`}></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Card form nếu chọn thẻ quốc tế */}
                                {paymentMethod === 'card' && (
                                    <div className="card-form">
                                        <div className="card-form-group">
                                            <label>Số thẻ</label>
                                            <input
                                                type="text"
                                                placeholder="1234 5678 9012 3456"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                                maxLength="19"
                                            />
                                        </div>
                                        <div className="card-form-row">
                                            <div className="card-form-group">
                                                <label>Hạn thẻ</label>
                                                <input
                                                    type="text"
                                                    placeholder="MM/YY"
                                                    value={cardExpiry}
                                                    onChange={(e) => setCardExpiry(e.target.value)}
                                                    maxLength="5"
                                                />
                                            </div>
                                            <div className="card-form-group">
                                                <label>CVV</label>
                                                <input
                                                    type="password"
                                                    placeholder="•••"
                                                    value={cardCvv}
                                                    onChange={(e) => setCardCvv(e.target.value)}
                                                    maxLength="4"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Order summary */}
                                <div className="order-summary">
                                    <div className="summary-row">
                                        <span>Gói {selectedPlan.name}</span>
                                        <span>{selectedPlan.price}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Thời hạn</span>
                                        <span>30 ngày</span>
                                    </div>
                                    <div className="summary-divider"></div>
                                    <div className="summary-row total">
                                        <span>Tổng thanh toán</span>
                                        <span>{selectedPlan.price}</span>
                                    </div>
                                </div>

                                <div className="checkout-footer">
                                    <button
                                        className={`pay-btn ${selectedPlan.isGold ? 'gold-btn' : ''}`}
                                        onClick={handlePurchase}
                                        disabled={loading}
                                    >
                                        Thanh toán {selectedPlan.price}
                                    </button>
                                    <p className="secure-note">🔒 Thanh toán an toàn & bảo mật</p>
                                </div>
                            </>
                        )}

                        {/* Step: PROCESSING */}
                        {paymentStep === 'processing' && (
                            <div className="payment-processing">
                                <div className="processing-spinner"></div>
                                <h3>Đang xử lý thanh toán...</h3>
                                <p>Vui lòng không đóng trang này</p>
                            </div>
                        )}

                        {/* Step: SUCCESS */}
                        {paymentStep === 'success' && (
                            <div className="payment-result success">
                                <div className="result-icon">🎉</div>
                                <h3>Thanh toán thành công!</h3>
                                <p>Chào mừng bạn đến với <strong>{selectedPlan.name}</strong></p>
                                <div className="result-details">
                                    <div>📅 Hạn sử dụng: 30 ngày</div>
                                    <div>💰 Số tiền: {selectedPlan.price}</div>
                                    <div>{getMethodLabel(paymentMethod)}</div>
                                </div>
                                <button className="result-btn" onClick={closeCheckout}>
                                    Bắt đầu sử dụng 🚀
                                </button>
                            </div>
                        )}

                        {/* Step: FAILED */}
                        {paymentStep === 'failed' && (
                            <div className="payment-result failed">
                                <div className="result-icon">❌</div>
                                <h3>Thanh toán thất bại</h3>
                                <p>Đã xảy ra lỗi. Vui lòng thử lại.</p>
                                <button className="result-btn" onClick={() => setPaymentStep('select')}>
                                    Thử lại
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PremiumPage;
