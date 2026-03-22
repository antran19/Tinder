import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './VerificationBadge.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const VerificationBadge = ({ onClose }) => {
    const { user } = useAuth();
    const [step, setStep] = useState('intro'); // intro | capture | uploading | submitted | result
    const [selfieFile, setSelfieFile] = useState(null);
    const [selfiePreview, setSelfiePreview] = useState('');
    const [verificationStatus, setVerificationStatus] = useState('none');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/verification/status/${user.userId}`);
            const data = await res.json();
            if (data.success) {
                setVerificationStatus(data.data.verification?.status || 'none');
                if (data.data.isVerified) setStep('result');
                else if (data.data.verification?.status === 'pending') setStep('submitted');
                else if (data.data.verification?.status === 'rejected') setStep('intro');
            }
        } catch (err) {
            console.error('Error checking verification:', err);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('Ảnh tối đa 5MB');
            return;
        }
        setSelfieFile(file);
        setSelfiePreview(URL.createObjectURL(file));
        setStep('capture');
        setError('');
    };

    const handleSubmit = async () => {
        if (!selfieFile) return;
        setLoading(true);
        setError('');

        try {
            // Upload selfie
            const formData = new FormData();
            formData.append('image', selfieFile);

            const uploadRes = await fetch(`${API_BASE_URL}/api/upload/image`, {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();

            if (!uploadData.success) {
                setError('Lỗi upload ảnh');
                setLoading(false);
                return;
            }

            // Submit verification
            const res = await fetch(`${API_BASE_URL}/api/verification/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.userId,
                    selfieUrl: uploadData.data?.url || uploadData.url
                })
            });
            const data = await res.json();

            if (data.success) {
                setStep('submitted');
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Lỗi kết nối server');
        }
        setLoading(false);
    };

    return (
        <div className="verification-modal-overlay" onClick={onClose}>
            <div className="verification-modal" onClick={e => e.stopPropagation()}>
                {step === 'intro' && (
                    <>
                        <div className="verification-header">
                            <div className="verified-big-icon">✅</div>
                            <h2>Xác minh tài khoản</h2>
                            <p>Nhận tích xanh và tăng 86% tỉ lệ match!</p>
                        </div>

                        <div className="verification-benefits">
                            <div className="benefit-item">
                                <span>🛡️</span>
                                <div><strong>Đáng tin cậy</strong><p>Người khác biết bạn là thật</p></div>
                            </div>
                            <div className="benefit-item">
                                <span>💕</span>
                                <div><strong>Nhiều match hơn</strong><p>Profile verified được ưu tiên hiển thị</p></div>
                            </div>
                            <div className="benefit-item">
                                <span>⭐</span>
                                <div><strong>Badge tích xanh</strong><p>Hiển thị trên profile và swipe card</p></div>
                            </div>
                        </div>

                        <div className="verification-instructions">
                            <h4>📸 Hướng dẫn:</h4>
                            <ol>
                                <li>Chụp selfie rõ mặt, không đeo kính râm</li>
                                <li>Ánh sáng đủ, không bị che khuất</li>
                                <li>Khuôn mặt phải trùng khớp với ảnh profile</li>
                            </ol>
                        </div>

                        {verificationStatus === 'rejected' && (
                            <div className="verification-rejected-notice">
                                ⚠️ Yêu cầu trước bị từ chối. Hãy thử lại với ảnh rõ mặt hơn.
                            </div>
                        )}

                        <label className="verification-upload-btn">
                            <input type="file" accept="image/*" onChange={handleFileSelect} hidden />
                            📷 Chọn ảnh selfie
                        </label>

                        <button className="verification-cancel" onClick={onClose}>Để sau</button>
                    </>
                )}

                {step === 'capture' && (
                    <>
                        <h3>📸 Xác nhận ảnh selfie</h3>
                        
                        <div className="selfie-preview-container">
                            <img src={selfiePreview} alt="Selfie preview" className="selfie-preview" />
                        </div>

                        {error && <p className="verification-error">{error}</p>}

                        <div className="verification-actions">
                            <label className="verification-retake">
                                <input type="file" accept="image/*" onChange={handleFileSelect} hidden />
                                🔄 Chọn lại
                            </label>
                            <button 
                                className="verification-submit" 
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? '⏳ Đang gửi...' : '✅ Gửi xác minh'}
                            </button>
                        </div>
                    </>
                )}

                {step === 'submitted' && (
                    <div className="verification-result">
                        <div className="result-icon pending">⏳</div>
                        <h3>Đã gửi yêu cầu!</h3>
                        <p>Admin sẽ xem xét và duyệt trong vòng 24 giờ. Bạn sẽ nhận thông báo khi có kết quả.</p>
                        <button className="verification-done" onClick={onClose}>Đóng</button>
                    </div>
                )}

                {step === 'result' && (
                    <div className="verification-result">
                        <div className="result-icon success">✅</div>
                        <h3>Đã xác minh!</h3>
                        <p>Tài khoản của bạn đã có tích xanh. Profile sẽ được ưu tiên hiển thị!</p>
                        <button className="verification-done" onClick={onClose}>Tuyệt vời!</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerificationBadge;
