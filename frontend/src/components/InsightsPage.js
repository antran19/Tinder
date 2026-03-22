import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import './InsightsPage.css';

const InsightsPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('overview');
    const [animateStats, setAnimateStats] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!loading) {
            setTimeout(() => setAnimateStats(true), 100);
        }
    }, [loading]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [swipeStats, userMatches] = await Promise.all([
                apiService.getSwipeStats(user?.userId).catch(() => null),
                apiService.getMatches(user?.userId).catch(() => []),
            ]);
            setStats(swipeStats);
            setMatches(userMatches);
        } catch (error) {
            console.error('Lỗi tải dữ liệu:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalLikes = stats?.totalLikes || stats?.likes || 0;
    const totalPasses = stats?.totalPasses || stats?.passes || 0;
    const totalSuperLikes = stats?.totalSuperLikes || stats?.superLikes || 0;
    const totalSwipes = totalLikes + totalPasses + totalSuperLikes;
    const matchRate = totalLikes > 0 ? ((matches.length / totalLikes) * 100).toFixed(1) : 0;
    const likeRate = totalSwipes > 0 ? ((totalLikes / totalSwipes) * 100).toFixed(1) : 0;

    // Dữ liệu cho biểu đồ hoạt động (giả lập dựa trên data thực)
    const activityData = [
        { day: 'T2', likes: Math.floor(totalLikes * 0.12), matches: Math.floor(matches.length * 0.1) },
        { day: 'T3', likes: Math.floor(totalLikes * 0.18), matches: Math.floor(matches.length * 0.15) },
        { day: 'T4', likes: Math.floor(totalLikes * 0.15), matches: Math.floor(matches.length * 0.18) },
        { day: 'T5', likes: Math.floor(totalLikes * 0.2), matches: Math.floor(matches.length * 0.2) },
        { day: 'T6', likes: Math.floor(totalLikes * 0.22), matches: Math.floor(matches.length * 0.22) },
        { day: 'T7', likes: Math.floor(totalLikes * 0.08), matches: Math.floor(matches.length * 0.1) },
        { day: 'CN', likes: Math.floor(totalLikes * 0.05), matches: Math.floor(matches.length * 0.05) },
    ];

    const maxActivity = Math.max(...activityData.map(d => d.likes), 1);

    // Tính profile completion
    const getProfileCompletion = () => {
        let score = 0;
        let total = 8;
        if (user?.firstName) score++;
        if (user?.bio) score++;
        if (user?.images && user.images.length > 0) score++;
        if (user?.interests && user.interests.length > 0) score++;
        if (user?.profileDetails?.occupation) score++;
        if (user?.profileDetails?.education) score++;
        if (user?.profileDetails?.location) score++;
        if (user?.profileDetails?.zodiac) score++;
        return { score, total, percentage: Math.round((score / total) * 100) };
    };

    const profileCompletion = getProfileCompletion();

    const statCards = [
        { label: 'Tổng Swipes', value: totalSwipes, icon: '👆', color: '#667eea', subtext: 'lượt quẹt' },
        { label: 'Likes', value: totalLikes, icon: '❤️', color: '#fd267a', subtext: 'lượt thích' },
        { label: 'Super Likes', value: totalSuperLikes, icon: '⭐', color: '#3b82f6', subtext: 'lượt siêu thích' },
        { label: 'Matches', value: matches.length, icon: '💕', color: '#ec4899', subtext: 'kết nối' },
        { label: 'Tỷ lệ Match', value: `${matchRate}%`, icon: '🎯', color: '#10b981', subtext: 'match/like' },
        { label: 'Tỷ lệ Like', value: `${likeRate}%`, icon: '📊', color: '#f59e0b', subtext: 'like/swipe' },
    ];

    const sections = [
        { id: 'overview', label: 'Tổng quan', icon: '📊' },
        { id: 'activity', label: 'Hoạt động', icon: '📈' },
        { id: 'profile', label: 'Hồ sơ', icon: '👤' },
        { id: 'tips', label: 'Mẹo hay', icon: '💡' },
    ];

    if (loading) {
        return (
            <div className="insights-page">
                <div className="insights-loading">
                    <div className="insights-spinner"></div>
                    <p>Đang phân tích dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="insights-page">
            {/* Header */}
            <div className="insights-header">
                <div>
                    <h1>📊 Thống kê & Insights</h1>
                    <p className="insights-subtitle">Hiểu rõ hoạt động và tối ưu hồ sơ của bạn</p>
                </div>
                <button className="refresh-insights-btn" onClick={loadData}>
                    🔄 Làm mới
                </button>
            </div>

            {/* Section Tabs */}
            <div className="insights-sections">
                {sections.map(section => (
                    <button
                        key={section.id}
                        className={`insight-section-btn ${activeSection === section.id ? 'active' : ''}`}
                        onClick={() => setActiveSection(section.id)}
                    >
                        <span>{section.icon}</span>
                        <span>{section.label}</span>
                    </button>
                ))}
            </div>

            {/* ===== OVERVIEW ===== */}
            {activeSection === 'overview' && (
                <div className="insights-content">
                    {/* Stats Cards */}
                    <div className="stats-grid">
                        {statCards.map((stat, idx) => (
                            <div 
                                key={idx} 
                                className={`stat-card ${animateStats ? 'animate' : ''}`}
                                style={{ animationDelay: `${idx * 0.08}s`, '--accent-color': stat.color }}
                            >
                                <div className="stat-icon">{stat.icon}</div>
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                                <div className="stat-subtext">{stat.subtext}</div>
                                <div className="stat-bg-glow" style={{ background: stat.color }}></div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Summary */}
                    <div className="summary-cards">
                        <div className="summary-card highlight-card">
                            <div className="highlight-icon">🏆</div>
                            <div className="highlight-info">
                                <h3>Tóm tắt nhanh</h3>
                                <p>
                                    Bạn đã quẹt <strong>{totalSwipes}</strong> lần, thích <strong>{totalLikes}</strong> người 
                                    và có <strong>{matches.length}</strong> kết nối thành công.
                                    {matchRate > 20 ? ' Tỷ lệ match rất tốt! 🎉' : ' Hãy xem mẹo bên dưới để tăng tỷ lệ match nhé!'}
                                </p>
                            </div>
                        </div>

                        <div className="summary-card subscription-card">
                            <div className="subscription-info">
                                <h3>Gói hiện tại</h3>
                                <div className="subscription-tier">
                                    {user?.subscription?.tier === 'gold' ? '👑 Gold' :
                                     user?.subscription?.tier === 'premium' ? '⭐ Premium' : '🆓 Free'}
                                </div>
                                <div className="credits-display">
                                    <span>⭐ {user?.credits?.superLikes || 0} Super Likes</span>
                                    <span>🚀 {user?.credits?.boosts || 0} Boosts</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== ACTIVITY ===== */}
            {activeSection === 'activity' && (
                <div className="insights-content">
                    <div className="activity-section">
                        <h2>📈 Biểu đồ hoạt động tuần</h2>
                        <div className="chart-container">
                            <div className="bar-chart">
                                {activityData.map((data, idx) => (
                                    <div key={idx} className="chart-column">
                                        <div className="chart-bars">
                                            <div 
                                                className="chart-bar likes-bar" 
                                                style={{ height: `${(data.likes / maxActivity) * 100}%` }}
                                                title={`${data.likes} likes`}
                                            ></div>
                                            <div 
                                                className="chart-bar matches-bar" 
                                                style={{ height: `${(data.matches / Math.max(maxActivity, 1)) * 100}%` }}
                                                title={`${data.matches} matches`}
                                            ></div>
                                        </div>
                                        <span className="chart-label">{data.day}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="chart-legend">
                                <span className="legend-item"><span className="legend-dot likes"></span> Likes</span>
                                <span className="legend-item"><span className="legend-dot matches"></span> Matches</span>
                            </div>
                        </div>
                    </div>

                    {/* Swipe Ratio */}
                    <div className="ratio-section">
                        <h2>🎯 Tỷ lệ hành động</h2>
                        <div className="ratio-bars">
                            <div className="ratio-item">
                                <div className="ratio-label">
                                    <span>❤️ Like</span>
                                    <span>{likeRate}%</span>
                                </div>
                                <div className="ratio-track">
                                    <div className="ratio-fill like-fill" style={{ width: `${likeRate}%` }}></div>
                                </div>
                            </div>
                            <div className="ratio-item">
                                <div className="ratio-label">
                                    <span>✕ Pass</span>
                                    <span>{totalSwipes > 0 ? ((totalPasses / totalSwipes) * 100).toFixed(1) : 0}%</span>
                                </div>
                                <div className="ratio-track">
                                    <div className="ratio-fill pass-fill" style={{ width: `${totalSwipes > 0 ? (totalPasses / totalSwipes) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                            <div className="ratio-item">
                                <div className="ratio-label">
                                    <span>⭐ Super Like</span>
                                    <span>{totalSwipes > 0 ? ((totalSuperLikes / totalSwipes) * 100).toFixed(1) : 0}%</span>
                                </div>
                                <div className="ratio-track">
                                    <div className="ratio-fill superlike-fill" style={{ width: `${totalSwipes > 0 ? (totalSuperLikes / totalSwipes) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== PROFILE STRENGTH ===== */}
            {activeSection === 'profile' && (
                <div className="insights-content">
                    <div className="profile-strength">
                        <h2>👤 Độ hoàn thiện hồ sơ</h2>
                        <div className="strength-circle-container">
                            <div className="strength-circle">
                                <svg viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--card-border)" strokeWidth="8" />
                                    <circle 
                                        cx="60" cy="60" r="52" fill="none" 
                                        stroke="url(#strengthGradient)" strokeWidth="8"
                                        strokeDasharray={`${profileCompletion.percentage * 3.27} 327`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 60 60)"
                                        className="strength-progress"
                                    />
                                    <defs>
                                        <linearGradient id="strengthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#fd267a" />
                                            <stop offset="100%" stopColor="#ff6036" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="strength-text">
                                    <span className="strength-percentage">{profileCompletion.percentage}%</span>
                                    <span className="strength-label">Hoàn thiện</span>
                                </div>
                            </div>
                        </div>

                        <div className="profile-checklist">
                            {[
                                { label: 'Tên hiển thị', done: !!user?.firstName, icon: '👤' },
                                { label: 'Bio giới thiệu', done: !!user?.bio, icon: '✏️' },
                                { label: 'Ảnh profile', done: user?.images?.length > 0, icon: '📸' },
                                { label: 'Sở thích', done: user?.interests?.length > 0, icon: '✨' },
                                { label: 'Nghề nghiệp', done: !!user?.profileDetails?.occupation, icon: '💼' },
                                { label: 'Học vấn', done: !!user?.profileDetails?.education, icon: '🎓' },
                                { label: 'Địa điểm', done: !!user?.profileDetails?.location, icon: '📍' },
                                { label: 'Cung hoàng đạo', done: !!user?.profileDetails?.zodiac, icon: '🔮' },
                            ].map((item, idx) => (
                                <div key={idx} className={`checklist-item ${item.done ? 'done' : 'pending'}`}>
                                    <span className="checklist-icon">{item.icon}</span>
                                    <span className="checklist-label">{item.label}</span>
                                    <span className="checklist-status">{item.done ? '✅' : '⬜'}</span>
                                </div>
                            ))}
                        </div>

                        {profileCompletion.percentage < 100 && (
                            <div className="completion-hint">
                                💡 Hồ sơ hoàn thiện 100% nhận được gấp <strong>3x</strong> lượt match!
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== TIPS ===== */}
            {activeSection === 'tips' && (
                <div className="insights-content">
                    <div className="tips-section">
                        <h2>💡 Mẹo tăng tỷ lệ Match</h2>
                        <div className="tips-grid">
                            {[
                                {
                                    icon: '📸',
                                    title: 'Thêm nhiều ảnh',
                                    desc: 'Hồ sơ có 4-6 ảnh được like nhiều hơn 300% so với hồ sơ chỉ có 1 ảnh.',
                                    status: user?.images?.length >= 4 ? 'done' : 'todo',
                                },
                                {
                                    icon: '✍️',
                                    title: 'Viết bio hấp dẫn',
                                    desc: 'Bio ngắn gọn, hài hước giúp tăng 30% tỷ lệ match. Tránh viết quá dài hoặc liệt kê.',
                                    status: user?.bio?.length > 50 ? 'done' : 'todo',
                                },
                                {
                                    icon: '✨',
                                    title: 'Chọn đủ sở thích',
                                    desc: 'Thêm ít nhất 5 sở thích giúp thuật toán gợi ý chính xác hơn.',
                                    status: user?.interests?.length >= 5 ? 'done' : 'todo',
                                },
                                {
                                    icon: '🕐',
                                    title: 'Online giờ vàng',
                                    desc: 'Thời gian 19h-22h có nhiều người dùng nhất. Hãy swipe vào khung giờ này!',
                                    status: 'tip',
                                },
                                {
                                    icon: '⭐',
                                    title: 'Dùng Super Like thông minh',
                                    desc: 'Super Like cho người có nhiều sở thích chung giúp tăng match gấp 3 lần.',
                                    status: 'tip',
                                },
                                {
                                    icon: '🚀',
                                    title: 'Boost vào đúng lúc',
                                    desc: 'Kích hoạt Boost từ 20h-21h Chủ nhật để đạt hiệu quả cao nhất.',
                                    status: 'tip',
                                },
                            ].map((tip, idx) => (
                                <div key={idx} className={`tip-card ${tip.status}`}>
                                    <div className="tip-icon">{tip.icon}</div>
                                    <div className="tip-content">
                                        <h3>{tip.title}</h3>
                                        <p>{tip.desc}</p>
                                    </div>
                                    {tip.status === 'done' && <div className="tip-done-badge">✅ Đã làm</div>}
                                    {tip.status === 'todo' && <div className="tip-todo-badge">📝 Nên làm</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InsightsPage;
