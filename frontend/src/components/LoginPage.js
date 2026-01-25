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

            // 1. Gọi API đăng nhập (chúng ta sẽ tạo hàm login này trong apiService sau)
            const response = await apiService.login(userId);

            if (response.success) {
                // 2. Nếu thành công, gọi hàm login của AuthContext để lưu dữ liệu
                login(response.data.user, response.data.token);

                // 3. Chuyển hướng sang trang Swipe (Khám phá)
                navigate('/swipe');
            } else {
                setError(response.message || 'Đăng nhập thất bại');
            }
        } catch (err) {
            setError(err.message || 'Người dùng không tồn tại hoặc lỗi server');
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
                            placeholder="Ví dụ: user1, user2..."
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Đang kiểm tra...' : 'Bắt đầu ngay'}
                    </button>
                </form>

                <div className="login-hint">
                    <p>Gợi ý: Thử dùng <strong>user1</strong> đến <strong>user10</strong></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
