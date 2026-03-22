import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import './LoginPage.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');
            const response = await apiService.login(userId.trim(), password);
            if (response.success) {
                login(response.data.user, response.data.token);
                navigate('/swipe');
            }
        } catch (err) {
            setError(err.message || 'Đăng nhập thất bại');
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

                {/* Login Card */}
                <div className="login-card">
                    <form onSubmit={handleLogin}>
                        <div className="login-input-group">
                            <div className="login-input-wrap">
                                <svg viewBox="0 0 24 24" className="input-icon" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
                                </svg>
                                <input
                                    type="text"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    placeholder="Tên đăng nhập"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                            <div className="login-input-wrap">
                                <svg viewBox="0 0 24 24" className="input-icon" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                                </svg>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mật khẩu"
                                    required
                                    autoComplete="current-password"
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
                            ) : 'ĐĂNG NHẬP'}
                        </button>
                    </form>

                    <div className="login-divider">
                        <span>hoặc</span>
                    </div>

                    <button className="social-login-btn google" onClick={() => {}}>
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Đăng nhập bằng Google
                    </button>

                    <button className="social-login-btn facebook" onClick={() => {}}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Đăng nhập bằng Facebook
                    </button>
                </div>

                {/* Register link */}
                <div className="login-footer">
                    <p>Chưa có tài khoản? <span onClick={() => navigate('/register')}>Đăng ký ngay</span></p>
                </div>

                {/* Policy */}
                <p className="login-policy">
                    Khi đăng nhập, bạn đồng ý với <a href="#">Điều khoản</a> của chúng tôi. 
                    Tìm hiểu cách chúng tôi xử lý dữ liệu trong <a href="#">Chính sách quyền riêng tư</a>.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
