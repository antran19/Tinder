import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import './LoginPage.css'; // Use same styles as login

const RegisterPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    // Form Data State
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

    // Handle Input Change
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Tự động xóa khoảng trắng cho userId
        const processedValue = name === 'userId' ? value.replace(/\s/g, '') : value;
        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));
    };

    // Handle Submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Basic Validation
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

            // 2. Call API Register
            const response = await apiService.register({
                userId: formData.userId,
                password: formData.password,
                firstName: formData.firstName,
                birthday: formData.birthday,
                gender: formData.gender
            });

            if (response.success) {
                // 3. Auto Login after register
                console.log('Register success:', response.data.user.userId);
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
            <div className="login-card register-card">
                <h2>Đăng Ký Tài Khoản</h2>
                <p className="subtitle">Tham gia cộng đồng hẹn hò ngay hôm nay</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tên đăng nhập (ID)</label>
                        <input
                            type="text"
                            name="userId"
                            value={formData.userId}
                            onChange={handleChange}
                            placeholder="Ví dụ: tuan_123"
                            required
                        />
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                            * Chỉ dùng chữ cái, số và dấu gạch dưới (không khoảng trắng)
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Tên hiển thị</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Tên thật của bạn"
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
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Ít nhất 6 ký tự"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Nhập lại mật khẩu</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Xác nhận mật khẩu"
                            required
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="login-btn register-btn" disabled={loading}>
                        {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký'}
                    </button>
                </form>

                <div className="register-link">
                    Đã có tài khoản? <span onClick={() => navigate('/login')}>Đăng nhập ngay</span>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
