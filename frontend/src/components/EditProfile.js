import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import './EditProfile.css';

/**
 * EditProfile Component
 * Cho phép người dùng chỉnh sửa thông tin cá nhân (Tên, Bio, Ngày sinh, Giới tính)
 */
const EditProfile = () => {
    const { user, updateUserData } = useAuth();

    // Khởi tạo state từ dữ liệu user hiện tại
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        bio: user?.bio || '',
        birthday: user?.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
        gender: user?.gender || 'male',
        // Mới: Khám phá
        genderPreference: user?.preferences?.genderPreference || (user?.gender === 'male' ? 'female' : 'male'),
        minAge: user?.preferences?.ageRange?.min || 18,
        maxAge: user?.preferences?.ageRange?.max || 50,
    });

    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        // Cấu trúc lại data theo schema backend mong muốn
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
            }
        };

        try {
            const response = await apiService.updateProfile(user.userId, updateBody);

            if (response.success) {
                // Cập nhật lại dữ liệu trong Context toàn cục
                updateUserData(response.data.user);
                setStatus({ type: 'success', message: 'Hồ sơ đã được cập nhật thành công! ✨' });
            }
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="edit-profile-container">
            <div className="edit-profile-card">
                <h2>Chỉnh sửa hồ sơ</h2>
                <p className="subtitle">Cập nhật thông tin bản thân và tiêu chí tìm kiếm</p>

                <form onSubmit={handleSubmit}>
                    <section className="profile-section">
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
                                <label>Giới tính của bạn</label>
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
                                rows="4"
                            ></textarea>
                            <small className="char-count">{formData.bio.length}/500</small>
                        </div>
                    </section>

                    <div className="section-divider"></div>

                    <section className="discovery-section">
                        <h3>Thiết lập khám phá 🎯</h3>
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

                    {status.message && (
                        <div className={`status-message ${status.type}`}>
                            {status.message}
                        </div>
                    )}

                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;
