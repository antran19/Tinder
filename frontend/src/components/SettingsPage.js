import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import VerificationBadge from './VerificationBadge';
import './SettingsPage.css';

const SettingsPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('account');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');

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
        { id: 'notifications', label: 'Thông báo', icon: '🔔' },
        { id: 'privacy', label: 'Riêng tư', icon: '🔒' },
        { id: 'security', label: 'Bảo mật', icon: '🛡️' },
        { id: 'about', label: 'Về ứng dụng', icon: 'ℹ️' },
    ];

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
                                <button className="setting-action-btn">
                                    🔑 Đổi mật khẩu
                                </button>
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
                                <button className="setting-action-btn danger">
                                    🚫 Đăng xuất tất cả thiết bị khác
                                </button>
                            </div>

                            <div className="settings-section">
                                <h3>Chặn & Báo cáo</h3>
                                <button className="setting-action-btn">
                                    🚫 Danh sách đã chặn
                                </button>
                                <button className="setting-action-btn">
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
        </div>
    );
};

export default SettingsPage;
