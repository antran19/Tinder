import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import './DiscoverPage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
};

const INTEREST_ICONS = {
    'Du lịch': '✈️', 'Âm nhạc': '🎵', 'Thể thao': '⚽', 'Nấu ăn': '🍳',
    'Đọc sách': '📚', 'Phim ảnh': '🎬', 'Gaming': '🎮', 'Yoga': '🧘',
    'Nhiếp ảnh': '📷', 'Thời trang': '👗', 'Công nghệ': '💻', 'Nghệ thuật': '🎨',
    'Cà phê': '☕', 'Thú cưng': '🐾', 'Gym': '💪', 'Nhảy': '💃',
    'Thiên nhiên': '🌿', 'Ẩm thực': '🍜', 'Xe cộ': '🏎️', 'Bơi lội': '🏊',
};

const DiscoverPage = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // all, online, nearby, topPicks
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        ageMin: 18,
        ageMax: 50,
        gender: 'all',
        hasPhoto: false,
        onlineOnly: false,
        interest: '',
        maxDistance: user?.preferences?.maxDistance || 50,
    });
    const [likedUsers, setLikedUsers] = useState(new Set());
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await apiService.getAvailableUsers(user?.userId);
            setUsers(data || []);
            setFilteredUsers(data || []);
        } catch (error) {
            console.error('Lỗi tải danh sách:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateAge = (birthday) => {
        if (!birthday) return null;
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    // Áp dụng bộ lọc
    const applyFilters = useCallback(() => {
        let result = [...users];

        if (filters.gender !== 'all') {
            result = result.filter(u => u.gender === filters.gender);
        }
        if (filters.hasPhoto) {
            result = result.filter(u => u.images && u.images.length > 0);
        }
        if (filters.onlineOnly) {
            result = result.filter(u => u.isOnline);
        }
        if (filters.interest) {
            result = result.filter(u => u.interests && u.interests.includes(filters.interest));
        }
        result = result.filter(u => {
            const age = calculateAge(u.birthday);
            if (!age) return true;
            return age >= filters.ageMin && age <= filters.ageMax;
        });

        // Lọc theo khoảng cách thủ công
        if (filters.maxDistance < 100) {
            result = result.filter(u => 
                u.distance == null || u.distance <= filters.maxDistance
            );
        }

        // Tab filtering
        if (activeTab === 'online') {
            result = result.filter(u => u.isOnline);
        } else if (activeTab === 'nearby') {
            result = result.filter(u => u.distance != null && u.distance <= filters.maxDistance);
            result.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        } else if (activeTab === 'topPicks') {
            const myInterests = user?.interests || [];
            result = result.sort((a, b) => {
                const aCommon = (a.interests || []).filter(i => myInterests.includes(i)).length;
                const bCommon = (b.interests || []).filter(i => myInterests.includes(i)).length;
                return bCommon - aCommon;
            }).slice(0, 10);
        } else if (activeTab === 'aiMatch') {
            // Load from smart-match API
            if (aiSuggestions.length === 0 && !aiLoading) loadAiSuggestions();
        }

        setFilteredUsers(result);
    }, [users, filters, activeTab, user]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const handleLike = async (targetUser) => {
        try {
            await apiService.createSwipe({
                fromUserId: user?.userId,
                toUserId: targetUser.userId,
                type: 'like'
            });
            setLikedUsers(prev => new Set([...prev, targetUser.userId]));
        } catch (error) {
            console.error('Lỗi like:', error);
        }
    };

    const handleSuperLike = async (targetUser) => {
        try {
            await apiService.createSwipe({
                fromUserId: user?.userId,
                toUserId: targetUser.userId,
                type: 'super_like'
            });
            setLikedUsers(prev => new Set([...prev, targetUser.userId]));
        } catch (error) {
            console.error('Lỗi super like:', error);
        }
    };

    const getCommonInterests = (otherUser) => {
        const myInterests = user?.interests || [];
        const theirInterests = otherUser.interests || [];
        return myInterests.filter(i => theirInterests.includes(i));
    };

    const loadAiSuggestions = async () => {
        try {
            setAiLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/smart-match/${user?.userId}?limit=10`);
            const data = await res.json();
            if (data.success) setAiSuggestions(data.data.suggestions);
        } catch (e) {
            console.error('AI match error:', e);
        } finally {
            setAiLoading(false);
        }
    };

    const tabs = [
        { id: 'all', label: 'Tất cả', icon: '🌍' },
        { id: 'nearby', label: 'Gần bạn', icon: '📍' },
        { id: 'online', label: 'Đang online', icon: '🟢' },
        { id: 'topPicks', label: 'Top Picks', icon: '⭐' },
        { id: 'aiMatch', label: 'AI Match', icon: '🧠' },
    ];

    if (loading) {
        return (
            <div className="discover-page">
                <div className="discover-loading">
                    <div className="discover-loading-spinner"></div>
                    <p>Đang tìm kiếm người phù hợp...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="discover-page">
            {/* Header */}
            <div className="discover-header">
                <div className="discover-header-left">
                    <h1>🔥 Khám phá</h1>
                    <p className="discover-subtitle">Tìm kiếm người phù hợp với bạn</p>
                </div>
                <div className="discover-header-right">
                    <button 
                        className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        🎛️ Bộ lọc
                    </button>
                    <div className="result-count">
                        <span className="count-number">{filteredUsers.length}</span>
                        <span className="count-label">người</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="discover-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`discover-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="filters-panel">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>Giới tính</label>
                            <div className="filter-buttons">
                                {[
                                    { value: 'all', label: 'Tất cả' },
                                    { value: 'male', label: 'Nam ♂' },
                                    { value: 'female', label: 'Nữ ♀' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        className={`filter-chip ${filters.gender === opt.value ? 'active' : ''}`}
                                        onClick={() => setFilters(prev => ({ ...prev, gender: opt.value }))}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Độ tuổi: {filters.ageMin} - {filters.ageMax}</label>
                            <div className="filter-range">
                                <input type="range" min="18" max="60" value={filters.ageMin}
                                    onChange={(e) => setFilters(prev => ({ ...prev, ageMin: parseInt(e.target.value) }))} />
                                <input type="range" min="18" max="60" value={filters.ageMax}
                                    onChange={(e) => setFilters(prev => ({ ...prev, ageMax: parseInt(e.target.value) }))} />
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>📍 Khoảng cách: {filters.maxDistance >= 100 ? 'Không giới hạn' : `${filters.maxDistance} km`}</label>
                            <div className="filter-distance">
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="100" 
                                    value={filters.maxDistance}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setFilters(prev => ({ ...prev, maxDistance: val }));
                                    }}
                                    className="distance-slider"
                                />
                                <div className="distance-labels">
                                    <span>1 km</span>
                                    <span>25 km</span>
                                    <span>50 km</span>
                                    <span>100+ km</span>
                                </div>
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Tùy chọn</label>
                            <div className="filter-toggles">
                                <label className="toggle-item">
                                    <input type="checkbox" checked={filters.hasPhoto}
                                        onChange={(e) => setFilters(prev => ({ ...prev, hasPhoto: e.target.checked }))} />
                                    <span className="toggle-slider"></span>
                                    <span>Chỉ có ảnh</span>
                                </label>
                                <label className="toggle-item">
                                    <input type="checkbox" checked={filters.onlineOnly}
                                        onChange={(e) => setFilters(prev => ({ ...prev, onlineOnly: e.target.checked }))} />
                                    <span className="toggle-slider"></span>
                                    <span>Đang online</span>
                                </label>
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Sở thích</label>
                            <select value={filters.interest}
                                onChange={(e) => setFilters(prev => ({ ...prev, interest: e.target.value }))}>
                                <option value="">Tất cả sở thích</option>
                                {Object.keys(INTEREST_ICONS).map(interest => (
                                    <option key={interest} value={interest}>{INTEREST_ICONS[interest]} {interest}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button className="reset-filters" onClick={() => setFilters({
                        ageMin: 18, ageMax: 50, gender: 'all', hasPhoto: false, onlineOnly: false, interest: '', maxDistance: 50
                    })}>
                        🔄 Đặt lại bộ lọc
                    </button>
                </div>
            )}

            {/* AI Match Tab */}
            {activeTab === 'aiMatch' ? (
                <div className="ai-match-section">
                    <div className="ai-header">
                        <h3>🧠 Đề xuất AI</h3>
                        <p>Thuật toán phân tích 7 yếu tố để tìm người phù hợp nhất</p>
                        <button className="ai-refresh-btn" onClick={loadAiSuggestions} disabled={aiLoading}>
                            {aiLoading ? '⏳ Đang phân tích...' : '🔄 Phân tích lại'}
                        </button>
                    </div>
                    {aiLoading ? (
                        <div className="discover-loading"><div className="discover-spinner" /><p>AI đang phân tích...</p></div>
                    ) : aiSuggestions.length === 0 ? (
                        <div className="discover-empty"><div className="empty-icon">🤖</div><h3>Chưa có đề xuất</h3><p>Hãy hoàn thiện hồ sơ để AI phân tích tốt hơn!</p></div>
                    ) : (
                        <div className="discover-grid">
                            {aiSuggestions.map((s) => {
                                const u = s.user;
                                const age = calculateAge(u.birthday);
                                const hasImage = u.images && u.images.length > 0;
                                const isLiked = likedUsers.has(u.userId);
                                const scoreColor = s.matchScore >= 70 ? '#4ade80' : s.matchScore >= 50 ? '#f59e0b' : '#64748b';

                                return (
                                    <div key={u.userId} className={`discover-card ${isLiked ? 'liked' : ''}`} onClick={() => setSelectedUser(u)}>
                                        <div className="discover-card-image">
                                            {hasImage ? (
                                                <img src={getImageUrl(u.images[0])} alt={u.firstName} />
                                            ) : (
                                                <div className="discover-card-avatar">{(u.firstName || '?').charAt(0).toUpperCase()}</div>
                                            )}
                                            {u.isOnline && <div className="discover-online-badge">●</div>}
                                            {u.isBoosted && <div className="discover-boost-badge">⚡</div>}
                                            <div className="ai-score-badge" style={{background: scoreColor}}>
                                                {s.matchScore}%
                                            </div>
                                            <div className="discover-card-gradient"></div>
                                            <div className="discover-card-info">
                                                <h3>{u.firstName || u.userId}{age ? `, ${age}` : ''}</h3>
                                                <span className="ai-compat-label">{s.compatibility}</span>
                                            </div>
                                        </div>
                                        <div className="discover-card-body">
                                            <div className="ai-breakdown">
                                                <span title="Sở thích">🎯 {s.breakdown.interests?.score || 0}</span>
                                                <span title="Khoảng cách">📍 {s.breakdown.distance?.score || 0}</span>
                                                <span title="Tuổi">🎂 {s.breakdown.age?.score || 0}</span>
                                                <span title="Profile">📝 {s.breakdown.profileComplete?.score || 0}</span>
                                            </div>
                                            {!isLiked && (
                                                <div className="discover-card-actions">
                                                    <button className="discover-like-btn" onClick={(e) => { e.stopPropagation(); handleLike(u); }}>💚</button>
                                                    <button className="discover-superlike-btn" onClick={(e) => { e.stopPropagation(); handleSuperLike(u); }}>⭐</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="discover-empty">
                    <div className="empty-icon">🔍</div>
                    <h3>Không tìm thấy ai</h3>
                    <p>Thử thay đổi bộ lọc hoặc quay lại sau nhé!</p>
                    <button className="reset-btn" onClick={() => {
                        setFilters({ageMin: 18, ageMax: 50, gender: 'all', hasPhoto: false, onlineOnly: false, interest: '', maxDistance: 50});
                        setActiveTab('all');
                    }}>Đặt lại</button>
                </div>
            ) : (
                <div className="discover-grid">
                    {filteredUsers.map((u) => {
                        const age = calculateAge(u.birthday);
                        const commonInterests = getCommonInterests(u);
                        const isLiked = likedUsers.has(u.userId);
                        const hasImage = u.images && u.images.length > 0;

                        return (
                            <div 
                                key={u.userId} 
                                className={`discover-card ${isLiked ? 'liked' : ''}`}
                                onClick={() => setSelectedUser(u)}
                            >
                                <div className="discover-card-image">
                                    {hasImage ? (
                                        <img src={getImageUrl(u.images[0])} alt={u.firstName} />
                                    ) : (
                                        <div className="discover-card-avatar">
                                            {(u.firstName || u.userId || '?').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {u.isOnline && <div className="discover-online-badge">●</div>}
                                    {u.isVerified && <div className="discover-verified">✓</div>}
                                    {u.subscription?.tier && u.subscription.tier !== 'free' && (
                                        <div className="discover-premium-badge">
                                            {u.subscription.tier === 'gold' ? '👑' : '⭐'}
                                        </div>
                                    )}
                                    <div className="discover-card-gradient"></div>
                                    <div className="discover-card-info">
                                        <h3>{u.firstName || u.userId}{age ? `, ${age}` : ''}</h3>
                                        {u.distance != null ? (
                                            <p className="discover-location discover-distance">📍 Cách {u.distance < 1 ? 'dưới 1' : u.distance} km</p>
                                        ) : u.profileDetails?.location ? (
                                            <p className="discover-location">📍 {u.profileDetails.location}</p>
                                        ) : null}
                                    </div>
                                </div>

                                {commonInterests.length > 0 && (
                                    <div className="discover-common">
                                        <span className="common-label">💕 {commonInterests.length} sở thích chung</span>
                                    </div>
                                )}

                                <div className="discover-card-actions">
                                    <button className="discover-pass-btn" onClick={(e) => {
                                        e.stopPropagation();
                                    }} title="Bỏ qua">✕</button>
                                    <button className="discover-superlike-btn" onClick={(e) => {
                                        e.stopPropagation();
                                        handleSuperLike(u);
                                    }} title="Super Like" disabled={isLiked}>⭐</button>
                                    <button className="discover-like-btn" onClick={(e) => {
                                        e.stopPropagation();
                                        handleLike(u);
                                    }} title="Thích" disabled={isLiked}>
                                        {isLiked ? '✓' : '♥'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="discover-modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="discover-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedUser(null)}>&times;</button>
                        
                        <div className="modal-gallery">
                            {selectedUser.images && selectedUser.images.length > 0 ? (
                                <img src={getImageUrl(selectedUser.images[0])} alt={selectedUser.firstName} />
                            ) : (
                                <div className="modal-avatar-placeholder">
                                    {(selectedUser.firstName || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                            {selectedUser.isOnline && <div className="modal-online-indicator">🟢 Đang trực tuyến</div>}
                        </div>

                        <div className="modal-info">
                            <div className="modal-name-row">
                                <h2>
                                    {selectedUser.firstName || selectedUser.userId}
                                    {calculateAge(selectedUser.birthday) ? `, ${calculateAge(selectedUser.birthday)}` : ''}
                                </h2>
                                {selectedUser.isVerified && <span className="modal-verified">✓ Đã xác minh</span>}
                            </div>

                            {selectedUser.profileDetails?.occupation && (
                                <p className="modal-occupation">💼 {selectedUser.profileDetails.occupation}</p>
                            )}
                            {selectedUser.profileDetails?.education && (
                                <p className="modal-education">🎓 {selectedUser.profileDetails.education}</p>
                            )}
                            {selectedUser.profileDetails?.location && (
                                <p className="modal-location">📍 {selectedUser.profileDetails.location}</p>
                            )}
                            {selectedUser.profileDetails?.height && (
                                <p className="modal-height">📏 {selectedUser.profileDetails.height}cm</p>
                            )}

                            {selectedUser.bio && (
                                <div className="modal-bio">
                                    <h4>Giới thiệu</h4>
                                    <p>{selectedUser.bio}</p>
                                </div>
                            )}

                            {selectedUser.interests && selectedUser.interests.length > 0 && (
                                <div className="modal-interests">
                                    <h4>Sở thích</h4>
                                    <div className="modal-interest-tags">
                                        {selectedUser.interests.map((interest, idx) => (
                                            <span key={idx} className={`modal-interest-tag ${getCommonInterests(selectedUser).includes(interest) ? 'common' : ''}`}>
                                                {INTEREST_ICONS[interest] || '✨'} {interest}
                                            </span>
                                        ))}
                                    </div>
                                    {getCommonInterests(selectedUser).length > 0 && (
                                        <p className="common-count">💕 {getCommonInterests(selectedUser).length} sở thích chung</p>
                                    )}
                                </div>
                            )}

                            {selectedUser.profileDetails?.lookingFor && (
                                <div className="modal-looking-for">
                                    <h4>Đang tìm kiếm</h4>
                                    <p>{
                                        {
                                            'relationship': '💑 Mối quan hệ nghiêm túc',
                                            'casual': '🤙 Gặp gỡ thoải mái',
                                            'friendship': '🤝 Kết bạn',
                                            'not-sure': '🤔 Chưa chắc chắn'
                                        }[selectedUser.profileDetails.lookingFor] || selectedUser.profileDetails.lookingFor
                                    }</p>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="modal-pass" onClick={() => setSelectedUser(null)}>
                                ✕ Bỏ qua
                            </button>
                            <button className="modal-superlike" onClick={() => {
                                handleSuperLike(selectedUser);
                                setSelectedUser(null);
                            }}>
                                ⭐ Super Like
                            </button>
                            <button className="modal-like" onClick={() => {
                                handleLike(selectedUser);
                                setSelectedUser(null);
                            }}>
                                ♥ Thích
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscoverPage;
