/**
 * LoginPage Component
 * Giao diện đăng nhập đơn giản cho người dùng
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import './LoginPage.css';

const LoginPage = () => {
    const [userId, setUserId] = useState(''); // Lưu những gì người dùng gõ
    const [password, setPassword] = useState(''); // Mới: Lưu password
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); // Ngăn trang web load lại khi nhấn nút

        if (!userId.trim()) {
            setError('Vui lòng nhập Username/ID');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // 1. Gọi API đăng nhập (giờ đã có password)
            const response = await apiService.login(userId, password);

            if (response.success) {
                // 2. Nếu thành công, gọi hàm login của AuthContext để lưu dữ liệu
                login(response.data.user, response.data.token);

                // 3. Chuyển hướng sang trang Swipe (Khám phá)
                navigate('/swipe');
            } else {
                setError(response.message || 'Đăng nhập thất bại');
            }
        } catch (err) {
            setError(err.message || 'Tài khoản không chính xác hoặc lỗi server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">🔥</div>
                <h1>Dating App</h1>
                <p>Tìm kiếm một nửa của bạn</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username / ID</label>
                        <input
                            type="text"
                            placeholder="Nhập ID (Ví dụ: user1)"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Đang kiểm tra...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="register-link">
                    Chưa có tài khoản? <span onClick={() => navigate('/register')}>Đăng ký ngay</span>
                </div>

                <div className="login-hint">
                    <p>Gợi ý test: <strong>user1</strong> (Không cần pass nếu TK cũ)</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
