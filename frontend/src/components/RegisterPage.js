import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import './LoginPage.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        userId: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        birthday: '',
        gender: 'male'
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const processedValue = name === 'userId' ? value.replace(/\s/g, '') : value;
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu nhập lại không khớp');
            return;
        }
        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const response = await apiService.register({
                userId: formData.userId,
                password: formData.password,
                firstName: formData.firstName,
                birthday: formData.birthday,
                gender: formData.gender
            });

            if (response.success) {
                login(response.data.user, response.data.token);
                navigate('/swipe');
            }
        } catch (err) {
            setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Animated background */}
            <div className="login-bg">
                <div className="login-bg-gradient"></div>
                <div className="login-bg-circles">
                    <div className="circle c1"></div>
                    <div className="circle c2"></div>
                    <div className="circle c3"></div>
                </div>
            </div>

            <div className="login-container">
                {/* Logo & Branding */}
                <div className="login-branding">
                    <div className="login-logo-flame">🔥</div>
                    <h1 className="login-title">tinder</h1>
                </div>

                {/* Register Card */}
                <div className="login-card">
                    <h2 className="register-heading">Tạo tài khoản</h2>
                    <p className="register-subtitle">Bắt đầu hành trình tìm kiếm tình yêu</p>

                    <form onSubmit={handleSubmit}>
                        <div className="login-input-group">
                            {/* User ID */}
                            <div className="login-input-wrap">
                                <svg viewBox="0 0 24 24" className="input-icon" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                    <circle cx="10" cy="7" r="4"/>
                                    <path d="M19 8v6M22 11h-6"/>
                                </svg>
                                <input
                                    type="text"
                                    name="userId"
                                    value={formData.userId}
                                    onChange={handleChange}
                                    placeholder="Tên đăng nhập"
                                    required
                                    autoComplete="username"
                                />
                            </div>

                            {/* First Name */}
                            <div className="login-input-wrap">
                                <svg viewBox="0 0 24 24" className="input-icon" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
                                </svg>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Tên hiển thị"
                                    required
                                />
                            </div>

                            {/* Birthday */}
                            <div className="login-input-wrap">
                                <svg viewBox="0 0 24 24" className="input-icon" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                <input
                                    type="date"
                                    name="birthday"
                                    value={formData.birthday}
                                    onChange={handleChange}
                                    placeholder="Ngày sinh"
                                    required
                                />
                            </div>

                            {/* Gender Toggle */}
                            <div className="gender-toggle-group">
                                <span className="gender-label">Giới tính</span>
                                <div className="gender-toggle">
                                    <button
                                        type="button"
                                        className={`gender-option ${formData.gender === 'male' ? 'active' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                                    >
                                        👨 Nam
                                    </button>
                                    <button
                                        type="button"
                                        className={`gender-option ${formData.gender === 'female' ? 'active' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                                    >
                                        👩 Nữ
                                    </button>
                                    <div 
                                        className="gender-slider"
                                        style={{ transform: formData.gender === 'female' ? 'translateX(100%)' : 'translateX(0)' }}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="login-input-wrap">
                                <svg viewBox="0 0 24 24" className="input-icon" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                                </svg>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Mật khẩu (ít nhất 6 ký tự)"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>

                            {/* Confirm Password */}
                            <div className="login-input-wrap">
                                <svg viewBox="0 0 24 24" className="input-icon" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                </svg>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Xác nhận mật khẩu"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="login-error">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? (
                                <div className="login-btn-loading">
                                    <div className="login-spinner"></div>
                                </div>
                            ) : 'TẠO TÀI KHOẢN'}
                        </button>
                    </form>
                </div>

                {/* Login link */}
                <div className="login-footer">
                    <p>Đã có tài khoản? <span onClick={() => navigate('/login')}>Đăng nhập ngay</span></p>
                </div>

                {/* Policy */}
                <p className="login-policy">
                    Bằng cách đăng ký, bạn đồng ý với <a href="#">Điều khoản</a> của chúng tôi.
                    Tìm hiểu cách chúng tôi xử lý dữ liệu trong <a href="#">Chính sách quyền riêng tư</a>.
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
