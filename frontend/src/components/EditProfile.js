import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import './EditProfile.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper: Nếu URL đã là full (http), dùng luôn. Nếu relative, nối với API_BASE_URL
const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
};

// Danh sách sở thích có sẵn
const AVAILABLE_INTERESTS = [
    'Du lịch', 'Âm nhạc', 'Thể thao', 'Nấu ăn', 'Đọc sách', 'Phim ảnh',
    'Gaming', 'Yoga', 'Nhiếp ảnh', 'Thời trang', 'Công nghệ', 'Nghệ thuật',
    'Cà phê', 'Thú cưng', 'Gym', 'Nhảy', 'Thiên nhiên', 'Ẩm thực',
    'Xe cộ', 'Bơi lội', 'Trượt ván', 'Bóng đá', 'Bóng rổ', 'Tennis',
    'Viết lách', 'Vẽ tranh', 'Piano', 'Guitar', 'Karaoke', 'Board game'
];

const INTEREST_ICONS = {
    'Du lịch': '✈️', 'Âm nhạc': '🎵', 'Thể thao': '⚽', 'Nấu ăn': '🍳',
    'Đọc sách': '📚', 'Phim ảnh': '🎬', 'Gaming': '🎮', 'Yoga': '🧘',
    'Nhiếp ảnh': '📷', 'Thời trang': '👗', 'Công nghệ': '💻', 'Nghệ thuật': '🎨',
    'Cà phê': '☕', 'Thú cưng': '🐾', 'Gym': '💪', 'Nhảy': '💃',
    'Thiên nhiên': '🌿', 'Ẩm thực': '🍜', 'Xe cộ': '🏎️', 'Bơi lội': '🏊',
    'Trượt ván': '🛹', 'Bóng đá': '⚽', 'Bóng rổ': '🏀', 'Tennis': '🎾',
    'Viết lách': '✍️', 'Vẽ tranh': '🖼️', 'Piano': '🎹', 'Guitar': '🎸',
    'Karaoke': '🎤', 'Board game': '🎲'
};

const ZODIAC_OPTIONS = [
    { value: '', label: '-- Chọn --' },
    { value: 'aries', label: '♈ Bạch Dương (21/3 - 19/4)' },
    { value: 'taurus', label: '♉ Kim Ngưu (20/4 - 20/5)' },
    { value: 'gemini', label: '♊ Song Tử (21/5 - 20/6)' },
    { value: 'cancer', label: '♋ Cự Giải (21/6 - 22/7)' },
    { value: 'leo', label: '♌ Sư Tử (23/7 - 22/8)' },
    { value: 'virgo', label: '♍ Xử Nữ (23/8 - 22/9)' },
    { value: 'libra', label: '♎ Thiên Bình (23/9 - 22/10)' },
    { value: 'scorpio', label: '♏ Bọ Cạp (23/10 - 21/11)' },
    { value: 'sagittarius', label: '♐ Nhân Mã (22/11 - 21/12)' },
    { value: 'capricorn', label: '♑ Ma Kết (22/12 - 19/1)' },
    { value: 'aquarius', label: '♒ Bảo Bình (20/1 - 18/2)' },
    { value: 'pisces', label: '♓ Song Ngư (19/2 - 20/3)' },
];

const LOOKING_FOR_OPTIONS = [
    { value: '', label: '-- Chọn --' },
    { value: 'relationship', label: '💑 Mối quan hệ nghiêm túc' },
    { value: 'casual', label: '🤙 Gặp gỡ thoải mái' },
    { value: 'friendship', label: '🤝 Kết bạn' },
    { value: 'not-sure', label: '🤔 Chưa chắc chắn' },
];

/**
 * EditProfile Component - Phiên bản nâng cao
 * Hỗ trợ: upload ảnh, sở thích, chiều cao, nghề nghiệp, zodiac, v.v.
 */
const EditProfile = () => {
    const { user, updateUserData } = useAuth();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        firstName: '',
        bio: '',
        birthday: '',
        gender: 'male',
        genderPreference: 'female',
        minAge: 18,
        maxAge: 50,
    });

    const [profileDetails, setProfileDetails] = useState({
        height: '',
        occupation: '',
        education: '',
        location: '',
        zodiac: '',
        lookingFor: '',
    });

    const [selectedInterests, setSelectedInterests] = useState([]);
    const [profileImages, setProfileImages] = useState([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    // Load dữ liệu hiện tại của user
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                bio: user.bio || '',
                birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
                gender: user.gender || 'male',
                genderPreference: user.preferences?.genderPreference || (user.gender === 'male' ? 'female' : 'male'),
                minAge: user.preferences?.ageRange?.min || 18,
                maxAge: user.preferences?.ageRange?.max || 50,
            });
            setProfileDetails({
                height: user.profileDetails?.height || '',
                occupation: user.profileDetails?.occupation || '',
                education: user.profileDetails?.education || '',
                location: user.profileDetails?.location || '',
                zodiac: user.profileDetails?.zodiac || '',
                lookingFor: user.profileDetails?.lookingFor || '',
            });
            setSelectedInterests(user.interests || []);
            setProfileImages(user.images || []);
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDetailChange = (e) => {
        const { name, value } = e.target;
        setProfileDetails(prev => ({ ...prev, [name]: value }));
    };

    // Toggle sở thích
    const toggleInterest = (interest) => {
        setSelectedInterests(prev => {
            if (prev.includes(interest)) {
                return prev.filter(i => i !== interest);
            }
            if (prev.length >= 10) {
                setStatus({ type: 'error', message: 'Tối đa 10 sở thích!' });
                return prev;
            }
            return [...prev, interest];
        });
    };

    // Upload ảnh profile
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setStatus({ type: 'error', message: 'Chỉ chấp nhận file ảnh!' });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setStatus({ type: 'error', message: 'Ảnh quá lớn! Tối đa 10MB.' });
            return;
        }
        if (profileImages.length >= 6) {
            setStatus({ type: 'error', message: 'Tối đa 6 ảnh profile!' });
            return;
        }

        try {
            setUploadingImage(true);
            const result = await apiService.uploadProfileImage(file, user.userId);
            setProfileImages(prev => [...prev, result.imageUrl]);
            setStatus({ type: 'success', message: 'Upload ảnh thành công! 📸' });
        } catch (error) {
            setStatus({ type: 'error', message: 'Lỗi upload: ' + error.message });
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Xóa ảnh profile
    const handleRemoveImage = async (imageUrl) => {
        try {
            await apiService.deleteProfileImage(user.userId, imageUrl);
            setProfileImages(prev => prev.filter(img => img !== imageUrl));
            setStatus({ type: 'success', message: 'Đã xóa ảnh.' });
        } catch (error) {
            setStatus({ type: 'error', message: 'Lỗi xóa ảnh.' });
        }
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setStatus({ type: '', message: '' });

        const updateBody = {
            firstName: formData.firstName,
            bio: formData.bio,
            birthday: formData.birthday,
            gender: formData.gender,
            preferences: {
                genderPreference: formData.genderPreference,
                ageRange: {
                    min: parseInt(formData.minAge),
                    max: parseInt(formData.maxAge)
                }
            },
            interests: selectedInterests,
            profileDetails: {
                height: profileDetails.height ? parseInt(profileDetails.height) : null,
                occupation: profileDetails.occupation,
                education: profileDetails.education,
                location: profileDetails.location,
                zodiac: profileDetails.zodiac,
                lookingFor: profileDetails.lookingFor,
            },
            images: profileImages,
        };

        try {
            const response = await apiService.updateProfile(user.userId, updateBody);
            if (response.success) {
                updateUserData(response.data.user);
                setStatus({ type: 'success', message: 'Hồ sơ đã được cập nhật thành công! ✨' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.message || 'Có lỗi xảy ra.' });
        } finally {
            setLoading(false);
        }
    };

    const displayName = formData.firstName || user?.userId || 'Bạn';
    const userAge = formData.birthday ? Math.floor((new Date() - new Date(formData.birthday)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    const isPremium = user?.subscription?.tier === 'gold' || user?.subscription?.tier === 'premium';

    return (
        <div className="edit-profile-container">
            {/* Profile Preview Card */}
            <div className="profile-preview-card">
                <div className="preview-photo">
                    {profileImages.length > 0 ? (
                        <img src={getImageUrl(profileImages[0])} alt="Profile" />
                    ) : (
                        <div className="preview-avatar">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="preview-gradient" />
                    <div className="preview-info">
                        <h3>{displayName}{userAge ? `, ${userAge}` : ''}</h3>
                        {profileDetails.occupation && <p>💼 {profileDetails.occupation}</p>}
                    </div>
                </div>
                <div className="preview-stats">
                    <div className="stat-item">
                        <span className="stat-number">{profileImages.length}</span>
                        <span className="stat-label">Ảnh</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{selectedInterests.length}</span>
                        <span className="stat-label">Sở thích</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{formData.bio ? Math.round(formData.bio.length / 50 * 100) + '%' : '0%'}</span>
                        <span className="stat-label">Hoàn thành</span>
                    </div>
                </div>
            </div>

            {/* Gold Upsell Banner */}
            {!isPremium && (
                <Link to="/premium" className="gold-upsell-banner">
                    <div className="upsell-icon">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="#ffd700">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 3.9l5 2.22V11c0 3.87-2.68 7.49-5 8.36-2.32-.87-5-4.49-5-8.36V7.12l5-2.22z"/>
                        </svg>
                    </div>
                    <div className="upsell-text">
                        <h4>Nâng cấp Tinder Gold™</h4>
                        <p>Xem ai đã Like bạn, Super Likes không giới hạn và nhiều hơn nữa</p>
                    </div>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="rgba(255,255,255,0.7)">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                </Link>
            )}

            <div className="edit-profile-card">
                <h2>✏️ Chỉnh sửa hồ sơ</h2>
                <p className="subtitle">Cập nhật thông tin để thu hút người xem hơn!</p>

                {status.message && (
                    <div className={`status-message ${status.type}`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* ===== SECTION 1: ẢNH PROFILE ===== */}
                    <section className="profile-section">
                        <h3>📸 Ảnh của bạn <span className="section-badge">{profileImages.length}/6</span></h3>
                        <p className="section-hint">Thêm ảnh để hồ sơ hấp dẫn hơn. Tối đa 6 ảnh.</p>

                        <div className="photo-grid">
                            {profileImages.map((img, idx) => (
                                <div key={idx} className="photo-item">
                                    <img src={getImageUrl(img)} alt={`Profile ${idx + 1}`} />
                                    <button
                                        type="button"
                                        className="remove-photo-btn"
                                        onClick={() => handleRemoveImage(img)}
                                    >
                                        ✕
                                    </button>
                                    {idx === 0 && <span className="primary-badge">Chính</span>}
                                </div>
                            ))}
                            {profileImages.length < 6 && (
                                <div
                                    className="photo-item add-photo"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {uploadingImage ? (
                                        <div className="upload-spinner">⏳</div>
                                    ) : (
                                        <>
                                            <span className="add-icon">+</span>
                                            <span className="add-text">Thêm ảnh</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                    </section>

                    <div className="section-divider"></div>

                    {/* ===== SECTION 2: THÔNG TIN CƠ BẢN ===== */}
                    <section className="profile-section">
                        <h3>👤 Thông tin cơ bản</h3>

                        <div className="form-group">
                            <label>Tên hiển thị</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Nhập tên của bạn"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Ngày sinh</label>
                                <input
                                    type="date"
                                    name="birthday"
                                    value={formData.birthday}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Giới tính</label>
                                <select name="gender" value={formData.gender} onChange={handleChange}>
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Tiểu sử (Bio)</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Viết vài dòng giới thiệu về bản thân..."
                                rows="3"
                            ></textarea>
                            <small className="char-count">{formData.bio.length}/500</small>
                        </div>
                    </section>

                    <div className="section-divider"></div>

                    {/* ===== SECTION 3: SỞ THÍCH ===== */}
                    <section className="profile-section">
                        <h3>✨ Sở thích <span className="section-badge">{selectedInterests.length}/10</span></h3>
                        <p className="section-hint">Chọn tối đa 10 sở thích để người khác hiểu bạn hơn.</p>

                        <div className="interests-grid">
                            {AVAILABLE_INTERESTS.map((interest) => (
                                <button
                                    key={interest}
                                    type="button"
                                    className={`interest-chip ${selectedInterests.includes(interest) ? 'selected' : ''}`}
                                    onClick={() => toggleInterest(interest)}
                                >
                                    {INTEREST_ICONS[interest] || '✨'} {interest}
                                </button>
                            ))}
                        </div>
                    </section>

                    <div className="section-divider"></div>

                    {/* ===== SECTION 4: THÔNG TIN CHI TIẾT ===== */}
                    <section className="profile-section">
                        <h3>💎 Thông tin chi tiết</h3>
                        <p className="section-hint">Thêm thông tin để tăng cơ hội được match!</p>

                        <div className="form-row">
                            <div className="form-group">
                                <label>📏 Chiều cao (cm)</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={profileDetails.height}
                                    onChange={handleDetailChange}
                                    placeholder="VD: 170"
                                    min="100"
                                    max="250"
                                />
                            </div>
                            <div className="form-group">
                                <label>📍 Địa điểm</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={profileDetails.location}
                                    onChange={handleDetailChange}
                                    placeholder="VD: TP.HCM"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>💼 Nghề nghiệp</label>
                                <input
                                    type="text"
                                    name="occupation"
                                    value={profileDetails.occupation}
                                    onChange={handleDetailChange}
                                    placeholder="VD: Kỹ sư phần mềm"
                                />
                            </div>
                            <div className="form-group">
                                <label>🎓 Học vấn</label>
                                <input
                                    type="text"
                                    name="education"
                                    value={profileDetails.education}
                                    onChange={handleDetailChange}
                                    placeholder="VD: ĐH Bách Khoa"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>🔮 Cung hoàng đạo</label>
                                <select name="zodiac" value={profileDetails.zodiac} onChange={handleDetailChange}>
                                    {ZODIAC_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>💕 Đang tìm kiếm</label>
                                <select name="lookingFor" value={profileDetails.lookingFor} onChange={handleDetailChange}>
                                    {LOOKING_FOR_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    <div className="section-divider"></div>

                    {/* ===== SECTION 5: THIẾT LẬP KHÁM PHÁ ===== */}
                    <section className="discovery-section">
                        <h3>🎯 Thiết lập khám phá</h3>
                        <p className="section-hint">Bạn muốn tìm kiếm người như thế nào?</p>

                        <div className="form-group">
                            <label>Tôi muốn tìm</label>
                            <select name="genderPreference" value={formData.genderPreference} onChange={handleChange}>
                                <option value="male">Chỉ Nam</option>
                                <option value="female">Chỉ Nữ</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Độ tuổi: {formData.minAge} - {formData.maxAge}</label>
                            <div className="range-controls">
                                <input
                                    type="range"
                                    name="minAge"
                                    min="18"
                                    max="100"
                                    value={formData.minAge}
                                    onChange={handleChange}
                                />
                                <input
                                    type="range"
                                    name="maxAge"
                                    min="18"
                                    max="100"
                                    value={formData.maxAge}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </section>

                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? '⏳ Đang lưu...' : '💾 Lưu tất cả thay đổi'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;
