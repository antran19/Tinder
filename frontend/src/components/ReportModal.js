import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './ReportModal.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const REASONS = [
    { value: 'fake_profile', label: '🎭 Hồ sơ giả mạo', desc: 'Sử dụng ảnh/thông tin của người khác' },
    { value: 'harassment', label: '😤 Quấy rối', desc: 'Tin nhắn xúc phạm, đe dọa' },
    { value: 'spam', label: '📢 Spam', desc: 'Gửi quảng cáo, link lạ' },
    { value: 'inappropriate_content', label: '🔞 Nội dung không phù hợp', desc: 'Ảnh/video vi phạm' },
    { value: 'underage', label: '👶 Chưa đủ tuổi', desc: 'Nghi ngờ dưới 18 tuổi' },
    { value: 'scam', label: '💰 Lừa đảo', desc: 'Có dấu hiệu lừa tiền' },
    { value: 'other', label: '📝 Lý do khác', desc: '' },
];

const ReportModal = ({ targetUser, onClose, onBlocked }) => {
    const { user } = useAuth();
    const [step, setStep] = useState('choose'); // choose | reason | success
    const [action, setAction] = useState(''); // report | block
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReport = async () => {
        if (!reason) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reporterId: user.userId,
                    reportedUserId: targetUser.userId,
                    reason,
                    description
                })
            });
            const data = await res.json();
            if (data.success) {
                setStep('success');
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Lỗi gửi báo cáo');
        }
        setLoading(false);
    };

    const handleBlock = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/reports/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.userId,
                    blockedUserId: targetUser.userId
                })
            });
            const data = await res.json();
            if (data.success) {
                setStep('blocked');
                if (onBlocked) onBlocked(targetUser.userId);
            }
        } catch (err) {
            alert('Lỗi chặn user');
        }
        setLoading(false);
    };

    return (
        <div className="report-modal-overlay" onClick={onClose}>
            <div className="report-modal" onClick={e => e.stopPropagation()}>
                {step === 'choose' && (
                    <>
                        <h3>⚠️ {targetUser.firstName || targetUser.userId}</h3>
                        <p className="report-subtitle">Bạn muốn làm gì?</p>
                        
                        <button className="report-action-btn report" onClick={() => { setAction('report'); setStep('reason'); }}>
                            <span>🚩</span>
                            <div>
                                <strong>Báo cáo</strong>
                                <p>Người này vi phạm quy tắc cộng đồng</p>
                            </div>
                        </button>

                        <button className="report-action-btn block" onClick={handleBlock} disabled={loading}>
                            <span>🚫</span>
                            <div>
                                <strong>Chặn</strong>
                                <p>Ẩn vĩnh viễn khỏi danh sách của bạn</p>
                            </div>
                        </button>

                        <button className="report-cancel-btn" onClick={onClose}>Hủy</button>
                    </>
                )}

                {step === 'reason' && (
                    <>
                        <h3>🚩 Lý do báo cáo</h3>
                        <div className="report-reasons">
                            {REASONS.map(r => (
                                <label key={r.value} className={`reason-item ${reason === r.value ? 'selected' : ''}`}>
                                    <input 
                                        type="radio" 
                                        name="reason" 
                                        value={r.value} 
                                        checked={reason === r.value}
                                        onChange={() => setReason(r.value)} 
                                    />
                                    <div>
                                        <strong>{r.label}</strong>
                                        {r.desc && <p>{r.desc}</p>}
                                    </div>
                                </label>
                            ))}
                        </div>

                        {reason === 'other' && (
                            <textarea 
                                className="report-description"
                                placeholder="Mô tả chi tiết..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                            />
                        )}

                        <div className="report-buttons">
                            <button className="report-back-btn" onClick={() => setStep('choose')}>← Quay lại</button>
                            <button 
                                className="report-submit-btn" 
                                onClick={handleReport} 
                                disabled={!reason || loading}
                            >
                                {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
                            </button>
                        </div>
                    </>
                )}

                {step === 'success' && (
                    <div className="report-success">
                        <div className="success-icon">✅</div>
                        <h3>Đã gửi báo cáo!</h3>
                        <p>Cảm ơn bạn đã giúp cộng đồng an toàn hơn. Chúng tôi sẽ xem xét trong 24h.</p>
                        <button className="report-done-btn" onClick={onClose}>Đóng</button>
                    </div>
                )}

                {step === 'blocked' && (
                    <div className="report-success">
                        <div className="success-icon">🚫</div>
                        <h3>Đã chặn!</h3>
                        <p>{targetUser.firstName || targetUser.userId} sẽ không xuất hiện trong danh sách của bạn nữa.</p>
                        <button className="report-done-btn" onClick={onClose}>Đóng</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportModal;
