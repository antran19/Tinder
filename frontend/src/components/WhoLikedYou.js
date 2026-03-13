import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import './WhoLikedYou.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
};

const WhoLikedYou = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [likers, setLikers] = useState([]);
    const [totalLikes, setTotalLikes] = useState(0);
    const [pendingLikes, setPendingLikes] = useState(0);
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadLikers();
    }, [user]);

    const loadLikers = async () => {
        try {
            setLoading(true);
            const data = await apiService.getWhoLikedMe(user.userId);
            setLikers(data.likers || []);
            setTotalLikes(data.totalLikes || 0);
            setPendingLikes(data.pendingLikes || 0);
            setIsPremium(data.isPremium || false);
        } catch (error) {
            console.error('Error loading likers:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAvatarLetter = (name) => {
        return (name || '?').charAt(0).toUpperCase();
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes} phút trước`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        return `${days} ngày trước`;
    };

    if (loading) {
        return (
            <div className="who-liked-page">
                <div className="wl-loading">
                    <div className="wl-loading-spinner"></div>
                    <p>Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="who-liked-page">
            {/* Header */}
            <div className="wl-header">
                <h1>👀 Ai đã thích bạn</h1>
                <div className="wl-stats">
                    <div className="wl-stat">
                        <span className="stat-number">{totalLikes}</span>
                        <span className="stat-label">Tổng lượt thích</span>
                    </div>
                    <div className="wl-stat">
                        <span className="stat-number">{pendingLikes}</span>
                        <span className="stat-label">Chưa xem</span>
                    </div>
                </div>
            </div>

            {/* Premium Upsell Banner (nếu Free) */}
            {!isPremium && likers.length > 0 && (
                <div className="wl-upsell-banner">
                    <div className="upsell-content">
                        <span className="upsell-icon">💎</span>
                        <div>
                            <h3>Nâng cấp Premium để xem rõ tất cả</h3>
                            <p>Ảnh đang bị mờ. Mở khóa để biết ai thích bạn!</p>
                        </div>
                    </div>
                    <button className="upsell-btn" onClick={() => navigate('/premium')}>
                        Nâng cấp ngay
                    </button>
                </div>
            )}

            {/* Grid Cards */}
            {likers.length === 0 ? (
                <div className="wl-empty">
                    <div className="empty-icon">💝</div>
                    <h3>Chưa có ai thích bạn</h3>
                    <p>Hãy cập nhật hồ sơ và thêm ảnh để thu hút nhiều người hơn!</p>
                    <button className="wl-cta-btn" onClick={() => navigate('/profile')}>
                        Cập nhật hồ sơ
                    </button>
                </div>
            ) : (
                <div className="wl-grid">
                    {likers.map((liker, idx) => (
                        <div key={idx} className={`wl-card ${liker.isBlurred ? 'blurred' : ''}`}>
                            {/* Ảnh */}
                            <div className="wl-card-image">
                                {liker.images && liker.images.length > 0 ? (
                                    <img
                                        src={getImageUrl(liker.images[0])}
                                        alt={liker.firstName}
                                        className={liker.isBlurred ? 'blur-img' : ''}
                                    />
                                ) : (
                                    <div className={`wl-card-avatar ${liker.isBlurred ? 'blur-avatar' : ''}`}>
                                        {getAvatarLetter(liker.firstName)}
                                    </div>
                                )}

                                {/* Super Like badge */}
                                {liker.isSuperLike && (
                                    <div className="super-like-badge">⭐ Super Like</div>
                                )}

                                {/* Lock overlay for free users */}
                                {liker.isBlurred && (
                                    <div className="wl-lock-overlay">
                                        <span className="lock-icon">🔒</span>
                                        <span className="lock-text">Nâng cấp để xem</span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="wl-card-info">
                                <h4>{liker.firstName}</h4>
                                <span className="wl-time">{timeAgo(liker.likedAt)}</span>

                                {/* Interest tags */}
                                {liker.interests && liker.interests.length > 0 && (
                                    <div className="wl-interests">
                                        {liker.interests.map((interest, i) => (
                                            <span key={i} className="wl-interest-tag">{interest}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WhoLikedYou;
