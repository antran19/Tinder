import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiService } from '../services/apiService';
import NotificationCenter from './NotificationCenter';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dating_theme') || 'dark';
  });

  // Áp dụng theme khi component mount và khi theme thay đổi
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dating_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (user) {
      updateUnreadCount();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleNewNotify = () => {
        setUnreadCount(prev => prev + 1);
      };
      socket.on('new-notification', handleNewNotify);
      return () => socket.off('new-notification', handleNewNotify);
    }
  }, [socket]);

  // Đóng user menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đóng mobile menu khi chuyển trang
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location]);

  const updateUnreadCount = async () => {
    try {
      const data = await apiService.getNotifications(user.userId);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error(error);
    }
  };

  const navLinks = [
    { to: '/swipe', label: 'Swipe', icon: '🔥' },
    { to: '/discover', label: 'Khám phá', icon: '🌍' },
    { to: '/matches', label: 'Matches', icon: '💬' },
    { to: '/who-liked', label: 'Ai thích bạn', icon: '👀' },
    { to: '/insights', label: 'Thống kê', icon: '📊' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/swipe" className="nav-logo">
          <span className="nav-logo-icon">🔥</span>
          <span className="nav-logo-text">Dating App</span>
        </Link>

        {/* Mobile Menu Toggle */}
        <button 
          className={`mobile-menu-btn ${showMobileMenu ? 'active' : ''}`} 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Nav Links */}
        <div className={`nav-links ${showMobileMenu ? 'mobile-open' : ''}`}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              <span className="nav-link-icon">{link.icon}</span>
              <span className="nav-link-label">{link.label}</span>
            </Link>
          ))}
          <Link
            to="/premium"
            className={`nav-link premium-link ${location.pathname === '/premium' ? 'active' : ''}`}
          >
            <span className="nav-link-icon">⭐</span>
            <span className="nav-link-label">Premium</span>
          </Link>
        </div>

        {user && (
          <div className="nav-user">
            {/* Theme Toggle */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Notification Bell */}
            <div className="nav-notify-container" onClick={() => setShowNotifications(!showNotifications)}>
              <span className="nav-bell">🔔</span>
              {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
            </div>

            {/* User Avatar Dropdown */}
            <div className="nav-user-dropdown" ref={userMenuRef}>
              <button 
                className="nav-avatar-btn" 
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="nav-avatar">
                  {user.firstName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="nav-avatar-name">{user.firstName}</span>
                <span className={`nav-avatar-arrow ${showUserMenu ? 'open' : ''}`}>▾</span>
              </button>

              {showUserMenu && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-info">
                    <div className="dropdown-avatar">
                      {user.firstName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h4>{user.firstName}</h4>
                      <span>@{user.userId}</span>
                      <span className={`dropdown-tier ${user?.subscription?.tier || 'free'}`}>
                        {user?.subscription?.tier === 'gold' ? '👑 Gold' :
                         user?.subscription?.tier === 'premium' ? '⭐ Premium' : '🆓 Free'}
                      </span>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    ✏️ Chỉnh sửa hồ sơ
                  </Link>
                  <Link to="/settings" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    ⚙️ Cài đặt
                  </Link>
                  <Link to="/insights" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    📊 Thống kê
                  </Link>
                  <Link to="/premium" className="dropdown-item premium-item" onClick={() => setShowUserMenu(false)}>
                    ⭐ Nâng cấp Premium
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-item" onClick={logout}>
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          updateUnreadCount();
        }}
      />
    </nav>
  );
};

export default Navigation;