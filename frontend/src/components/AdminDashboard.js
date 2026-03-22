import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const api = (endpoint, options = {}) => {
    return fetch(`${API_BASE_URL}/api/admin${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    }).then(r => r.json());
};
const rawApi = (endpoint, options = {}) => {
    return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    }).then(r => r.json());
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [revenue, setRevenue] = useState(null);
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGender, setFilterGender] = useState('');
    const [filterTier, setFilterTier] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);
    const [reports, setReports] = useState([]);
    const [reportFilter, setReportFilter] = useState('pending');
    const [verificationRequests, setVerificationRequests] = useState([]);

    const adminId = user?.userId;

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadStats = useCallback(async () => {
        try {
            const data = await api(`/stats?adminId=${adminId}`);
            if (data.success) setStats(data.data);
        } catch (e) { console.error('Stats error:', e); }
    }, [adminId]);

    const loadRevenue = useCallback(async () => {
        try {
            const data = await api(`/revenue?adminId=${adminId}`);
            if (data.success) setRevenue(data.data);
        } catch (e) { console.error('Revenue error:', e); }
    }, [adminId]);

    const loadUsers = useCallback(async (page = 1) => {
        try {
            const params = new URLSearchParams({
                adminId, page, limit: 15,
                ...(searchTerm && { search: searchTerm }),
                ...(filterGender && { gender: filterGender }),
                ...(filterTier && { tier: filterTier }),
            });
            const data = await api(`/users?${params}`);
            if (data.success) {
                setUsers(data.data.users);
                setPagination(data.data.pagination);
            }
        } catch (e) { console.error('Users error:', e); }
    }, [adminId, searchTerm, filterGender, filterTier]);

    const loadReports = useCallback(async () => {
        try {
            const data = await rawApi(`/api/reports/admin/list?status=${reportFilter}`);
            if (data.success) setReports(data.data.reports);
        } catch (e) { console.error('Reports error:', e); }
    }, [reportFilter]);

    const loadVerificationRequests = useCallback(async () => {
        try {
            const data = await rawApi('/api/verification/admin/pending');
            if (data.success) setVerificationRequests(data.data.requests);
        } catch (e) { console.error('Verification error:', e); }
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') {
            const init = async () => {
                setLoading(true);
                await Promise.all([loadStats(), loadRevenue(), loadUsers(), loadReports(), loadVerificationRequests()]);
                setLoading(false);
            };
            init();
        }
    }, [user, loadStats, loadRevenue, loadUsers, loadReports, loadVerificationRequests]);

    useEffect(() => {
        if (user?.role === 'admin') loadReports();
    }, [reportFilter, loadReports, user]);

    useEffect(() => {
        loadUsers(currentPage);
    }, [currentPage, loadUsers]);

    // Admin actions
    const handleVerify = async (userId, isVerified) => {
        setActionLoading(userId);
        const data = await api(`/users/${userId}/verify`, {
            method: 'PUT',
            headers: { 'x-admin-id': adminId },
            body: JSON.stringify({ isVerified })
        });
        if (data.success) {
            showToast(`${isVerified ? 'Đã xác minh' : 'Hủy xác minh'} ${userId}`);
            loadUsers(currentPage);
        }
        setActionLoading(null);
    };

    const handleChangeTier = async (userId, tier) => {
        setActionLoading(userId);
        const data = await api(`/users/${userId}/subscription`, {
            method: 'PUT',
            headers: { 'x-admin-id': adminId },
            body: JSON.stringify({ tier, days: 30 })
        });
        if (data.success) {
            showToast(`Đã cập nhật ${userId} → ${tier.toUpperCase()}`);
            loadUsers(currentPage);
            loadStats();
            loadRevenue();
        }
        setActionLoading(null);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm(`Bạn chắc chắn muốn XÓA user ${userId}? Hành động này không thể hoàn tác!`)) return;
        setActionLoading(userId);
        const data = await api(`/users/${userId}?adminId=${adminId}`, {
            method: 'DELETE',
            headers: { 'x-admin-id': adminId },
        });
        if (data.success) {
            showToast(`Đã xóa user ${userId}`, 'warning');
            loadUsers(currentPage);
            loadStats();
        }
        setActionLoading(null);
    };

    const handleReportAction = async (reportId, status) => {
        const data = await rawApi(`/api/reports/admin/${reportId}`, {
            method: 'PUT',
            body: JSON.stringify({ status, adminNote: '', reviewedBy: adminId })
        });
        if (data.success) {
            showToast(`Report ${status === 'resolved' ? 'đã xử lý' : 'đã bỏ qua'}`);
            loadReports();
        }
    };

    const handleVerificationReview = async (userId, action) => {
        const data = await rawApi(`/api/verification/admin/review/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ action, reviewedBy: adminId })
        });
        if (data.success) {
            showToast(`${action === 'approve' ? 'Đã duyệt xác minh' : 'Đã từ chối'} ${userId}`);
            loadVerificationRequests();
            loadUsers(currentPage);
        }
    };

    const formatNumber = (n) => {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n?.toLocaleString('vi-VN') || '0';
    };

    const formatMoney = (n) => {
        return (n || 0).toLocaleString('vi-VN') + 'đ';
    };

    if (user?.role !== 'admin') {
        return (
            <div className="admin-dashboard">
                <div className="admin-no-access">
                    <div className="no-access-icon">🔒</div>
                    <h2>Không có quyền truy cập</h2>
                    <p>Bạn cần tài khoản Admin để xem trang này</p>
                    <button onClick={() => navigate('/swipe')} className="admin-back-btn">← Quay lại</button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="admin-loading">
                    <div className="admin-loading-spinner"></div>
                    <p>Đang tải bảng điều khiển...</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Tổng quan', icon: '📊' },
        { id: 'users', label: 'Quản lý Users', icon: '👥' },
        { id: 'reports', label: `Báo cáo ${reports.length > 0 ? `(${reports.length})` : ''}`, icon: '🚩' },
        { id: 'verification', label: `Xác minh ${verificationRequests.length > 0 ? `(${verificationRequests.length})` : ''}`, icon: '✅' },
        { id: 'revenue', label: 'Doanh thu', icon: '💰' },
    ];

    return (
        <div className="admin-dashboard">
            {/* Toast */}
            {toast && (
                <div className={`admin-toast ${toast.type}`}>
                    {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="admin-header">
                <div className="admin-header-left">
                    <h1>🛠️ Admin Dashboard</h1>
                    <p className="admin-subtitle">Quản trị hệ thống Dating App</p>
                </div>
                <div className="admin-header-right">
                    <span className="admin-badge">👑 {user.firstName}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="admin-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ===== OVERVIEW TAB ===== */}
            {activeTab === 'overview' && stats && (
                <div className="admin-content">
                    {/* KPI Cards */}
                    <div className="kpi-grid">
                        <div className="kpi-card users">
                            <div className="kpi-icon">👥</div>
                            <div className="kpi-info">
                                <span className="kpi-value">{formatNumber(stats.overview.totalUsers)}</span>
                                <span className="kpi-label">Tổng Users</span>
                                <span className="kpi-change positive">+{stats.overview.newUsersToday} hôm nay</span>
                            </div>
                        </div>
                        <div className="kpi-card online">
                            <div className="kpi-icon">🟢</div>
                            <div className="kpi-info">
                                <span className="kpi-value">{stats.overview.onlineUsers}</span>
                                <span className="kpi-label">Đang Online</span>
                                <span className="kpi-change">{((stats.overview.onlineUsers / Math.max(stats.overview.totalUsers, 1)) * 100).toFixed(0)}% users</span>
                            </div>
                        </div>
                        <div className="kpi-card premium">
                            <div className="kpi-icon">⭐</div>
                            <div className="kpi-info">
                                <span className="kpi-value">{stats.overview.premiumUsers}</span>
                                <span className="kpi-label">Premium Users</span>
                                <span className="kpi-change">{stats.overview.conversionRate}% chuyển đổi</span>
                            </div>
                        </div>
                        <div className="kpi-card matches">
                            <div className="kpi-icon">💕</div>
                            <div className="kpi-info">
                                <span className="kpi-value">{formatNumber(stats.engagement.totalMatches)}</span>
                                <span className="kpi-label">Tổng Matches</span>
                                <span className="kpi-change positive">+{stats.engagement.matchesToday} hôm nay</span>
                            </div>
                        </div>
                    </div>

                    {/* Engagement Stats */}
                    <div className="stats-grid">
                        <div className="stats-card">
                            <h3>📈 Hoạt động hôm nay</h3>
                            <div className="stats-rows">
                                <div className="stat-row">
                                    <span>Swipes</span>
                                    <span className="stat-value">{formatNumber(stats.engagement.swipesToday)}</span>
                                </div>
                                <div className="stat-row">
                                    <span>Likes</span>
                                    <span className="stat-value green">{formatNumber(stats.engagement.likesToday)}</span>
                                </div>
                                <div className="stat-row">
                                    <span>Passes</span>
                                    <span className="stat-value red">{formatNumber(stats.engagement.passesToday)}</span>
                                </div>
                                <div className="stat-row">
                                    <span>Tỉ lệ Like</span>
                                    <span className="stat-value blue">{stats.engagement.likeRate}%</span>
                                </div>
                                <div className="stat-row">
                                    <span>Tin nhắn</span>
                                    <span className="stat-value">{formatNumber(stats.engagement.messagesToday)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="stats-card">
                            <h3>👤 Phân bổ giới tính</h3>
                            <div className="gender-chart">
                                <div className="gender-bar">
                                    <div
                                        className="gender-fill male"
                                        style={{ width: `${(stats.gender.male / Math.max(stats.overview.totalUsers, 1)) * 100}%` }}
                                    ></div>
                                    <div
                                        className="gender-fill female"
                                        style={{ width: `${(stats.gender.female / Math.max(stats.overview.totalUsers, 1)) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="gender-labels">
                                    <span>♂ Nam: {stats.gender.male} ({((stats.gender.male / Math.max(stats.overview.totalUsers, 1)) * 100).toFixed(0)}%)</span>
                                    <span>♀ Nữ: {stats.gender.female} ({((stats.gender.female / Math.max(stats.overview.totalUsers, 1)) * 100).toFixed(0)}%)</span>
                                </div>
                            </div>
                        </div>

                        <div className="stats-card">
                            <h3>📊 Tổng quan</h3>
                            <div className="stats-rows">
                                <div className="stat-row">
                                    <span>Users mới tháng này</span>
                                    <span className="stat-value">{stats.overview.newUsersThisMonth}</span>
                                </div>
                                <div className="stat-row">
                                    <span>Tăng trưởng</span>
                                    <span className={`stat-value ${stats.overview.userGrowthRate >= 0 ? 'green' : 'red'}`}>
                                        {stats.overview.userGrowthRate >= 0 ? '+' : ''}{stats.overview.userGrowthRate}%
                                    </span>
                                </div>
                                <div className="stat-row">
                                    <span>Tổng tin nhắn</span>
                                    <span className="stat-value">{formatNumber(stats.engagement.totalMessages)}</span>
                                </div>
                                <div className="stat-row">
                                    <span>Tổng swipes</span>
                                    <span className="stat-value">{formatNumber(stats.engagement.totalSwipes)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== USERS TAB ===== */}
            {activeTab === 'users' && (
                <div className="admin-content">
                    {/* Search & Filters */}
                    <div className="admin-filters">
                        <div className="admin-search">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm user..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <select value={filterGender} onChange={(e) => { setFilterGender(e.target.value); setCurrentPage(1); }}>
                            <option value="">Tất cả giới tính</option>
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                        </select>
                        <select value={filterTier} onChange={(e) => { setFilterTier(e.target.value); setCurrentPage(1); }}>
                            <option value="">Tất cả gói</option>
                            <option value="premium">Premium</option>
                            <option value="free">Free</option>
                        </select>
                        <button className="admin-refresh-btn" onClick={() => loadUsers(currentPage)}>🔄</button>
                    </div>

                    {/* Users Table */}
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Giới tính</th>
                                    <th>Gói</th>
                                    <th>Trạng thái</th>
                                    <th>Xác minh</th>
                                    <th>Ngày tạo</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.userId} className={actionLoading === u.userId ? 'loading-row' : ''}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-cell-avatar">
                                                    {u.images?.[0]
                                                        ? <img src={u.images[0].startsWith('http') ? u.images[0] : `${API_BASE_URL}${u.images[0]}`} alt="" />
                                                        : <span>{(u.firstName || u.userId || '?').charAt(0).toUpperCase()}</span>
                                                    }
                                                </div>
                                                <div className="user-cell-info">
                                                    <strong>{u.firstName || u.userId}</strong>
                                                    <small>@{u.userId}</small>
                                                </div>
                                                {u.role === 'admin' && <span className="admin-role-badge">ADMIN</span>}
                                            </div>
                                        </td>
                                        <td>{u.gender === 'male' ? '♂ Nam' : u.gender === 'female' ? '♀ Nữ' : '-'}</td>
                                        <td>
                                            <span className={`tier-badge ${u.subscription?.tier || 'free'}`}>
                                                {u.subscription?.tier === 'gold' ? '👑 Gold' :
                                                    u.subscription?.tier === 'premium' ? '⭐ Premium' : '🆓 Free'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-dot ${u.isOnline ? 'online' : 'offline'}`}>
                                                {u.isOnline ? '🟢 Online' : '⚫ Offline'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`verify-badge ${u.isVerified ? 'verified' : ''}`}>
                                                {u.isVerified ? '✅' : '⬜'}
                                            </span>
                                        </td>
                                        <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn verify"
                                                    onClick={() => handleVerify(u.userId, !u.isVerified)}
                                                    title={u.isVerified ? 'Hủy xác minh' : 'Xác minh'}
                                                >
                                                    {u.isVerified ? '✖️' : '✔️'}
                                                </button>
                                                <select
                                                    className="action-select"
                                                    value={u.subscription?.tier || 'free'}
                                                    onChange={(e) => handleChangeTier(u.userId, e.target.value)}
                                                >
                                                    <option value="free">Free</option>
                                                    <option value="premium">Premium</option>
                                                    <option value="gold">Gold</option>
                                                </select>
                                                {u.role !== 'admin' && (
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDeleteUser(u.userId)}
                                                        title="Xóa user"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="admin-pagination">
                            <button
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >← Trước</button>
                            <span>Trang {currentPage} / {pagination.totalPages} ({pagination.total} users)</span>
                            <button
                                disabled={currentPage >= pagination.totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >Sau →</button>
                        </div>
                    )}
                </div>
            )}

            {/* ===== REVENUE TAB ===== */}
            {activeTab === 'revenue' && revenue && (
                <div className="admin-content">
                    <div className="revenue-grid">
                        <div className="revenue-card total">
                            <div className="revenue-icon">💰</div>
                            <div className="revenue-amount">{formatMoney(revenue.revenue.total)}</div>
                            <div className="revenue-label">Doanh thu ước tính / tháng</div>
                        </div>
                        <div className="revenue-card premium-r">
                            <div className="revenue-icon">⭐</div>
                            <div className="revenue-amount">{formatMoney(revenue.revenue.premium)}</div>
                            <div className="revenue-label">{revenue.activePremium} Premium × 149K</div>
                        </div>
                        <div className="revenue-card gold-r">
                            <div className="revenue-icon">👑</div>
                            <div className="revenue-amount">{formatMoney(revenue.revenue.gold)}</div>
                            <div className="revenue-label">{revenue.activeGold} Gold × 299K</div>
                        </div>
                        <div className="revenue-card subs">
                            <div className="revenue-icon">📈</div>
                            <div className="revenue-amount">{revenue.newSubsThisMonth}</div>
                            <div className="revenue-label">Đăng ký mới tháng này</div>
                        </div>
                    </div>

                    <div className="stats-card" style={{ marginTop: '1.5rem' }}>
                        <h3>📋 Chi tiết subscription</h3>
                        <div className="stats-rows">
                            <div className="stat-row">
                                <span>Active Premium</span>
                                <span className="stat-value">{revenue.activePremium}</span>
                            </div>
                            <div className="stat-row">
                                <span>Active Gold</span>
                                <span className="stat-value gold">{revenue.activeGold}</span>
                            </div>
                            <div className="stat-row">
                                <span>Tổng Active Subscriptions</span>
                                <span className="stat-value blue">{revenue.totalActiveSubscriptions}</span>
                            </div>
                            <div className="stat-row highlight">
                                <span>Doanh thu tháng (est.)</span>
                                <span className="stat-value green">{formatMoney(revenue.estimatedMonthlyRevenue)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== REPORTS TAB ===== */}
            {activeTab === 'reports' && (
                <div className="admin-content">
                    <div className="admin-filters">
                        <select value={reportFilter} onChange={e => setReportFilter(e.target.value)}>
                            <option value="pending">⏳ Chờ xử lý</option>
                            <option value="resolved">✅ Đã xử lý</option>
                            <option value="dismissed">❌ Đã bỏ qua</option>
                            <option value="all">📝 Tất cả</option>
                        </select>
                        <button className="admin-refresh-btn" onClick={loadReports}>🔄</button>
                    </div>

                    {reports.length === 0 ? (
                        <div className="admin-empty">
                            <div className="empty-icon">✅</div>
                            <p>Không có báo cáo nào</p>
                        </div>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Người báo cáo</th>
                                        <th>Bị báo cáo</th>
                                        <th>Lý do</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map(r => (
                                        <tr key={r._id}>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="user-cell-info">
                                                        <strong>{r.reporter?.firstName || r.reporterId}</strong>
                                                        <small>@{r.reporterId}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="user-cell-info">
                                                        <strong>{r.reportedUser?.firstName || r.reportedUserId}</strong>
                                                        <small>@{r.reportedUserId}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="report-reason-badge">
                                                    {{
                                                        fake_profile: '🎭 Giả mạo',
                                                        harassment: '😤 Quấy rối',
                                                        spam: '📢 Spam',
                                                        inappropriate_content: '🔞 Vi phạm',
                                                        underage: '👶 Chưa tuổi',
                                                        scam: '💰 Lừa đảo',
                                                        other: '📝 Khác'
                                                    }[r.reason] || r.reason}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${r.status}`}>
                                                    {r.status === 'pending' ? '⏳ Chờ' : r.status === 'resolved' ? '✅ Xử lý' : '❌ Bỏ qua'}
                                                </span>
                                            </td>
                                            <td>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                                            <td>
                                                {r.status === 'pending' && (
                                                    <div className="action-buttons">
                                                        <button className="action-btn verify" onClick={() => handleReportAction(r._id, 'resolved')} title="Xử lý (Ban user)">
                                                            🚫 Ban
                                                        </button>
                                                        <button className="action-btn" onClick={() => handleReportAction(r._id, 'dismissed')} title="Bỏ qua">
                                                            ❌
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ===== VERIFICATION TAB ===== */}
            {activeTab === 'verification' && (
                <div className="admin-content">
                    {verificationRequests.length === 0 ? (
                        <div className="admin-empty">
                            <div className="empty-icon">✅</div>
                            <p>Không có yêu cầu xác minh nào đang chờ</p>
                        </div>
                    ) : (
                        <div className="verification-grid">
                            {verificationRequests.map(vr => (
                                <div key={vr.userId} className="verification-request-card">
                                    <div className="vr-header">
                                        <div className="vr-user">
                                            <div className="user-cell-avatar">
                                                {vr.images?.[0]
                                                    ? <img src={vr.images[0].startsWith('http') ? vr.images[0] : `${API_BASE_URL}${vr.images[0]}`} alt="" />
                                                    : <span>{(vr.firstName || '?').charAt(0).toUpperCase()}</span>
                                                }
                                            </div>
                                            <div>
                                                <strong>{vr.firstName}</strong>
                                                <small>@{vr.userId}</small>
                                            </div>
                                        </div>
                                        <small>{new Date(vr.verification?.submittedAt).toLocaleDateString('vi-VN')}</small>
                                    </div>
                                    <div className="vr-images">
                                        <div className="vr-img-group">
                                            <div className="vr-img-label">Ảnh Profile</div>
                                            <img src={vr.images?.[0]?.startsWith('http') ? vr.images[0] : `${API_BASE_URL}${vr.images?.[0] || ''}`} alt="profile" className="vr-img" />
                                        </div>
                                        <div className="vr-img-group">
                                            <div className="vr-img-label">📸 Selfie</div>
                                            <img src={vr.verification?.selfieUrl?.startsWith('http') ? vr.verification.selfieUrl : `${API_BASE_URL}${vr.verification?.selfieUrl || ''}`} alt="selfie" className="vr-img" />
                                        </div>
                                    </div>
                                    <div className="vr-actions">
                                        <button className="vr-reject" onClick={() => handleVerificationReview(vr.userId, 'reject')}>
                                            ❌ Từ chối
                                        </button>
                                        <button className="vr-approve" onClick={() => handleVerificationReview(vr.userId, 'approve')}>
                                            ✅ Duyệt
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
