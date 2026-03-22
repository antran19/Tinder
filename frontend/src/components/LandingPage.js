import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const stories = [
        {
            names: 'Minh & Thảo',
            image: '💑',
            quote: '"Mình và Thảo match trên Tinder vào một buổi tối bình thường. Bây giờ chúng mình đã bên nhau 2 năm rồi. Cảm ơn Tinder đã kết nối chúng mình!"',
            color: '#fd267a'
        },
        {
            names: 'Huy & Ân',
            image: '💏',
            quote: '"Mình và anh xã gặp nhau qua Tinder. Chuyện tụi mình match nhau cũng hài lắm. Ban đầu, mình ấn tượng tấm hình selfie siêu dễ thương..."',
            color: '#ff6036'
        },
        {
            names: 'Lan & Tuấn',
            image: '👫',
            quote: '"Tinder giúp mình tìm được người bạn đời tuyệt vời. Từ lần hẹn đầu tiên đến giờ, mỗi ngày bên nhau đều là một ngày hạnh phúc."',
            color: '#a855f7'
        },
        {
            names: 'Chia sẻ câu chuyện',
            image: '💌',
            quote: 'Chia sẻ câu chuyện của mình hoặc đọc thêm nhiều câu chuyện khác',
            isLink: true,
            color: '#667eea'
        }
    ];

    const features = [
        {
            icon: '🔥',
            title: 'Swipe Right™',
            desc: 'Vuốt phải để thích, vuốt trái để bỏ qua. Đơn giản nhưng hiệu quả.'
        },
        {
            icon: '💬',
            title: 'Nhắn tin',
            desc: 'Kết nối và trò chuyện real-time với những người bạn đã match.'
        },
        {
            icon: '⭐',
            title: 'Super Like',
            desc: 'Cho người ấy biết bạn thực sự quan tâm với Super Like đặc biệt.'
        },
        {
            icon: '🛡️',
            title: 'An toàn',
            desc: 'Xác minh hồ sơ, báo cáo và chặn - An toàn là ưu tiên hàng đầu.'
        }
    ];

    return (
        <div className="landing-page">
            {/* ===== NAVIGATION ===== */}
            <nav className={`landing-nav ${scrollY > 50 ? 'scrolled' : ''}`}>
                <div className="landing-nav-inner">
                    <div className="landing-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <span className="landing-logo-icon">🔥</span>
                        <span className="landing-logo-text">tinder</span>
                    </div>

                    <div className={`landing-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
                        <a href="#products" className="landing-nav-link">Sản phẩm</a>
                        <a href="#stories" className="landing-nav-link">Tìm hiểu</a>
                        <a href="#safety" className="landing-nav-link">An Toàn</a>
                        <a href="#footer" className="landing-nav-link">Hỗ trợ</a>
                        <a href="#download" className="landing-nav-link">Tải về</a>
                    </div>

                    <div className="landing-nav-right">
                        <button className="landing-lang-btn">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
                            </svg>
                            Ngôn ngữ
                        </button>
                        <button className="landing-login-btn" onClick={() => navigate('/login')}>
                            Đăng nhập
                        </button>
                    </div>

                    <button className="landing-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </nav>

            {/* ===== HERO SECTION ===== */}
            <section className="hero-section">
                {/* Background phones */}
                <div className="hero-phones" style={{ transform: `translateY(${scrollY * 0.15}px)` }}>
                    <div className="phone phone-1">
                        <div className="phone-screen">
                            <div className="phone-profile" style={{ background: 'linear-gradient(135deg, #ff9a9e, #fad0c4)' }}>
                                <div className="phone-avatar">L</div>
                                <span className="phone-name">Lan <small>21</small></span>
                                <div className="phone-actions-mini">
                                    <span className="mini-x">✕</span>
                                    <span className="mini-heart">♥</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="phone phone-2">
                        <div className="phone-screen">
                            <div className="phone-profile" style={{ background: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' }}>
                                <div className="phone-avatar">N</div>
                                <span className="phone-name">Ngọc <small>22</small></span>
                                <div className="phone-actions-mini">
                                    <span className="mini-x">✕</span>
                                    <span className="mini-heart">♥</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="phone phone-3">
                        <div className="phone-screen">
                            <div className="phone-profile" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                                <div className="phone-avatar">T</div>
                                <span className="phone-name">Thanh <small>25</small></span>
                                <div className="phone-actions-mini">
                                    <span className="mini-x">✕</span>
                                    <span className="mini-star">⭐</span>
                                    <span className="mini-heart">♥</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="phone phone-4">
                        <div className="phone-screen">
                            <div className="phone-profile" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                                <div className="phone-avatar">M</div>
                                <span className="phone-name">Mai <small>21</small></span>
                                <div className="phone-actions-mini">
                                    <span className="mini-x">✕</span>
                                    <span className="mini-heart">♥</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="phone phone-5">
                        <div className="phone-screen">
                            <div className="phone-profile" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                                <div className="phone-avatar">H</div>
                                <span className="phone-name">Huy <small>23</small></span>
                                <div className="phone-actions-mini">
                                    <span className="mini-x">✕</span>
                                    <span className="mini-heart">♥</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="phone phone-6">
                        <div className="phone-screen">
                            <div className="phone-profile" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>
                                <div className="phone-avatar">P</div>
                                <span className="phone-name">Phương <small>18</small></span>
                                <div className="phone-actions-mini">
                                    <span className="mini-x">✕</span>
                                    <span className="mini-heart">♥</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="phone phone-7">
                        <div className="phone-screen">
                            <div className="phone-profile" style={{ background: 'linear-gradient(135deg, #fa709a, #fee140)' }}>
                                <div className="phone-avatar">L</div>
                                <span className="phone-name">Linh <small>21</small></span>
                                <div className="phone-actions-mini">
                                    <span className="mini-x">✕</span>
                                    <span className="mini-heart">♥</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="phone phone-8">
                        <div className="phone-screen">
                            <div className="phone-profile" style={{ background: 'linear-gradient(135deg, #a8edea, #fed6e3)' }}>
                                <div className="phone-avatar">T</div>
                                <span className="phone-name">Tuệ <small>21</small></span>
                                <div className="phone-actions-mini">
                                    <span className="mini-x">✕</span>
                                    <span className="mini-heart">♥</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dark overlay */}
                <div className="hero-overlay"></div>

                {/* Floating emojis */}
                <div className="hero-emojis">
                    <span className="floating-emoji e1">❤️</span>
                    <span className="floating-emoji e2">💜</span>
                    <span className="floating-emoji e3">💙</span>
                    <span className="floating-emoji e4">💚</span>
                    <span className="floating-emoji e5">⭐</span>
                    <span className="floating-emoji e6">✨</span>
                </div>

                {/* Hero content */}
                <div className="hero-content">
                    <h1 className="hero-title">
                        Swipe Right<span className="tm">™</span>
                    </h1>
                    <button className="hero-cta" onClick={() => navigate('/register')}>
                        Tạo tài khoản
                    </button>
                </div>

                {/* Disclaimer */}
                <p className="hero-disclaimer">
                    Trong hình là người mẫu và chỉ mang tính minh họa.
                </p>
            </section>

            {/* ===== PRODUCTS / FEATURES ===== */}
            <section className="features-section" id="products">
                <div className="features-container">
                    <h2 className="section-title">Tại sao chọn Tinder?</h2>
                    <p className="section-subtitle">Ứng dụng hẹn hò phổ biến nhất thế giới với hơn 55 tỷ lượt match</p>

                    <div className="features-grid">
                        {features.map((feat, idx) => (
                            <div key={idx} className="feature-card" style={{ animationDelay: `${idx * 0.1}s` }}>
                                <div className="feature-icon">{feat.icon}</div>
                                <h3>{feat.title}</h3>
                                <p>{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TINDER PLANS ===== */}
            <section className="plans-section" id="plans">
                <div className="plans-container">
                    <h2 className="section-title">Mở khóa khả năng mới</h2>
                    <p className="section-subtitle">Nâng cấp để tận hưởng những tính năng độc quyền</p>

                    <div className="plans-grid">
                        <div className="plan-card">
                            <div className="plan-badge" style={{ background: '#667eea' }}>Tinder+</div>
                            <h3>Tinder Plus</h3>
                            <div className="plan-price">
                                <span className="price-amount">79,000đ</span>
                                <span className="price-period">/tháng</span>
                            </div>
                            <ul className="plan-features-list">
                                <li>✓ Swipe không giới hạn</li>
                                <li>✓ 5 Super Like/ngày</li>
                                <li>✓ 1 Boost/tháng</li>
                                <li>✓ Passport™ - Swipe toàn cầu</li>
                                <li>✓ Rewind - Hoàn tác swipe</li>
                            </ul>
                        </div>

                        <div className="plan-card featured">
                            <div className="plan-popular">PHỔ BIẾN NHẤT</div>
                            <div className="plan-badge" style={{ background: 'linear-gradient(135deg, #fd267a, #ff6036)' }}>Gold</div>
                            <h3>Tinder Gold</h3>
                            <div className="plan-price">
                                <span className="price-amount">149,000đ</span>
                                <span className="price-period">/tháng</span>
                            </div>
                            <ul className="plan-features-list">
                                <li>✓ Tất cả tính năng Plus</li>
                                <li>✓ Xem ai đã Like bạn</li>
                                <li>✓ Top Picks hàng ngày</li>
                                <li>✓ Super Like không giới hạn</li>
                                <li>✓ 1 Boost miễn phí/tháng</li>
                            </ul>
                        </div>

                        <div className="plan-card platinum">
                            <div className="plan-badge" style={{ background: 'linear-gradient(135deg, #c0c0c0, #808080)' }}>Platinum</div>
                            <h3>Tinder Platinum</h3>
                            <div className="plan-price">
                                <span className="price-amount">299,000đ</span>
                                <span className="price-period">/tháng</span>
                            </div>
                            <ul className="plan-features-list">
                                <li>✓ Tất cả tính năng Gold</li>
                                <li>✓ Tin nhắn trước khi match</li>
                                <li>✓ Ưu tiên Like cao nhất</li>
                                <li>✓ 3 Boosts miễn phí/tháng</li>
                                <li>✓ Badge Platinum đặc biệt</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== SUCCESS STORIES ===== */}
            <section className="stories-section" id="stories">
                <div className="stories-container">
                    <h2 className="section-title">Câu chuyện thành công</h2>
                    <p className="section-subtitle">Hàng triệu câu chuyện tình yêu bắt đầu từ Tinder</p>

                    <div className="stories-grid">
                        {stories.map((story, idx) => (
                            <div key={idx} className={`story-card ${story.isLink ? 'story-link-card' : ''}`}>
                                <div className="story-image" style={{ background: `linear-gradient(135deg, ${story.color}, ${story.color}88)` }}>
                                    <span className="story-emoji">{story.image}</span>
                                </div>
                                <div className="story-content">
                                    <h4>{story.names}</h4>
                                    <p>{story.quote}</p>
                                    {story.isLink ? (
                                        <span className="story-link-text">Tinder Swipe Stories →</span>
                                    ) : (
                                        <span className="story-read-more">Đọc tiếp →</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== SAFETY SECTION ===== */}
            <section className="safety-section" id="safety">
                <div className="safety-container">
                    <div className="safety-content">
                        <h2>An toàn khi hẹn hò</h2>
                        <p>Chúng tôi cam kết giúp bạn có trải nghiệm an toàn. Tìm hiểu về các công cụ và chính sách bảo vệ người dùng của chúng tôi.</p>
                        <button className="safety-btn" onClick={() => navigate('/register')}>
                            Tìm hiểu thêm
                        </button>
                    </div>
                    <div className="safety-cards">
                        <div className="safety-card">
                            <span>📋</span>
                            <h4>Hướng dẫn cộng đồng</h4>
                        </div>
                        <div className="safety-card">
                            <span>🛡️</span>
                            <h4>Mẹo an toàn</h4>
                        </div>
                        <div className="safety-card">
                            <span>📞</span>
                            <h4>Tài nguyên an toàn</h4>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== DOWNLOAD SECTION ===== */}
            <section className="download-section" id="download">
                <div className="download-container">
                    <h2>Tải Tinder ngay</h2>
                    <p>Bắt đầu hành trình tìm kiếm tình yêu chỉ với một cú swipe</p>
                    <div className="download-buttons">
                        <button className="store-btn apple">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                            <div>
                                <small>Tải về trên</small>
                                <strong>App Store</strong>
                            </div>
                        </button>
                        <button className="store-btn google">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M3.609 1.814L13.792 12 3.609 22.186a.996.996 0 01-.609-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302L7.864 18.143l8.635-8.635zM14.5 12L5.865 3.365l10.937 6.333L14.5 12z"/></svg>
                            <div>
                                <small>TẢI NỘI DUNG TRÊN</small>
                                <strong>Google Play</strong>
                            </div>
                        </button>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="landing-footer" id="footer">
                <div className="footer-container">
                    <div className="footer-grid">
                        <div className="footer-col">
                            <h5>Pháp Lý</h5>
                            <a href="#">Quyền Riêng Tư</a>
                            <a href="#">Chính sách Quyền riêng tư về Dữ liệu</a>
                            <a href="#">Sức khỏe Người tiêu dùng</a>
                            <a href="#">Điều khoản</a>
                            <a href="#">Chính sách Cookie</a>
                            <a href="#">Sở Hữu Trí Tuệ</a>
                        </div>
                        <div className="footer-col">
                            <h5>Nghề Nghiệp</h5>
                            <a href="#">Cổng thông tin Nghề nghiệp</a>
                            <a href="#">Blog Công Nghệ</a>
                        </div>
                        <div className="footer-col">
                            <h5>Mạng Xã Hội</h5>
                            <div className="social-icons">
                                <a href="#" className="social-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
                                </a>
                                <a href="#" className="social-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z"/></svg>
                                </a>
                                <a href="#" className="social-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
                                </a>
                                <a href="#" className="social-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                </a>
                            </div>
                        </div>
                        <div className="footer-col">
                            <h5>Hỗ trợ</h5>
                            <a href="#">Câu Hỏi Thường Gặp</a>
                            <a href="#">Các điểm đến</a>
                            <a href="#">Khu Vực Báo Chí</a>
                            <a href="#">Liên Hệ</a>
                            <a href="#">Mã Khuyến Mãi</a>
                        </div>
                    </div>

                    <div className="footer-download">
                        <span>Tải ứng dụng!</span>
                        <button className="footer-store">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                            App Store
                        </button>
                        <button className="footer-store">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M3.609 1.814L13.792 12 3.609 22.186a.996.996 0 01-.609-.92V2.734a1 1 0 01.609-.92z"/></svg>
                            Google Play
                        </button>
                    </div>

                    <div className="footer-text">
                        <p>
                            Gửi những ai còn độc thân: Nếu bạn đang tìm kiếm người yêu, muốn bắt đầu hẹn hò, hay chỉ đơn giản là muốn có thêm bạn, bạn có mặt trên Tinder. 
                            Với hơn 55 tỷ lượt tương hợp thành công, Tinder chính là nơi để gặp gỡ tương hợp tốt nhất tiếp theo của bạn. Chân thành mà nói, 
                            không gì sánh bằng Tinder — ứng dụng hẹn hò miễn phí phổ biến nhất trên thế giới, hàng triệu người độc thân tuyệt vời đang gặp gỡ trực tuyến.
                        </p>
                    </div>

                    <div className="footer-bottom">
                        <div className="footer-bottom-links">
                            <a href="#">Câu Hỏi Thường Gặp</a>
                            <span>/</span>
                            <a href="#">Bí quyết An toàn</a>
                            <span>/</span>
                            <a href="#">Điều khoản</a>
                            <span>/</span>
                            <a href="#">Chính sách Cookie</a>
                            <span>/</span>
                            <a href="#">Cài đặt Quyền Riêng Tư</a>
                        </div>
                        <p className="footer-copyright">© 2026 Tinder LLC. Bảo lưu mọi quyền.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
