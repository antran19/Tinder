import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import VerificationBadge from './VerificationBadge';
import './SettingsPage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SettingsPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('account');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [insights, setInsights] = useState(null);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [showBlockedList, setShowBlockedList] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [blockedLoading, setBlockedLoading] = useState(false);
    const [showReportHistory, setShowReportHistory] = useState(false);
    const [reportHistory, setReportHistory] = useState([]);
    const [reportLoading, setReportLoading] = useState(false);
    const [logoutAllLoading, setLogoutAllLoading] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        // Thông báo
        matchNotify: true,
        messageNotify: true,
        likeNotify: true,
        promotionNotify: false,
        soundEnabled: true,
        vibrationEnabled: true,

        // Quyền riêng tư
        showOnlineStatus: true,
        showLastActive: true,
        showDistance: true,
        showAge: true,
        readReceipts: true,
        profileVisible: true,

        // Hiển thị
        showVerifiedOnly: false,
        showWithPhotoOnly: false,
        language: 'vi',

        // Bảo mật
        twoFactor: false,
    });

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
        showSavedMessage();
    };

    const showSavedMessage = () => {
        setSavedMsg('✅ Đã lưu!');
        setTimeout(() => setSavedMsg(''), 2000);
    };

    const handleDeleteAccount = () => {
        // Logic xóa tài khoản (giả lập)
        alert('Tính năng đang được phát triển. Vui lòng liên hệ hỗ trợ.');
        setShowDeleteConfirm(false);
    };

    const tabs = [
        { id: 'account', label: 'Tài khoản', icon: '👤' },
        { id: 'insights', label: 'Insights', icon: '📊' },
        { id: 'notifications', label: 'Thông báo', icon: '🔔' },
        { id: 'privacy', label: 'Riêng tư', icon: '🔒' },
        { id: 'security', label: 'Bảo mật', icon: '🛡️' },
        { id: 'about', label: 'Về ứng dụng', icon: 'ℹ️' },
    ];

    const loadInsights = async () => {
        try {
            setInsightsLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/insights/${user?.userId}`);
            const data = await res.json();
            if (data.success) setInsights(data.data);
        } catch (e) {
            console.error('Insights error:', e);
        } finally {
            setInsightsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'insights' && !insights) loadInsights();
    }, [activeTab]);

    const ToggleSwitch = ({ enabled, onToggle, label, desc }) => (
        <div className="setting-item" onClick={onToggle}>
            <div className="setting-info">
                <span className="setting-label">{label}</span>
                {desc && <span className="setting-desc">{desc}</span>}
            </div>
            <div className={`setting-toggle ${enabled ? 'active' : ''}`}>
                <div className="toggle-knob"></div>
            </div>
        </div>
    );

    return (
        <div className="settings-page">
            {/* Header */}
            <div className="settings-header">
                <h1>⚙️ Cài đặt</h1>
                {savedMsg && <div className="settings-saved-msg">{savedMsg}</div>}
            </div>

            <div className="settings-layout">
                {/* Sidebar */}
                <div className="settings-sidebar">
                    {/* User Info */}
                    <div className="settings-user-card">
                        <div className="settings-avatar">
                            {user?.firstName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="settings-user-info">
                            <h3>{user?.firstName || 'Người dùng'}</h3>
                            <span className="settings-user-id">@{user?.userId}</span>
                            <span className={`settings-tier ${user?.subscription?.tier || 'free'}`}>
                                {user?.subscription?.tier === 'gold' ? '👑 Gold' :
                                 user?.subscription?.tier === 'premium' ? '⭐ Premium' : '🆓 Free'}
                            </span>
                        </div>
                    </div>

                    {/* Profile Completion Score */}
                    {(() => {
                        const checks = [
                            { label: 'Ảnh đại diện', done: user?.images?.length > 0 },
                            { label: 'Bio', done: user?.bio?.length > 10 },
                            { label: 'Sở thích', done: user?.interests?.length >= 3 },
                            { label: 'Nghề nghiệp', done: !!user?.profileDetails?.occupation },
                            { label: 'Học vấn', done: !!user?.profileDetails?.education },
                            { label: 'Xác minh', done: user?.isVerified },
                            { label: 'Nhiều ảnh (3+)', done: user?.images?.length >= 3 },
                        ];
                        const done = checks.filter(c => c.done).length;
                        const pct = Math.round((done / checks.length) * 100);
                        const circumference = 2 * Math.PI * 32;
                        const offset = circumference - (pct / 100) * circumference;
                        const color = pct >= 80 ? '#4ade80' : pct >= 50 ? '#f59e0b' : '#ef4444';

                        return (
                            <div className="profile-score-card">
                                <div className="score-visual">
                                    <svg width="76" height="76" viewBox="0 0 76 76">
                                        <circle cx="38" cy="38" r="32" fill="none" stroke="rgba(100,116,139,0.1)" strokeWidth="5"/>
                                        <circle cx="38" cy="38" r="32" fill="none" stroke={color} strokeWidth="5"
                                            strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={offset}
                                            transform="rotate(-90 38 38)"
                                            style={{transition: 'stroke-dashoffset 0.8s ease'}}
                                        />
                                    </svg>
                                    <span className="score-pct" style={{color}}>{pct}%</span>
                                </div>
                                <div className="score-info">
                                    <strong>Hoàn thiện hồ sơ</strong>
                                    <span className="score-detail">{done}/{checks.length} mục</span>
                                </div>
                                {pct < 100 && (
                                    <div className="score-tips">
                                        {checks.filter(c => !c.done).slice(0, 2).map((c, i) => (
                                            <span key={i} className="score-tip">+ {c.label}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Nav Tabs */}
                    <nav className="settings-nav">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="settings-nav-icon">{tab.icon}</span>
                                <span className="settings-nav-label">{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Admin Link */}
                    {user?.role === 'admin' && (
                        <button 
                            className="settings-admin-btn"
                            onClick={() => navigate('/admin')}
                        >
                            🛠️ Admin Dashboard
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="settings-content">
                    {/* ===== TÀI KHOẢN ===== */}
                    {activeTab === 'account' && (
                        <div className="settings-panel">
                            <h2>👤 Thông tin tài khoản</h2>

                            <div className="settings-section">
                                <h3>Thông tin cá nhân</h3>
                                <div className="info-row">
                                    <span className="info-label">Tên</span>
                                    <span className="info-value">{user?.firstName || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">User ID</span>
                                    <span className="info-value">@{user?.userId}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Email/SĐT</span>
                                    <span className="info-value">{user?.phoneNumber || 'Chưa liên kết'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Giới tính</span>
                                    <span className="info-value">{user?.gender === 'male' ? 'Nam' : user?.gender === 'female' ? 'Nữ' : 'Chưa cập nhật'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Xác minh</span>
                                    <span className={`info-value ${user?.isVerified ? 'verified' : ''}`}>
                                        {user?.isVerified ? '✅ Đã xác minh' : (
                                            <button className="verify-now-btn" onClick={() => setShowVerification(true)}>
                                                📸 Xác minh ngay
                                            </button>
                                        )}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Ngày tạo</span>
                                    <span className="info-value">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3>Gói đăng ký</h3>
                                <div className="subscription-display">
                                    <div className="sub-tier-badge">
                                        {user?.subscription?.tier === 'gold' ? '👑' :
                                         user?.subscription?.tier === 'premium' ? '⭐' : '🆓'}
                                        <span>{(user?.subscription?.tier || 'free').toUpperCase()}</span>
                                    </div>
                                    {user?.subscription?.endDate && (
                                        <p className="sub-expiry">
                                            Hết hạn: {new Date(user.subscription.endDate).toLocaleDateString('vi-VN')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="settings-section danger-section">
                                <h3>⚠️ Vùng nguy hiểm</h3>
                                <button className="logout-setting-btn" onClick={() => setShowLogoutConfirm(true)}>
                                    🚪 Đăng xuất
                                </button>
                                <button className="delete-account-btn" onClick={() => setShowDeleteConfirm(true)}>
                                    🗑️ Xóa tài khoản vĩnh viễn
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== INSIGHTS ===== */}
                    {activeTab === 'insights' && (
                        <div className="settings-panel">
                            <h2>📊 Insights</h2>
                            {insightsLoading ? (
                                <div style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>⏳ Đang tải...</div>
                            ) : insights ? (
                                <>
                                    <div className="insights-grid">
                                        <div className="insight-card pink">
                                            <span className="insight-number">{insights.stats.likesReceived}</span>
                                            <span className="insight-label">Lượt thích nhận</span>
                                        </div>
                                        <div className="insight-card purple">
                                            <span className="insight-number">{insights.stats.superLikesReceived}</span>
                                            <span className="insight-label">Super Like nhận</span>
                                        </div>
                                        <div className="insight-card blue">
                                            <span className="insight-number">{insights.stats.totalMatches}</span>
                                            <span className="insight-label">Matches</span>
                                        </div>
                                        <div className="insight-card green">
                                            <span className="insight-number">{insights.stats.matchRate}%</span>
                                            <span className="insight-label">Match Rate</span>
                                        </div>
                                        <div className="insight-card amber">
                                            <span className="insight-number">{insights.stats.rightSwipeRate}%</span>
                                            <span className="insight-label">Right Swipe Rate</span>
                                        </div>
                                        <div className="insight-card teal">
                                            <span className="insight-number">{insights.stats.recentLikes}</span>
                                            <span className="insight-label">Likes (7 ngày)</span>
                                        </div>
                                    </div>

                                    {insights.tips?.length > 0 && (
                                        <div className="settings-section">
                                            <h3>💡 Gợi ý cải thiện</h3>
                                            <div className="insight-tips">
                                                {insights.tips.map((tip, i) => (
                                                    <div key={i} className={`insight-tip ${tip.priority}`}>
                                                        <span>{tip.icon}</span>
                                                        <span>{tip.text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {insights.topInterestsFromLikers?.length > 0 && (
                                        <div className="settings-section">
                                            <h3>🎯 Sở thích phổ biến từ người thích bạn</h3>
                                            <div className="insight-interests">
                                                {insights.topInterestsFromLikers.map((t, i) => (
                                                    <span key={i} className="insight-interest-tag">{t.interest} ({t.count})</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button className="ai-refresh-btn" onClick={loadInsights} style={{marginTop:'1rem', display:'block', marginLeft:'auto', marginRight:'auto'}}>
                                        🔄 Làm mới
                                    </button>
                                </>
                            ) : (
                                <p style={{textAlign:'center', color:'var(--text-muted)'}}>Không có dữ liệu</p>
                            )}
                        </div>
                    )}

                    {/* ===== THÔNG BÁO ===== */}
                    {activeTab === 'notifications' && (
                        <div className="settings-panel">
                            <h2>🔔 Cài đặt thông báo</h2>

                            <div className="settings-section">
                                <h3>Loại thông báo</h3>
                                <ToggleSwitch
                                    enabled={settings.matchNotify}
                                    onToggle={() => handleToggle('matchNotify')}
                                    label="Match mới"
                                    desc="Nhận thông báo khi có người match với bạn"
                                />
                                <ToggleSwitch
                                    enabled={settings.messageNotify}
                                    onToggle={() => handleToggle('messageNotify')}
                                    label="Tin nhắn mới"
                                    desc="Nhận thông báo khi có tin nhắn"
                                />
                                <ToggleSwitch
                                    enabled={settings.likeNotify}
                                    onToggle={() => handleToggle('likeNotify')}
                                    label="Lượt thích"
                                    desc="Nhận thông báo khi có người thích bạn"
                                />
                                <ToggleSwitch
                                    enabled={settings.promotionNotify}
                                    onToggle={() => handleToggle('promotionNotify')}
                                    label="Khuyến mãi & Tin tức"
                                    desc="Nhận thông báo về ưu đãi và cập nhật mới"
                                />
                            </div>

                            <div className="settings-section">
                                <h3>Âm thanh & Rung</h3>
                                <ToggleSwitch
                                    enabled={settings.soundEnabled}
                                    onToggle={() => handleToggle('soundEnabled')}
                                    label="Âm thanh thông báo"
                                    desc="Phát âm thanh khi có thông báo mới"
                                />
                                <ToggleSwitch
                                    enabled={settings.vibrationEnabled}
                                    onToggle={() => handleToggle('vibrationEnabled')}
                                    label="Rung"
                                    desc="Rung khi có thông báo quan trọng"
                                />
                            </div>
                        </div>
                    )}

                    {/* ===== QUYỀN RIÊNG TƯ ===== */}
                    {activeTab === 'privacy' && (
                        <div className="settings-panel">
                            <h2>🔒 Quyền riêng tư</h2>

                            <div className="settings-section">
                                <h3>Hiển thị hồ sơ</h3>
                                <ToggleSwitch
                                    enabled={settings.profileVisible}
                                    onToggle={() => handleToggle('profileVisible')}
                                    label="Hiển thị hồ sơ"
                                    desc="Tắt để ẩn hồ sơ khỏi phần khám phá"
                                />
                                <ToggleSwitch
                                    enabled={settings.showOnlineStatus}
                                    onToggle={() => handleToggle('showOnlineStatus')}
                                    label="Trạng thái online"
                                    desc="Cho phép người khác thấy bạn đang trực tuyến"
                                />
                                <ToggleSwitch
                                    enabled={settings.showLastActive}
                                    onToggle={() => handleToggle('showLastActive')}
                                    label="Hoạt động gần đây"
                                    desc="Hiển thị thời gian lần cuối bạn online"
                                />
                                <ToggleSwitch
                                    enabled={settings.showAge}
                                    onToggle={() => handleToggle('showAge')}
                                    label="Hiển thị tuổi"
                                    desc="Cho phép người khác thấy tuổi của bạn"
                                />
                                <ToggleSwitch
                                    enabled={settings.showDistance}
                                    onToggle={() => handleToggle('showDistance')}
                                    label="Hiển thị khoảng cách"
                                    desc="Cho phép hiện khoảng cách đến bạn"
                                />
                            </div>

                            <div className="settings-section">
                                <h3>Tin nhắn</h3>
                                <ToggleSwitch
                                    enabled={settings.readReceipts}
                                    onToggle={() => handleToggle('readReceipts')}
                                    label="Xác nhận đã đọc"
                                    desc="Cho phép người khác thấy tin nhắn đã được đọc"
                                />
                            </div>

                            <div className="settings-section">
                                <h3>Lọc nội dung</h3>
                                <ToggleSwitch
                                    enabled={settings.showVerifiedOnly}
                                    onToggle={() => handleToggle('showVerifiedOnly')}
                                    label="Chỉ hiện tài khoản đã xác minh"
                                    desc="Chỉ xem hồ sơ đã được xác minh danh tính"
                                />
                                <ToggleSwitch
                                    enabled={settings.showWithPhotoOnly}
                                    onToggle={() => handleToggle('showWithPhotoOnly')}
                                    label="Chỉ hiện hồ sơ có ảnh"
                                    desc="Bỏ qua các hồ sơ không có ảnh"
                                />
                            </div>
                        </div>
                    )}

                    {/* ===== BẢO MẬT ===== */}
                    {activeTab === 'security' && (
                        <div className="settings-panel">
                            <h2>🛡️ Bảo mật</h2>

                            <div className="settings-section">
                                <h3>Xác thực</h3>
                                <ToggleSwitch
                                    enabled={settings.twoFactor}
                                    onToggle={() => handleToggle('twoFactor')}
                                    label="Xác thực 2 bước (2FA)"
                                    desc="Thêm lớp bảo vệ khi đăng nhập"
                                />
                            </div>

                            <div className="settings-section">
                                <h3>Mật khẩu</h3>
                                <div className="change-password-form">
                                    <input 
                                        type="password" 
                                        placeholder="Mật khẩu hiện tại"
                                        id="currentPassword"
                                        className="settings-input"
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                                        id="newPassword"
                                        className="settings-input"
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="Xác nhận mật khẩu mới"
                                        id="confirmPassword"
                                        className="settings-input"
                                    />
                                    <button className="setting-action-btn" onClick={async () => {
                                        const currentPw = document.getElementById('currentPassword').value;
                                        const newPw = document.getElementById('newPassword').value;
                                        const confirmPw = document.getElementById('confirmPassword').value;

                                        if (!currentPw || !newPw) return alert('Vui lòng nhập đầy đủ.');
                                        if (newPw.length < 6) return alert('Mật khẩu mới phải có ít nhất 6 ký tự.');
                                        if (newPw !== confirmPw) return alert('Mật khẩu xác nhận không khớp.');

                                        try {
                                            const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ userId: user?.userId, currentPassword: currentPw, newPassword: newPw })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                alert('✅ Đổi mật khẩu thành công!');
                                                document.getElementById('currentPassword').value = '';
                                                document.getElementById('newPassword').value = '';
                                                document.getElementById('confirmPassword').value = '';
                                            } else {
                                                alert(data.message);
                                            }
                                        } catch (e) {
                                            alert('Lỗi đổi mật khẩu.');
                                        }
                                    }}>
                                        🔑 Đổi mật khẩu
                                    </button>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3>Phiên đăng nhập</h3>
                                <div className="session-info">
                                    <div className="session-item current">
                                        <div className="session-icon">💻</div>
                                        <div className="session-details">
                                            <span className="session-device">Trình duyệt hiện tại</span>
                                            <span className="session-time">Đang hoạt động</span>
                                        </div>
                                        <span className="session-badge active">Hiện tại</span>
                                    </div>
                                </div>
                                <button 
                                    className="setting-action-btn danger"
                                    disabled={logoutAllLoading}
                                    onClick={async () => {
                                        if (!window.confirm('Đăng xuất tất cả thiết bị khác? Thiết bị hiện tại vẫn giữ đăng nhập.')) return;
                                        setLogoutAllLoading(true);
                                        try {
                                            const res = await fetch(`${API_BASE_URL}/api/auth/logout-all`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ userId: user?.userId })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                localStorage.setItem('dating_token', data.data.token);
                                                alert('✅ Đã đăng xuất tất cả thiết bị khác!');
                                            } else {
                                                alert(data.message);
                                            }
                                        } catch (e) { alert('Lỗi.'); }
                                        setLogoutAllLoading(false);
                                    }}
                                >
                                    {logoutAllLoading ? '⏳ Đang xử lý...' : '🚫 Đăng xuất tất cả thiết bị khác'}
                                </button>
                            </div>

                            <div className="settings-section">
                                <h3>Chặn & Báo cáo</h3>
                                <button className="setting-action-btn" onClick={async () => {
                                    setShowBlockedList(true);
                                    setBlockedLoading(true);
                                    try {
                                        const token = localStorage.getItem('dating_token');
                                        const res = await fetch(`${API_BASE_URL}/api/reports/blocked/${user?.userId}`, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        const data = await res.json();
                                        if (data.success) setBlockedUsers(data.data.blockedUsers);
                                    } catch (e) { console.error(e); }
                                    setBlockedLoading(false);
                                }}>
                                    🚫 Danh sách đã chặn
                                </button>
                                <button className="setting-action-btn" onClick={async () => {
                                    setShowReportHistory(true);
                                    setReportLoading(true);
                                    try {
                                        const token = localStorage.getItem('dating_token');
                                        const res = await fetch(`${API_BASE_URL}/api/reports/history/${user?.userId}`, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        const data = await res.json();
                                        if (data.success) setReportHistory(data.data.reports);
                                    } catch (e) { console.error(e); }
                                    setReportLoading(false);
                                }}>
                                    📋 Lịch sử báo cáo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== VỀ ỨNG DỤNG ===== */}
                    {activeTab === 'about' && (
                        <div className="settings-panel">
                            <h2>ℹ️ Về ứng dụng</h2>

                            <div className="settings-section">
                                <div className="about-app">
                                    <div className="about-logo">🔥</div>
                                    <h3>Dating App</h3>
                                    <p className="about-version">Phiên bản 2.0.0</p>
                                    <p className="about-desc">
                                        Ứng dụng hẹn hò trực tuyến giúp bạn tìm kiếm và kết nối 
                                        với những người phù hợp xung quanh bạn.
                                    </p>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3>Liên kết</h3>
                                <div className="about-links">
                                    <button className="about-link-btn">📖 Điều khoản sử dụng</button>
                                    <button className="about-link-btn">🔐 Chính sách bảo mật</button>
                                    <button className="about-link-btn">📬 Liên hệ hỗ trợ</button>
                                    <button className="about-link-btn">⭐ Đánh giá ứng dụng</button>
                                    <button className="about-link-btn">📢 Theo dõi chúng tôi</button>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3>Thông tin kỹ thuật</h3>
                                <div className="tech-info">
                                    <div className="info-row">
                                        <span className="info-label">Frontend</span>
                                        <span className="info-value">React 18</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Backend</span>
                                        <span className="info-value">Node.js + Express</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Database</span>
                                        <span className="info-value">MongoDB</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Realtime</span>
                                        <span className="info-value">Socket.IO</span>
                                    </div>
                                </div>
                            </div>

                            <div className="about-footer">
                                <p>Made with ❤️ by FPT Students</p>
                                <p className="copyright">© 2026 Dating App. All rights reserved.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Account Confirm Modal */}
            {showDeleteConfirm && (
                <div className="settings-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="settings-modal danger" onClick={e => e.stopPropagation()}>
                        <div className="modal-danger-icon">⚠️</div>
                        <h3>Xóa tài khoản vĩnh viễn?</h3>
                        <p>Hành động này không thể hoàn tác. Tất cả dữ liệu, matches, và tin nhắn sẽ bị xóa vĩnh viễn.</p>
                        <div className="modal-danger-actions">
                            <button className="modal-cancel" onClick={() => setShowDeleteConfirm(false)}>Hủy bỏ</button>
                            <button className="modal-delete" onClick={handleDeleteAccount}>Xóa tài khoản</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirm Modal */}
            {showLogoutConfirm && (
                <div className="settings-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="settings-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-danger-icon">🚪</div>
                        <h3>Đăng xuất?</h3>
                        <p>Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?</p>
                        <div className="modal-danger-actions">
                            <button className="modal-cancel" onClick={() => setShowLogoutConfirm(false)}>Hủy</button>
                            <button className="modal-confirm" onClick={logout}>Đăng xuất</button>
                        </div>
                    </div>
                </div>
            )}

            {showVerification && (
                <VerificationBadge onClose={() => setShowVerification(false)} />
            )}

            {/* Blocked Users Modal */}
            {showBlockedList && (
                <div className="settings-modal-overlay" onClick={() => setShowBlockedList(false)}>
                    <div className="settings-modal wide" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-row">
                            <h3>🚫 Danh sách đã chặn</h3>
                            <button className="modal-close-x" onClick={() => setShowBlockedList(false)}>✕</button>
                        </div>
                        {blockedLoading ? (
                            <p style={{textAlign:'center', padding:'1rem', color:'var(--text-muted)'}}>⏳ Đang tải...</p>
                        ) : blockedUsers.length === 0 ? (
                            <div className="empty-modal-state">
                                <span className="empty-icon-lg">✅</span>
                                <p>Bạn chưa chặn ai</p>
                            </div>
                        ) : (
                            <div className="blocked-list">
                                {blockedUsers.map(bu => (
                                    <div key={bu.userId} className="blocked-item">
                                        <div className="blocked-user-info">
                                            {bu.images && bu.images.length > 0 ? (
                                                <img src={bu.images[0].startsWith('http') ? bu.images[0] : `${API_BASE_URL}${bu.images[0]}`} alt="" className="blocked-avatar" />
                                            ) : (
                                                <div className="blocked-avatar-placeholder">{(bu.firstName || bu.userId || '?').charAt(0).toUpperCase()}</div>
                                            )}
                                            <span className="blocked-name">{bu.firstName || bu.userId}</span>
                                        </div>
                                        <button className="unblock-btn" onClick={async () => {
                                            try {
                                                const token = localStorage.getItem('dating_token');
                                                const res = await fetch(`${API_BASE_URL}/api/reports/unblock`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                    body: JSON.stringify({ userId: user?.userId, blockedUserId: bu.userId })
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    setBlockedUsers(prev => prev.filter(u => u.userId !== bu.userId));
                                                }
                                            } catch (e) { alert('Lỗi bỏ chặn.'); }
                                        }}>
                                            Bỏ chặn
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Report History Modal */}
            {showReportHistory && (
                <div className="settings-modal-overlay" onClick={() => setShowReportHistory(false)}>
                    <div className="settings-modal wide" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-row">
                            <h3>📋 Lịch sử báo cáo</h3>
                            <button className="modal-close-x" onClick={() => setShowReportHistory(false)}>✕</button>
                        </div>
                        {reportLoading ? (
                            <p style={{textAlign:'center', padding:'1rem', color:'var(--text-muted)'}}>⏳ Đang tải...</p>
                        ) : reportHistory.length === 0 ? (
                            <div className="empty-modal-state">
                                <span className="empty-icon-lg">📭</span>
                                <p>Bạn chưa gửi báo cáo nào</p>
                            </div>
                        ) : (
                            <div className="report-list">
                                {reportHistory.map(r => (
                                    <div key={r._id} className="report-item">
                                        <div className="report-item-header">
                                            <span className="report-user">
                                                {r.reportedUser?.firstName || r.reportedUserId}
                                            </span>
                                            <span className={`report-status ${r.status}`}>
                                                {r.status === 'pending' ? '⏳ Đang xử lý' : 
                                                 r.status === 'resolved' ? '✅ Đã xử lý' : 
                                                 r.status === 'dismissed' ? '❌ Từ chối' : r.status}
                                            </span>
                                        </div>
                                        <div className="report-item-body">
                                            <span className="report-reason">{r.reason}</span>
                                            {r.description && <p className="report-desc">{r.description}</p>}
                                        </div>
                                        <span className="report-date">
                                            {new Date(r.createdAt).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit', year:'numeric'})}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
